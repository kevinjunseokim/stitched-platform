"""Follows: player + user (by id and by handle), idempotency, notifications."""


class TestFollowPlayer:
    def test_follow_player_creates_row(self, auth_client):
        client = auth_client()
        response = client.post(
            "/api/follows", json={"targetType": "player", "targetId": "corbin-carroll"}
        )
        assert response.status_code == 201
        follow = response.get_json()["follow"]
        assert follow["targetType"] == "player"
        assert follow["targetId"] == "corbin-carroll"

    def test_follow_unknown_player_404(self, auth_client):
        client = auth_client()
        response = client.post(
            "/api/follows", json={"targetType": "player", "targetId": "ghost"}
        )
        assert response.status_code == 404

    def test_follow_player_idempotent(self, auth_client):
        client = auth_client()
        first = client.post(
            "/api/follows", json={"targetType": "player", "targetId": "corbin-carroll"}
        )
        second = client.post(
            "/api/follows", json={"targetType": "player", "targetId": "corbin-carroll"}
        )
        assert first.status_code == 201
        assert second.status_code == 200
        assert second.get_json()["alreadyFollowing"] is True

    def test_unfollow_player(self, auth_client):
        client = auth_client()
        client.post("/api/follows", json={"targetType": "player", "targetId": "corbin-carroll"})
        response = client.delete("/api/follows/player/corbin-carroll")
        assert response.status_code == 200

    def test_unfollow_when_not_following_is_no_op(self, auth_client):
        client = auth_client()
        response = client.delete("/api/follows/player/corbin-carroll")
        assert response.status_code == 200
        assert response.get_json()["message"] == "Not following"


class TestFollowUser:
    def test_follow_user_by_id(self, auth_client):
        alice = auth_client()
        bob = auth_client()
        response = alice.post(
            "/api/follows", json={"targetType": "user", "targetId": bob.user_id}
        )
        assert response.status_code == 201
        assert response.get_json()["follow"]["targetId"] == bob.user_id

    def test_follow_user_by_handle(self, auth_client):
        alice = auth_client()
        bob = auth_client()
        response = alice.post(
            "/api/follows", json={"targetType": "user", "targetId": bob.handle}
        )
        assert response.status_code == 201
        # Stored by id even when looked up by handle.
        assert response.get_json()["follow"]["targetId"] == bob.user_id

    def test_cannot_follow_self(self, auth_client):
        client = auth_client()
        response = client.post(
            "/api/follows", json={"targetType": "user", "targetId": client.user_id}
        )
        assert response.status_code == 400

    def test_follow_user_creates_notification_for_target(self, auth_client):
        alice = auth_client(displayName="Alice Alpha")
        bob = auth_client(displayName="Bob Beta")
        alice.post("/api/follows", json={"targetType": "user", "targetId": bob.user_id})

        notifs = bob.get("/api/notifications").get_json()
        assert notifs["unread"] >= 1
        kinds = [n["kind"] for n in notifs["notifications"]]
        assert "follower.new" in kinds

    def test_unfollow_user_by_handle(self, auth_client):
        alice = auth_client()
        bob = auth_client()
        alice.post("/api/follows", json={"targetType": "user", "targetId": bob.user_id})
        response = alice.delete(f"/api/follows/user/{bob.handle}")
        assert response.status_code == 200


class TestFollowsValidation:
    def test_invalid_target_type(self, auth_client):
        client = auth_client()
        response = client.post(
            "/api/follows", json={"targetType": "robot", "targetId": "x"}
        )
        assert response.status_code == 400

    def test_missing_target_id(self, auth_client):
        client = auth_client()
        response = client.post("/api/follows", json={"targetType": "player"})
        assert response.status_code == 400


class TestMyFollows:
    def test_returns_all_follows(self, auth_client):
        client = auth_client()
        client.post("/api/follows", json={"targetType": "player", "targetId": "corbin-carroll"})
        client.post("/api/follows", json={"targetType": "player", "targetId": "shohei-ohtani"})

        response = client.get("/api/me/follows")
        assert response.status_code == 200
        follows = response.get_json()["follows"]
        target_ids = {f["targetId"] for f in follows}
        assert {"corbin-carroll", "shohei-ohtani"}.issubset(target_ids)

    def test_filter_by_type(self, auth_client):
        alice = auth_client()
        bob = auth_client()
        alice.post("/api/follows", json={"targetType": "player", "targetId": "corbin-carroll"})
        alice.post("/api/follows", json={"targetType": "user", "targetId": bob.user_id})

        only_players = alice.get("/api/me/follows?type=player").get_json()["follows"]
        only_users = alice.get("/api/me/follows?type=user").get_json()["follows"]
        assert all(f["targetType"] == "player" for f in only_players)
        assert all(f["targetType"] == "user" for f in only_users)


class TestPublicFollowerEndpoints:
    def test_user_followers_lookup_by_handle(self, client, auth_client):
        alice = auth_client(displayName="Alice Alpha")
        bob = auth_client(displayName="Bob Beta")
        alice.post("/api/follows", json={"targetType": "user", "targetId": bob.user_id})

        response = client.get(f"/api/users/{bob.handle}/followers")
        assert response.status_code == 200
        body = response.get_json()
        assert body["count"] == 1
        follower_ids = {u["id"] for u in body["followers"]}
        assert alice.user_id in follower_ids

    def test_user_following_lookup_by_handle(self, client, auth_client):
        alice = auth_client(displayName="Alice Alpha")
        bob = auth_client(displayName="Bob Beta")
        alice.post("/api/follows", json={"targetType": "user", "targetId": bob.user_id})
        alice.post("/api/follows", json={"targetType": "player", "targetId": "corbin-carroll"})

        response = client.get(f"/api/users/{alice.handle}/following")
        assert response.status_code == 200
        body = response.get_json()
        assert body["count"] == 2

    def test_user_followers_404_for_unknown_handle(self, client):
        response = client.get("/api/users/no-such-handle/followers")
        assert response.status_code == 404
