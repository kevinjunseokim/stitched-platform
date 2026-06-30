"""Follow relationships between users and players."""

import json

from initialization.database import db
from models import Follow, Notification, Player, User
from utils.users import find_user_by_handle_or_id


class FollowService:
    @staticmethod
    def create_follow(actor, target_type, target_id):
        if target_type not in ("player", "user"):
            return None, "targetType must be 'player' or 'user'", 400
        if not target_id:
            return None, "targetId is required", 400

        if target_type == "player" and not Player.query.get(target_id):
            return None, "Player not found", 404

        if target_type == "user":
            target_user = find_user_by_handle_or_id(target_id)
            if not target_user:
                return None, "User not found", 404
            target_id = target_user.id
            if target_id == actor.id:
                return None, "Cannot follow yourself", 400

        existing = Follow.query.filter_by(
            follower_user_id=actor.id,
            target_type=target_type,
            target_id=target_id,
        ).first()
        if existing:
            return {"follow": existing.to_dict(), "alreadyFollowing": True}, None, 200

        follow = Follow(
            follower_user_id=actor.id,
            target_type=target_type,
            target_id=target_id,
        )
        db.session.add(follow)

        if target_type == "user":
            db.session.add(Notification(
                user_id=target_id,
                kind="follower.new",
                title=f"{actor.first_name} {actor.last_name} followed you".strip(),
                body=None,
                payload_json=json.dumps({"actorUserId": actor.id}),
            ))

        db.session.commit()
        return {"follow": follow.to_dict()}, None, 201

    @staticmethod
    def delete_follow(user_id, target_type, target_id):
        target_type = target_type.lower()
        if target_type == "user":
            user = find_user_by_handle_or_id(target_id)
            if user:
                target_id = user.id

        existing = Follow.query.filter_by(
            follower_user_id=user_id,
            target_type=target_type,
            target_id=target_id,
        ).first()
        if not existing:
            return {"message": "Not following"}, None, 200

        db.session.delete(existing)
        db.session.commit()
        return {"message": "Unfollowed"}, None, 200

    @staticmethod
    def list_my_follows(user_id, target_type=None):
        query = Follow.query.filter_by(follower_user_id=user_id)
        if target_type:
            query = query.filter_by(target_type=target_type.lower())
        follows = query.order_by(Follow.created_at.desc()).all()
        return {"follows": [follow.to_dict() for follow in follows]}, None, 200

    @staticmethod
    def list_user_followers(handle):
        user = find_user_by_handle_or_id(handle)
        if not user:
            return None, "User not found", 404

        follows = (
            Follow.query
            .filter_by(target_type="user", target_id=user.id)
            .order_by(Follow.created_at.desc())
            .all()
        )
        follower_ids = [follow.follower_user_id for follow in follows]
        users = User.query.filter(User.id.in_(follower_ids)).all() if follower_ids else []
        return {"followers": [u.to_dict() for u in users], "count": len(users)}, None, 200

    @staticmethod
    def list_user_following(handle):
        user = find_user_by_handle_or_id(handle)
        if not user:
            return None, "User not found", 404

        follows = (
            Follow.query
            .filter_by(follower_user_id=user.id)
            .order_by(Follow.created_at.desc())
            .all()
        )
        return {"following": [follow.to_dict() for follow in follows], "count": len(follows)}, None, 200
