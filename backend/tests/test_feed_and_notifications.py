"""Activity feed + notification fan-out behavior.

Covers:
- Adding an item records an "added" event surfaced in the actor's own feed.
- Followers see the actor's events and receive a notification per event kind
  (add/list/sold/updated).
- Following a player makes player-subject events appear in the feed.
- Mark-read works in bulk and by ids; unread count reflects state.
"""


class TestFeed:
    def test_own_added_item_appears_in_feed(self, auth_client, item_payload):
        client = auth_client()
        client.post("/api/items", json=item_payload)
        events = client.get("/api/feed").get_json()["events"]
        kinds = [e["kind"] for e in events]
        assert "added" in kinds
        # The item subject is hydrated.
        added = next(e for e in events if e["kind"] == "added")
        assert added["item"]["title"] == item_payload["title"]

    def test_followed_user_events_appear(self, auth_client, item_payload):
        alice = auth_client(displayName="Alice Alpha")
        bob = auth_client(displayName="Bob Beta")
        alice.post("/api/follows", json={"targetType": "user", "targetId": bob.user_id})
        bob.post("/api/items", json={**item_payload, "title": "Bob's bat"})

        events = alice.get("/api/feed").get_json()["events"]
        titles = [e.get("item", {}).get("title") for e in events]
        assert "Bob's bat" in titles

    def test_global_feed_includes_other_collectors(self, auth_client, item_payload):
        alice = auth_client()
        stranger = auth_client()
        stranger.post("/api/items", json={**item_payload, "title": "Stranger grail bat"})
        events = alice.get("/api/feed").get_json()["events"]
        titles = [e.get("item", {}).get("title") for e in events]
        assert "Stranger grail bat" in titles

    def test_followed_player_events_surface(self, auth_client):
        from initialization.database import db
        from models import ActivityEvent

        client = auth_client()
        client.post("/api/follows", json={"targetType": "player", "targetId": "corbin-carroll"})

        # Inject a synthetic player-subject event to simulate something like an
        # index-mover alert. (In production these are produced by background jobs.)
        with client._client.application.app_context():
            event = ActivityEvent(
                kind="player.mover",
                actor_user_id=None,
                subject_type="player",
                subject_id="corbin-carroll",
                payload_json='{"pct": 4.2}',
            )
            db.session.add(event)
            db.session.commit()

        events = client.get("/api/feed").get_json()["events"]
        kinds = [e["kind"] for e in events]
        assert "player.mover" in kinds

    def test_feed_limit_is_capped(self, auth_client, item_payload):
        client = auth_client()
        for i in range(5):
            client.post("/api/items", json={**item_payload, "title": f"Item {i}"})

        events = client.get("/api/feed?limit=3").get_json()["events"]
        assert len(events) <= 3

    def test_liked_flag_reflects_current_user(self, auth_client, item_payload):
        client = auth_client()
        client.post("/api/items", json=item_payload)
        events = client.get("/api/feed").get_json()["events"]
        first = events[0]
        # Like the event itself.
        client.post("/api/likes", json={"targetType": "event", "targetId": first["id"]})

        refreshed = client.get("/api/feed").get_json()["events"]
        target = next(e for e in refreshed if e["id"] == first["id"])
        assert target["liked"] is True


class TestFanout:
    def test_follower_gets_notification_on_added_item(self, auth_client, item_payload):
        alice = auth_client(displayName="Alice Alpha")
        bob = auth_client(displayName="Bob Beta")
        alice.post("/api/follows", json={"targetType": "user", "targetId": bob.user_id})

        bob.post("/api/items", json=item_payload)

        notifs = alice.get("/api/notifications").get_json()
        assert notifs["unread"] >= 1
        kinds = [n["kind"] for n in notifs["notifications"]]
        assert "follow.added" in kinds

    def test_follower_gets_notification_on_listed_and_sold(self, auth_client, item_payload):
        alice = auth_client(displayName="Alice Alpha")
        bob = auth_client(displayName="Bob Beta")
        alice.post("/api/follows", json={"targetType": "user", "targetId": bob.user_id})

        item = bob.post("/api/items", json=item_payload).get_json()["item"]
        bob.post(f"/api/items/{item['id']}/list", json={"asking_price": 2700})
        bob.post(f"/api/items/{item['id']}/sell", json={"soldPrice": 3100})

        kinds = [n["kind"] for n in alice.get("/api/notifications").get_json()["notifications"]]
        # Three follow.* kinds should land — added, listed, sold.
        assert "follow.added" in kinds
        assert "follow.listed" in kinds
        assert "follow.sold" in kinds

    def test_non_follower_gets_no_notification(self, auth_client, item_payload):
        stranger = auth_client()
        actor = auth_client()
        actor.post("/api/items", json=item_payload)

        notifs = stranger.get("/api/notifications").get_json()
        assert notifs["unread"] == 0
        assert notifs["notifications"] == []


class TestNotifications:
    def test_mark_all_read(self, auth_client, item_payload):
        alice = auth_client()
        bob = auth_client()
        alice.post("/api/follows", json={"targetType": "user", "targetId": bob.user_id})
        bob.post("/api/items", json=item_payload)

        before = alice.get("/api/notifications").get_json()
        assert before["unread"] >= 1

        alice.post("/api/notifications/mark-read", json={})
        after = alice.get("/api/notifications").get_json()
        assert after["unread"] == 0

    def test_mark_read_specific_ids(self, auth_client, item_payload):
        alice = auth_client()
        bob = auth_client()
        alice.post("/api/follows", json={"targetType": "user", "targetId": bob.user_id})
        bob.post("/api/items", json=item_payload)
        bob.post("/api/items", json={**item_payload, "title": "Second"})

        notifs = alice.get("/api/notifications").get_json()["notifications"]
        assert len(notifs) >= 2

        target_id = notifs[0]["id"]
        alice.post("/api/notifications/mark-read", json={"ids": [target_id]})

        unread_after = alice.get("/api/notifications").get_json()
        # Only that one notification should have been marked read.
        unread_ids = {n["id"] for n in unread_after["notifications"] if not n.get("read")}
        assert target_id not in unread_ids
