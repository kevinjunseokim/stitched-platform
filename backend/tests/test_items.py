"""Item lifecycle: create, list, get, update, delete, revalue, list/unlist, sell."""
import pytest


class TestCreateItem:
    def test_create_item_returns_full_dict(self, auth_client, item_payload):
        client = auth_client()
        response = client.post("/api/items", json=item_payload)
        assert response.status_code == 201
        item = response.get_json()["item"]
        assert item["id"]
        assert item["title"] == item_payload["title"]
        assert item["player"] == "corbin-carroll"
        assert item["acquired"] == 1800
        assert item["userId"] == client.user_id
        # Comp-driven valuation populates an estimate.
        assert item["estimate"]["mid"] is not None
        assert item["confidence"] in {"Low", "Medium", "High"}

    def test_create_item_persists_tags_and_badges(self, auth_client, item_payload):
        client = auth_client()
        response = client.post("/api/items", json=item_payload)
        item = response.get_json()["item"]
        assert "Rookie season" in item["tags"]
        assert "GAME-USED" in item["tags"]
        kinds = {b["kind"] for b in item["badges"]}
        assert "auth" in kinds  # authentication source set
        assert "field" in kinds  # rookie=True

    def test_create_item_writes_for_sale_badge_only_when_listed(self, auth_client, item_payload):
        client = auth_client()
        item_payload["forSale"] = True
        response = client.post("/api/items", json=item_payload)
        item = response.get_json()["item"]
        kinds = {b["kind"] for b in item["badges"]}
        assert "pending" in kinds  # FOR SALE badge

    @pytest.mark.parametrize(
        "missing,expected",
        [
            ("title", "title"),
            ("sport", "Sport"),
            ("type", "type"),
            ("player", "Player"),
        ],
    )
    def test_create_item_validation(self, auth_client, item_payload, missing, expected):
        client = auth_client()
        item_payload[missing] = ""
        response = client.post("/api/items", json=item_payload)
        assert response.status_code == 400
        assert expected.lower() in response.get_json()["error"].lower()

    def test_create_item_requires_auth(self, client, item_payload):
        response = client.post("/api/items", json=item_payload)
        assert response.status_code == 401


class TestListItems:
    def test_list_returns_only_owned_items(self, auth_client, item_payload):
        alice = auth_client(displayName="Alice Alpha")
        bob = auth_client(displayName="Bob Beta")

        alice.post("/api/items", json={**item_payload, "title": "Alice bat"})
        alice.post("/api/items", json={**item_payload, "title": "Alice helmet", "type": "Helmet"})
        bob.post("/api/items", json={**item_payload, "title": "Bob jersey", "type": "Jersey"})

        alice_items = alice.get("/api/items").get_json()["items"]
        bob_items = bob.get("/api/items").get_json()["items"]

        assert sorted(i["title"] for i in alice_items) == ["Alice bat", "Alice helmet"]
        assert [i["title"] for i in bob_items] == ["Bob jersey"]

    def test_list_is_ordered_newest_first(self, auth_client, item_payload):
        client = auth_client()
        first = client.post("/api/items", json={**item_payload, "title": "Old item"}).get_json()["item"]
        second = client.post("/api/items", json={**item_payload, "title": "New item", "type": "Jersey"}).get_json()["item"]

        items = client.get("/api/items").get_json()["items"]
        # Sorted by created_at desc — second insert should come first.
        assert items[0]["id"] == second["id"]
        assert items[1]["id"] == first["id"]


class TestGetItem:
    def test_get_returns_owned_item(self, auth_client, item_payload):
        client = auth_client()
        created = client.post("/api/items", json=item_payload).get_json()["item"]
        response = client.get(f"/api/items/{created['id']}")
        assert response.status_code == 200
        assert response.get_json()["item"]["id"] == created["id"]

    def test_get_other_users_private_item_is_404(self, auth_client, item_payload):
        owner = auth_client()
        other = auth_client()
        created = owner.post(
            "/api/items",
            json={**item_payload, "visibility": "private"},
        ).get_json()["item"]
        response = other.get(f"/api/items/{created['id']}")
        assert response.status_code == 404

    def test_get_other_users_public_item_is_allowed(self, auth_client, item_payload):
        owner = auth_client()
        other = auth_client()
        created = owner.post("/api/items", json=item_payload).get_json()["item"]
        response = other.get(f"/api/items/{created['id']}")
        assert response.status_code == 200
        assert response.get_json()["item"]["ownerUser"]["id"] == owner.user_id


class TestUpdateItem:
    def test_patch_updates_fields_and_revalues(self, auth_client, item_payload):
        client = auth_client()
        item = client.post("/api/items", json=item_payload).get_json()["item"]

        # Switching item type from Bat to Jersey should pick up jersey-typed comps
        # and produce a new estimate.
        response = client.patch(
            f"/api/items/{item['id']}",
            json={"title": "Updated title", "type": "Jersey"},
        )
        assert response.status_code == 200
        updated = response.get_json()["item"]
        assert updated["title"] == "Updated title"
        assert updated["type"] == "Jersey"
        # Estimate is recomputed (mid is set; value may differ from initial).
        assert updated["estimate"]["mid"] is not None

    def test_patch_preserves_unspecified_fields(self, auth_client, item_payload):
        client = auth_client()
        item = client.post("/api/items", json=item_payload).get_json()["item"]
        original_player = item["player"]

        response = client.patch(f"/api/items/{item['id']}", json={"title": "Only title changed"})
        assert response.status_code == 200
        updated = response.get_json()["item"]
        assert updated["title"] == "Only title changed"
        # Player wasn't in the patch payload and should be preserved.
        assert updated["player"] == original_player
        assert updated["sport"] == "MLB"

    def test_patch_preserves_unspecified_images(self, auth_client, item_payload):
        client = auth_client()
        created = client.post(
            "/api/items",
            json={**item_payload, "images": ["/api/uploads/a.jpg", "/api/uploads/b.jpg"]},
        ).get_json()["item"]

        response = client.patch(
            f"/api/items/{created['id']}",
            json={"title": "Image-safe patch"},
        )
        assert response.status_code == 200
        updated = response.get_json()["item"]
        assert updated["images"] == ["/api/uploads/a.jpg", "/api/uploads/b.jpg"]

    def test_patch_missing_item_404(self, auth_client):
        client = auth_client()
        response = client.patch("/api/items/does-not-exist", json={"title": "x"})
        assert response.status_code == 404


class TestDeleteItem:
    def test_delete_removes_item(self, auth_client, item_payload):
        client = auth_client()
        item = client.post("/api/items", json=item_payload).get_json()["item"]
        delete = client.delete(f"/api/items/{item['id']}")
        assert delete.status_code == 200
        assert client.get(f"/api/items/{item['id']}").status_code == 404

    def test_delete_others_item_404(self, auth_client, item_payload):
        owner = auth_client()
        other = auth_client()
        item = owner.post("/api/items", json=item_payload).get_json()["item"]
        response = other.delete(f"/api/items/{item['id']}")
        assert response.status_code == 404
        # And the owner still sees it.
        assert owner.get(f"/api/items/{item['id']}").status_code == 200


class TestRevalueItem:
    def test_revalue_returns_valuation_payload(self, auth_client, item_payload):
        client = auth_client()
        item = client.post("/api/items", json=item_payload).get_json()["item"]
        response = client.post(f"/api/items/{item['id']}/revalue")
        assert response.status_code == 200
        body = response.get_json()
        assert body["item"]["id"] == item["id"]
        assert "compsUsed" in body["valuation"]
        assert body["valuation"]["mid"] is not None


class TestListForSale:
    def test_list_for_sale_sets_asking_price(self, auth_client, item_payload):
        client = auth_client()
        item = client.post("/api/items", json=item_payload).get_json()["item"]
        response = client.post(f"/api/items/{item['id']}/list", json={"asking_price": 2700})
        assert response.status_code == 200
        listed = response.get_json()["item"]
        assert listed["forSale"] is True
        assert listed["askingPrice"] == 2700

    @pytest.mark.parametrize("key", ["askingPrice", "asking", "asking_price"])
    def test_list_accepts_multiple_price_keys(self, auth_client, item_payload, key):
        client = auth_client()
        item = client.post("/api/items", json=item_payload).get_json()["item"]
        response = client.post(f"/api/items/{item['id']}/list", json={key: 3300})
        assert response.status_code == 200
        assert response.get_json()["item"]["askingPrice"] == 3300

    def test_list_without_price(self, auth_client, item_payload):
        client = auth_client()
        item = client.post("/api/items", json=item_payload).get_json()["item"]
        response = client.post(f"/api/items/{item['id']}/list", json={})
        assert response.status_code == 200
        assert response.get_json()["item"]["forSale"] is True


class TestUnlist:
    def test_unlist_clears_for_sale_and_price(self, auth_client, item_payload):
        client = auth_client()
        item = client.post("/api/items", json=item_payload).get_json()["item"]
        client.post(f"/api/items/{item['id']}/list", json={"asking_price": 2700})
        response = client.post(f"/api/items/{item['id']}/unlist")
        assert response.status_code == 200
        body = response.get_json()["item"]
        assert body["forSale"] is False
        assert body["askingPrice"] is None


class TestSellItem:
    def test_sell_marks_item_sold(self, auth_client, item_payload):
        client = auth_client()
        item = client.post("/api/items", json=item_payload).get_json()["item"]
        response = client.post(
            f"/api/items/{item['id']}/sell",
            json={"soldPrice": 3400, "soldTo": "Goldin Auctions"},
        )
        assert response.status_code == 200
        sold = response.get_json()["item"]
        assert sold["soldPrice"] == 3400
        assert sold["soldTo"] == "Goldin Auctions"
        assert sold["soldAt"]
        # Selling implicitly unlists.
        assert sold["forSale"] is False

    def test_sell_unknown_item_404(self, auth_client):
        client = auth_client()
        response = client.post("/api/items/does-not-exist/sell", json={"soldPrice": 100})
        assert response.status_code == 404
