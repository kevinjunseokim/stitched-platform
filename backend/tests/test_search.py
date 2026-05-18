"""Cross-entity search endpoint."""


class TestSearch:
    def test_empty_query_returns_empty_buckets(self, client):
        response = client.get("/api/search?q=")
        assert response.status_code == 200
        body = response.get_json()
        assert body == {"items": [], "players": [], "comps": [], "collectors": []}

    def test_player_match(self, client):
        response = client.get("/api/search?q=ohtani")
        body = response.get_json()
        names = [p["name"] for p in body["players"]]
        assert any("Ohtani" in n for n in names)

    def test_comp_match(self, client):
        response = client.get("/api/search?q=goldin")
        comps = response.get_json()["comps"]
        assert comps
        assert all("goldin" in (c["source"] or "").lower() for c in comps)

    def test_collector_match_by_handle(self, client, auth_client):
        auth_client(displayName="Searchable Sally", handle="searchsally")
        response = client.get("/api/search?q=searchsally")
        collectors = response.get_json()["collectors"]
        assert any(c["handle"] == "searchsally" for c in collectors)

    def test_anonymous_only_sees_public_items(self, client, auth_client, item_payload):
        owner = auth_client()
        owner.post(
            "/api/items",
            json={**item_payload, "title": "PrivateBat", "visibility": "private"},
        )
        owner.post(
            "/api/items",
            json={**item_payload, "title": "PublicBat", "visibility": "public"},
        )

        response = client.get("/api/search?q=Bat")
        titles = [i["title"] for i in response.get_json()["items"]]
        assert "PublicBat" in titles
        assert "PrivateBat" not in titles

    def test_owner_sees_their_private_items(self, auth_client, item_payload):
        owner = auth_client()
        owner.post(
            "/api/items",
            json={**item_payload, "title": "OwnerPrivateBat", "visibility": "private"},
        )
        response = owner.get("/api/search?q=OwnerPrivateBat")
        titles = [i["title"] for i in response.get_json()["items"]]
        assert "OwnerPrivateBat" in titles
