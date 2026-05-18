"""Collection summary endpoint: totals, breakdowns, history."""


class TestCollectionSummary:
    def test_empty_collection_returns_zeros(self, auth_client):
        client = auth_client()
        response = client.get("/api/me/collection/summary")
        assert response.status_code == 200
        body = response.get_json()
        assert body["totals"]["pieces"] == 0
        assert body["totals"]["estimate"] == 0
        assert body["totals"]["acquired"] == 0
        assert body["totals"]["forSale"] == 0
        assert body["totals"]["sold"] == 0
        assert body["bySport"] == []
        assert body["byType"] == []
        assert body["history"] == []

    def test_totals_reflect_items(self, auth_client, item_payload):
        client = auth_client()
        client.post("/api/items", json={**item_payload, "title": "One"})
        client.post(
            "/api/items",
            json={**item_payload, "title": "Two", "sport": "NBA", "player": "anthony-edwards", "type": "Jersey", "price": 4000},
        )

        body = client.get("/api/me/collection/summary").get_json()
        assert body["totals"]["pieces"] == 2
        assert body["totals"]["acquired"] == 5800  # 1800 + 4000
        assert body["totals"]["estimate"] > 0
        assert body["totals"]["authenticatedPct"] == 100

    def test_for_sale_and_sold_counts(self, auth_client, item_payload):
        client = auth_client()
        a = client.post("/api/items", json=item_payload).get_json()["item"]
        b = client.post(
            "/api/items",
            json={**item_payload, "title": "B", "type": "Helmet"},
        ).get_json()["item"]
        c = client.post(
            "/api/items",
            json={**item_payload, "title": "C", "type": "Cleats"},
        ).get_json()["item"]

        client.post(f"/api/items/{a['id']}/list", json={"asking_price": 2200})
        client.post(f"/api/items/{b['id']}/sell", json={"soldPrice": 2500})

        totals = client.get("/api/me/collection/summary").get_json()["totals"]
        assert totals["pieces"] == 3
        assert totals["forSale"] == 1  # only A
        assert totals["sold"] == 1  # only B
        assert c  # silence unused-var lint

    def test_breakdowns_grouped_by_sport_and_type(self, auth_client, item_payload):
        client = auth_client()
        client.post("/api/items", json={**item_payload, "title": "MLB Bat 1"})
        client.post("/api/items", json={**item_payload, "title": "MLB Bat 2"})
        client.post(
            "/api/items",
            json={
                **item_payload,
                "title": "NBA Jersey",
                "sport": "NBA",
                "type": "Jersey",
                "player": "anthony-edwards",
            },
        )

        body = client.get("/api/me/collection/summary").get_json()
        by_sport = {row["sport"]: row for row in body["bySport"]}
        assert by_sport["MLB"]["count"] == 2
        assert by_sport["NBA"]["count"] == 1

        by_type = {row["type"]: row for row in body["byType"]}
        assert by_type["Bat"]["count"] == 2
        assert by_type["Jersey"]["count"] == 1

    def test_history_has_24_weekly_points(self, auth_client, item_payload):
        client = auth_client()
        client.post("/api/items", json=item_payload)
        body = client.get("/api/me/collection/summary").get_json()
        # _value_history walks weeks=24 ⇒ 25 points (0..24 inclusive).
        assert len(body["history"]) == 25
        for point in body["history"]:
            assert "date" in point and "value" in point
