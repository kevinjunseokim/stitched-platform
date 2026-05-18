"""Public profile lookup + PATCH /api/me."""


class TestPublicProfile:
    def test_profile_by_handle(self, client, auth_client, item_payload):
        owner = auth_client(displayName="Profile Personne", handle="profileperson")
        owner.post("/api/items", json={**item_payload, "visibility": "public"})

        response = client.get("/api/profiles/profileperson")
        assert response.status_code == 200
        body = response.get_json()
        assert body["user"]["handle"] == "profileperson"
        assert body["stats"]["pieces"] == 1
        assert body["stats"]["publicPieces"] == 1
        # Items list is the public-only subset.
        assert len(body["items"]) == 1

    def test_profile_excludes_private_items_from_items_list(self, client, auth_client, item_payload):
        owner = auth_client(handle="privuser")
        owner.post("/api/items", json={**item_payload, "visibility": "public", "title": "Public Bat"})
        owner.post("/api/items", json={**item_payload, "visibility": "private", "title": "Private Bat"})

        body = client.get("/api/profiles/privuser").get_json()
        titles = [i["title"] for i in body["items"]]
        assert "Public Bat" in titles
        assert "Private Bat" not in titles
        # Stats track the totals separately.
        assert body["stats"]["pieces"] == 2
        assert body["stats"]["publicPieces"] == 1

    def test_profile_owner_sees_private_items(self, auth_client, item_payload):
        owner = auth_client(handle="selfprivuser")
        owner.post("/api/items", json={**item_payload, "visibility": "public", "title": "Public Bat"})
        owner.post("/api/items", json={**item_payload, "visibility": "private", "title": "Private Bat"})

        body = owner.get("/api/profiles/selfprivuser").get_json()
        titles = [i["title"] for i in body["items"]]
        assert "Public Bat" in titles
        assert "Private Bat" in titles

    def test_profile_includes_followers_and_following(self, client, auth_client):
        target = auth_client(handle="targetuser")
        follower1 = auth_client()
        follower2 = auth_client()
        follower1.post("/api/follows", json={"targetType": "user", "targetId": target.user_id})
        follower2.post("/api/follows", json={"targetType": "user", "targetId": target.user_id})
        target.post("/api/follows", json={"targetType": "player", "targetId": "corbin-carroll"})

        body = client.get("/api/profiles/targetuser").get_json()
        assert body["stats"]["followers"] == 2
        assert body["stats"]["following"] == 1

    def test_profile_unknown_handle_404(self, client):
        response = client.get("/api/profiles/no-such-handle")
        assert response.status_code == 404


class TestUpdateMe:
    def test_update_display_name(self, auth_client):
        client = auth_client(displayName="Old Name")
        response = client.patch("/api/me", json={"displayName": "New Personality"})
        assert response.status_code == 200
        user = response.get_json()["user"]
        assert user["firstName"] == "New"
        assert user["lastName"] == "Personality"

    def test_update_bio(self, auth_client):
        client = auth_client()
        response = client.patch("/api/me", json={"bio": "Lifelong collector."})
        assert response.status_code == 200
        assert response.get_json()["user"]["bio"] == "Lifelong collector."

    def test_update_handle(self, auth_client):
        client = auth_client()
        response = client.patch("/api/me", json={"handle": "brandnewhandle"})
        assert response.status_code == 200
        assert response.get_json()["user"]["handle"] == "brandnewhandle"

    def test_invalid_handle_rejected(self, auth_client):
        client = auth_client()
        response = client.patch("/api/me", json={"handle": "no"})
        assert response.status_code == 400

    def test_handle_collision_rejected(self, auth_client):
        first = auth_client(handle="alreadytaken")
        second = auth_client()
        response = second.patch("/api/me", json={"handle": "alreadytaken"})
        assert response.status_code == 400
        assert first  # silence lint
