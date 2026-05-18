"""Watchlist entries and saved searches."""


class TestWatchlist:
    def test_create_player_entry(self, auth_client):
        client = auth_client()
        response = client.post(
            "/api/watchlist",
            json={
                "targetType": "player",
                "targetId": "corbin-carroll",
                "alertPct": 6.0,
                "alertFreq": "weekly",
                "channels": ["email", "push"],
            },
        )
        assert response.status_code == 201
        entry = response.get_json()["entry"]
        assert entry["targetType"] == "player"
        assert entry["alertFreq"] == "weekly"
        assert "email" in entry["channels"]

    def test_create_entry_is_idempotent(self, auth_client):
        client = auth_client()
        client.post(
            "/api/watchlist",
            json={"targetType": "player", "targetId": "shohei-ohtani"},
        )
        second = client.post(
            "/api/watchlist",
            json={"targetType": "player", "targetId": "shohei-ohtani"},
        )
        assert second.status_code == 200
        assert second.get_json()["alreadyWatching"] is True

    def test_invalid_target_type(self, auth_client):
        client = auth_client()
        response = client.post(
            "/api/watchlist",
            json={"targetType": "robot", "targetId": "x"},
        )
        assert response.status_code == 400

    def test_missing_target_id(self, auth_client):
        client = auth_client()
        response = client.post(
            "/api/watchlist",
            json={"targetType": "player"},
        )
        assert response.status_code == 400

    def test_list_hydrates_player(self, auth_client):
        client = auth_client()
        client.post(
            "/api/watchlist",
            json={"targetType": "player", "targetId": "corbin-carroll"},
        )
        response = client.get("/api/watchlist")
        assert response.status_code == 200
        entries = response.get_json()["entries"]
        assert entries
        assert entries[0]["player"]["name"] == "Corbin Carroll"

    def test_update_alert_freq(self, auth_client):
        client = auth_client()
        created = client.post(
            "/api/watchlist",
            json={"targetType": "player", "targetId": "corbin-carroll"},
        ).get_json()["entry"]
        response = client.patch(
            f"/api/watchlist/{created['id']}", json={"alertFreq": "realtime", "alertPct": 2.5}
        )
        assert response.status_code == 200
        updated = response.get_json()["entry"]
        assert updated["alertFreq"] == "realtime"
        assert updated["alertPct"] == 2.5

    def test_update_unknown_entry_404(self, auth_client):
        client = auth_client()
        response = client.patch("/api/watchlist/9999", json={"alertFreq": "daily"})
        assert response.status_code == 404

    def test_delete_entry(self, auth_client):
        client = auth_client()
        created = client.post(
            "/api/watchlist",
            json={"targetType": "player", "targetId": "corbin-carroll"},
        ).get_json()["entry"]
        response = client.delete(f"/api/watchlist/{created['id']}")
        assert response.status_code == 200
        # And the list is now empty.
        assert client.get("/api/watchlist").get_json()["entries"] == []

    def test_other_user_cannot_modify_entry(self, auth_client):
        alice = auth_client()
        bob = auth_client()
        created = alice.post(
            "/api/watchlist",
            json={"targetType": "player", "targetId": "corbin-carroll"},
        ).get_json()["entry"]
        # Bob can't touch Alice's entry.
        assert bob.patch(f"/api/watchlist/{created['id']}", json={}).status_code == 404
        assert bob.delete(f"/api/watchlist/{created['id']}").status_code == 404


class TestSavedSearches:
    def test_create_and_list(self, auth_client):
        client = auth_client()
        created = client.post(
            "/api/saved-searches",
            json={"name": "Rookie bats", "query": "rookie bat", "filters": {"sport": "MLB"}},
        )
        assert created.status_code == 201
        listing = client.get("/api/saved-searches")
        assert listing.status_code == 200
        items = listing.get_json()["savedSearches"]
        assert any(s["name"] == "Rookie bats" for s in items)

    def test_create_requires_name_or_query(self, auth_client):
        client = auth_client()
        response = client.post("/api/saved-searches", json={})
        assert response.status_code == 400

    def test_delete(self, auth_client):
        client = auth_client()
        created = client.post(
            "/api/saved-searches", json={"name": "trash", "query": "x"}
        ).get_json()["savedSearch"]
        response = client.delete(f"/api/saved-searches/{created['id']}")
        assert response.status_code == 200
        listing = client.get("/api/saved-searches").get_json()
        assert all(s["id"] != created["id"] for s in listing["savedSearches"])

    def test_other_user_cannot_delete(self, auth_client):
        alice = auth_client()
        bob = auth_client()
        created = alice.post(
            "/api/saved-searches", json={"name": "alice", "query": "y"}
        ).get_json()["savedSearch"]
        assert bob.delete(f"/api/saved-searches/{created['id']}").status_code == 404
