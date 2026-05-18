"""Cross-user item discovery (view, search, feed)."""


class TestPublicItemDiscovery:
    def test_user_can_view_another_collectors_public_item(self, auth_client, item_payload):
        owner = auth_client(displayName="Public Owner")
        viewer = auth_client(displayName="Public Viewer")
        created = owner.post(
            "/api/items",
            json={**item_payload, "title": "Shared Grail Bat", "visibility": "public"},
        ).get_json()["item"]

        response = viewer.get(f"/api/items/{created['id']}")
        assert response.status_code == 200
        body = response.get_json()
        assert body["item"]["title"] == "Shared Grail Bat"
        assert body["item"]["ownerUser"]["displayName"] == "Public Owner"

    def test_private_items_stay_hidden_from_other_users(self, auth_client, item_payload):
        owner = auth_client()
        viewer = auth_client()
        created = owner.post(
            "/api/items",
            json={**item_payload, "title": "Hidden Bat", "visibility": "private"},
        ).get_json()["item"]

        assert viewer.get(f"/api/items/{created['id']}").status_code == 404

    def test_search_surfaces_other_collectors_public_items(self, auth_client, item_payload):
        owner = auth_client(displayName="Search Owner")
        viewer = auth_client()
        owner.post(
            "/api/items",
            json={**item_payload, "title": "Ohtani Searchable Jersey", "visibility": "public", "player": "shohei-ohtani"},
        )

        titles = [item["title"] for item in viewer.get("/api/search?q=Searchable").get_json()["items"]]
        assert "Ohtani Searchable Jersey" in titles
