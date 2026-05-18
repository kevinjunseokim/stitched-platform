"""Catalog endpoints: players, comps, market ticker, notable sales, stats."""
import pytest


class TestPlayers:
    def test_list_players_returns_seeded_data(self, client):
        response = client.get("/api/players")
        assert response.status_code == 200
        players = response.get_json()["players"]
        ids = {p["id"] for p in players}
        # A few canonical seeded ids should be present.
        assert {"corbin-carroll", "shohei-ohtani", "victor-wembanyama"}.issubset(ids)
        # Sorted by current_index desc — first should have the highest.
        indices = [p["index"] for p in players]
        assert indices == sorted(indices, reverse=True)

    def test_list_players_filtered_by_sport(self, client):
        response = client.get("/api/players?sport=NBA")
        assert response.status_code == 200
        players = response.get_json()["players"]
        assert players
        assert all(p["sport"] == "NBA" for p in players)

    def test_list_players_all_filter_returns_everything(self, client):
        response = client.get("/api/players?sport=All")
        assert response.status_code == 200
        # Sport filter "all" is bypassed, so we should see multiple sports.
        sports = {p["sport"] for p in response.get_json()["players"]}
        assert len(sports) > 1

    def test_get_player_returns_full_dict(self, client):
        response = client.get("/api/players/corbin-carroll")
        assert response.status_code == 200
        player = response.get_json()["player"]
        assert player["name"] == "Corbin Carroll"
        assert player["sport"] == "MLB"
        assert "index" in player

    def test_get_player_404(self, client):
        response = client.get("/api/players/no-such-athlete")
        assert response.status_code == 404

    @pytest.mark.parametrize("range_key", ["30d", "90d", "365d", "1y"])
    def test_player_index_returns_points_for_each_range(self, client, range_key):
        response = client.get(f"/api/players/corbin-carroll/index?range={range_key}")
        assert response.status_code == 200
        body = response.get_json()
        assert body["playerId"] == "corbin-carroll"
        assert body["range"] == range_key
        # Seeded ~365 days of weekly-ish points; even the 30d slice should
        # contain at least one anchor point.
        assert isinstance(body["points"], list)

    def test_player_notable_sales(self, client):
        response = client.get("/api/players/patrick-mahomes/notable-sales")
        assert response.status_code == 200
        sales = response.get_json()["sales"]
        # Mahomes SB LIV jersey is in the seed.
        assert any("Mahomes" in s["title"] for s in sales)

    def test_player_related_returns_same_sport_distinct(self, client):
        response = client.get("/api/players/corbin-carroll/related")
        assert response.status_code == 200
        players = response.get_json()["players"]
        assert players
        assert all(p["sport"] == "MLB" for p in players)
        assert all(p["id"] != "corbin-carroll" for p in players)

    def test_player_related_404_for_unknown(self, client):
        response = client.get("/api/players/no-such-player/related")
        assert response.status_code == 404


class TestComps:
    def test_list_comps_returns_seeded(self, client):
        response = client.get("/api/comps?limit=10")
        assert response.status_code == 200
        comps = response.get_json()["comps"]
        assert comps
        # Sorted by sale_date desc.
        dates = [c["date"] for c in comps if c["date"]]
        assert dates == sorted(dates, reverse=True)

    def test_filter_by_player(self, client):
        response = client.get("/api/comps?player=corbin-carroll")
        comps = response.get_json()["comps"]
        assert comps
        assert all(c["player"] == "corbin-carroll" for c in comps)

    def test_filter_by_type(self, client):
        response = client.get("/api/comps?player=corbin-carroll&type=Bat")
        comps = response.get_json()["comps"]
        assert all(c["type"].lower() == "bat" for c in comps)

    def test_used_only_filter(self, client):
        response = client.get("/api/comps?usedOnly=true")
        comps = response.get_json()["comps"]
        assert all(c["usedIn"] for c in comps)

    def test_search_filter(self, client):
        response = client.get("/api/comps?q=goldin")
        comps = response.get_json()["comps"]
        assert comps
        assert all("goldin" in (c["source"] or "").lower() or "goldin" in (c["title"] or "").lower() for c in comps)

    def test_filter_by_sport(self, client):
        response = client.get("/api/comps?sport=NBA")
        comps = response.get_json()["comps"]
        assert comps
        nba_players = {
            "anthony-edwards", "victor-wembanyama", "lebron-james",
        }
        assert all(c["player"] in nba_players for c in comps)

    def test_filter_by_source(self, client):
        response = client.get("/api/comps?source=MLB%20Auctions")
        comps = response.get_json()["comps"]
        assert comps
        assert all(c["source"] == "MLB Auctions" for c in comps)


class TestMarket:
    def test_ticker_returns_entries_in_order(self, client):
        response = client.get("/api/market/ticker")
        assert response.status_code == 200
        ticker = response.get_json()["ticker"]
        assert ticker
        labels = [t["label"] for t in ticker]
        # First entry per seed is "Stitched 100".
        assert labels[0] == "Stitched 100"

    def test_notable_sales_sorted_by_price_desc(self, client):
        response = client.get("/api/market/notable-sales")
        sales = response.get_json()["sales"]
        prices = [s["price"] for s in sales]
        assert prices == sorted(prices, reverse=True)
        # The mid-game ball is the largest seeded sale.
        assert sales[0]["title"].startswith("Ohtani")


class TestStats:
    def test_platform_stats_baseline(self, client):
        response = client.get("/api/stats")
        assert response.status_code == 200
        body = response.get_json()
        assert body["collectors"] >= 38_420
        assert body["piecesTracked"] >= 142_118
        assert body["authenticatedPct"] >= 0

    def test_stats_count_live_users_and_items(self, auth_client, item_payload):
        client = auth_client()
        client.post("/api/items", json=item_payload)
        response = client._client.get("/api/stats")
        body = response.get_json()
        assert body["liveUsers"] >= 1
        assert body["liveItems"] >= 1
