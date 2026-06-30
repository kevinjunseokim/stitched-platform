"""Likes and comments — the social interactions on items and feed events."""

from initialization.database import db
from models import ActivityEvent, Comment, Item, Like, User


VALID_LIKE_TARGETS = frozenset({"event", "item", "comment"})
VALID_COMMENT_TARGETS = frozenset({"event", "item"})


class SocialService:
    @staticmethod
    def create_like(user_id, target_type, target_id):
        if target_type not in VALID_LIKE_TARGETS:
            return None, "Invalid like target", 400
        if not target_id:
            return None, "targetId is required", 400

        existing = Like.query.filter_by(
            user_id=user_id,
            target_type=target_type,
            target_id=target_id,
        ).first()
        if existing:
            return (
                {"liked": True, "count": SocialService._like_count(target_type, target_id)},
                None,
                200,
            )

        db.session.add(Like(user_id=user_id, target_type=target_type, target_id=target_id))
        SocialService._adjust_like_counter(target_type, target_id, delta=1)
        db.session.commit()
        return (
            {"liked": True, "count": SocialService._like_count(target_type, target_id)},
            None,
            201,
        )

    @staticmethod
    def delete_like(user_id, target_type, target_id):
        target_type = target_type.lower()
        existing = Like.query.filter_by(
            user_id=user_id,
            target_type=target_type,
            target_id=target_id,
        ).first()
        if existing:
            db.session.delete(existing)
            SocialService._adjust_like_counter(target_type, target_id, delta=-1)
            db.session.commit()
        return (
            {"liked": False, "count": SocialService._like_count(target_type, target_id)},
            None,
            200,
        )

    @staticmethod
    def list_comments(target_type, target_id):
        target_type = target_type.lower().rstrip("s")
        if target_type not in VALID_COMMENT_TARGETS:
            return None, "Invalid comment target", 400

        comments = (
            Comment.query
            .filter_by(target_type=target_type, target_id=target_id)
            .order_by(Comment.created_at.asc())
            .all()
        )
        user_ids = list({comment.user_id for comment in comments})
        users = (
            {user.id: user for user in User.query.filter(User.id.in_(user_ids)).all()}
            if user_ids else {}
        )
        return (
            {"comments": [comment.to_dict(author=users.get(comment.user_id)) for comment in comments]},
            None,
            200,
        )

    @staticmethod
    def create_comment(user, target_type, target_id, body):
        target_type = target_type.lower().rstrip("s")
        if target_type not in VALID_COMMENT_TARGETS:
            return None, "Invalid comment target", 400

        body = (body or "").strip()
        if not body:
            return None, "Comment body is required", 400

        comment = Comment(
            user_id=user.id,
            target_type=target_type,
            target_id=target_id,
            body=body,
        )
        db.session.add(comment)
        SocialService._adjust_comment_counter(target_type, target_id, delta=1)
        db.session.commit()
        return {"comment": comment.to_dict(author=user)}, None, 201

    @staticmethod
    def _like_count(target_type, target_id):
        return Like.query.filter_by(target_type=target_type, target_id=target_id).count()

    @staticmethod
    def _adjust_like_counter(target_type, target_id, delta):
        if target_type == "item":
            item = Item.query.get(target_id)
            if item:
                item.like_count = max(0, (item.like_count or 0) + delta)
        elif target_type == "event":
            event = ActivityEvent.query.get(target_id)
            if event:
                event.like_count = max(0, (event.like_count or 0) + delta)

    @staticmethod
    def _adjust_comment_counter(target_type, target_id, delta):
        if target_type == "item":
            item = Item.query.get(target_id)
            if item:
                item.comment_count = max(0, (item.comment_count or 0) + delta)
        elif target_type == "event":
            event = ActivityEvent.query.get(target_id)
            if event:
                event.comment_count = max(0, (event.comment_count or 0) + delta)
