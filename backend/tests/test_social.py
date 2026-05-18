"""Likes and comments."""
import pytest


class TestLikes:
    def test_like_item_idempotent_and_counts(self, auth_client, item_payload):
        owner = auth_client()
        liker = auth_client()
        item = owner.post("/api/items", json=item_payload).get_json()["item"]

        first = liker.post(
            "/api/likes", json={"targetType": "item", "targetId": item["id"]}
        )
        assert first.status_code == 201
        assert first.get_json()["count"] == 1

        # Liking twice is a no-op.
        second = liker.post(
            "/api/likes", json={"targetType": "item", "targetId": item["id"]}
        )
        assert second.status_code == 200
        assert second.get_json()["count"] == 1

    def test_unlike_decrements_count(self, auth_client, item_payload):
        owner = auth_client()
        liker = auth_client()
        item = owner.post("/api/items", json=item_payload).get_json()["item"]
        liker.post("/api/likes", json={"targetType": "item", "targetId": item["id"]})

        response = liker.delete(f"/api/likes/item/{item['id']}")
        assert response.status_code == 200
        assert response.get_json()["count"] == 0

    def test_unlike_when_not_liked_is_no_op(self, auth_client, item_payload):
        owner = auth_client()
        other = auth_client()
        item = owner.post("/api/items", json=item_payload).get_json()["item"]
        response = other.delete(f"/api/likes/item/{item['id']}")
        assert response.status_code == 200
        assert response.get_json()["liked"] is False

    @pytest.mark.parametrize("bad_target", ["follower", "user", "random"])
    def test_invalid_target_rejected(self, auth_client, bad_target):
        client = auth_client()
        response = client.post(
            "/api/likes", json={"targetType": bad_target, "targetId": "x"}
        )
        assert response.status_code == 400

    def test_like_count_visible_on_item(self, auth_client, item_payload):
        owner = auth_client()
        liker1 = auth_client()
        liker2 = auth_client()
        item = owner.post("/api/items", json=item_payload).get_json()["item"]

        liker1.post("/api/likes", json={"targetType": "item", "targetId": item["id"]})
        liker2.post("/api/likes", json={"targetType": "item", "targetId": item["id"]})

        refreshed = owner.get(f"/api/items/{item['id']}").get_json()["item"]
        assert refreshed["likes"] == 2

    def test_unlike_does_not_underflow_below_zero(self, auth_client, item_payload):
        owner = auth_client()
        other = auth_client()
        item = owner.post("/api/items", json=item_payload).get_json()["item"]
        # Like+unlike, then unlike again. Counter should clamp at 0.
        other.post("/api/likes", json={"targetType": "item", "targetId": item["id"]})
        other.delete(f"/api/likes/item/{item['id']}")
        other.delete(f"/api/likes/item/{item['id']}")

        refreshed = owner.get(f"/api/items/{item['id']}").get_json()["item"]
        assert refreshed["likes"] == 0


class TestComments:
    def test_post_and_list_comments(self, auth_client, item_payload, client):
        owner = auth_client(displayName="Owner Person")
        commenter = auth_client(displayName="Curious Cat")
        item = owner.post("/api/items", json=item_payload).get_json()["item"]

        post = commenter.post(
            f"/api/item/{item['id']}/comments",
            json={"body": "Beautiful piece — congratulations!"},
        )
        assert post.status_code == 201
        comment = post.get_json()["comment"]
        assert comment["body"] == "Beautiful piece — congratulations!"
        assert comment["userId"] == commenter.user_id

        # GET is public.
        listing = client.get(f"/api/item/{item['id']}/comments")
        assert listing.status_code == 200
        body = listing.get_json()
        assert len(body["comments"]) == 1
        author = body["comments"][0]["author"]
        assert author and author["id"] == commenter.user_id

    def test_comment_body_required(self, auth_client, item_payload):
        owner = auth_client()
        commenter = auth_client()
        item = owner.post("/api/items", json=item_payload).get_json()["item"]
        response = commenter.post(
            f"/api/item/{item['id']}/comments", json={"body": "   "}
        )
        assert response.status_code == 400

    def test_comment_counter_updates_item(self, auth_client, item_payload):
        owner = auth_client()
        commenter = auth_client()
        item = owner.post("/api/items", json=item_payload).get_json()["item"]

        commenter.post(f"/api/item/{item['id']}/comments", json={"body": "first"})
        commenter.post(f"/api/item/{item['id']}/comments", json={"body": "second"})

        refreshed = owner.get(f"/api/items/{item['id']}").get_json()["item"]
        assert refreshed["commentsCount"] == 2

    def test_invalid_target_type_rejected(self, auth_client):
        client = auth_client()
        response = client.post("/api/follower/whatever/comments", json={"body": "no"})
        assert response.status_code == 400
