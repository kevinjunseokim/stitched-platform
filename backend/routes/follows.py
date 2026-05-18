import json

from flask import Blueprint, g, jsonify, request

from initialization.database import db
from models import Follow, Notification, Player, User
from utils.auth import jwt_required
from utils.payload import str_field
from utils.users import find_user_by_handle_or_id


follows_bp = Blueprint("follows", __name__)


@follows_bp.route("/follows", methods=["POST"])
@jwt_required
def create_follow():
    data = request.get_json() or {}
    target_type = str_field(data, "targetType", lower=True)
    target_id = str_field(data, "targetId")

    if target_type not in ("player", "user"):
        return jsonify({"error": "targetType must be 'player' or 'user'"}), 400
    if not target_id:
        return jsonify({"error": "targetId is required"}), 400

    if target_type == "player" and not Player.query.get(target_id):
        return jsonify({"error": "Player not found"}), 404
    if target_type == "user":
        target_user = find_user_by_handle_or_id(target_id)
        if not target_user:
            return jsonify({"error": "User not found"}), 404
        target_id = target_user.id
        if target_id == g.current_user.id:
            return jsonify({"error": "Cannot follow yourself"}), 400

    existing = Follow.query.filter_by(
        follower_user_id=g.current_user.id,
        target_type=target_type,
        target_id=target_id,
    ).first()
    if existing:
        return jsonify({"follow": existing.to_dict(), "alreadyFollowing": True}), 200

    follow = Follow(
        follower_user_id=g.current_user.id,
        target_type=target_type,
        target_id=target_id,
    )
    db.session.add(follow)

    if target_type == "user":
        db.session.add(Notification(
            user_id=target_id,
            kind="follower.new",
            title=f"{g.current_user.first_name} {g.current_user.last_name} followed you".strip(),
            body=None,
            payload_json=json.dumps({"actorUserId": g.current_user.id}),
        ))

    db.session.commit()
    return jsonify({"follow": follow.to_dict()}), 201


@follows_bp.route("/follows/<target_type>/<target_id>", methods=["DELETE"])
@jwt_required
def delete_follow(target_type, target_id):
    target_type = target_type.lower()
    if target_type == "user":
        user = find_user_by_handle_or_id(target_id)
        if user:
            target_id = user.id

    existing = Follow.query.filter_by(
        follower_user_id=g.current_user.id,
        target_type=target_type,
        target_id=target_id,
    ).first()
    if not existing:
        return jsonify({"message": "Not following"}), 200

    db.session.delete(existing)
    db.session.commit()
    return jsonify({"message": "Unfollowed"}), 200


@follows_bp.route("/me/follows", methods=["GET"])
@jwt_required
def my_follows():
    target_type = request.args.get("type")
    query = Follow.query.filter_by(follower_user_id=g.current_user.id)
    if target_type:
        query = query.filter_by(target_type=target_type.lower())
    follows = query.order_by(Follow.created_at.desc()).all()
    return jsonify({"follows": [f.to_dict() for f in follows]}), 200


@follows_bp.route("/users/<handle>/followers", methods=["GET"])
def user_followers(handle):
    user = find_user_by_handle_or_id(handle)
    if not user:
        return jsonify({"error": "User not found"}), 404

    follows = (
        Follow.query
        .filter_by(target_type="user", target_id=user.id)
        .order_by(Follow.created_at.desc())
        .all()
    )
    follower_ids = [f.follower_user_id for f in follows]
    users = User.query.filter(User.id.in_(follower_ids)).all() if follower_ids else []
    return jsonify({"followers": [u.to_dict() for u in users], "count": len(users)}), 200


@follows_bp.route("/users/<handle>/following", methods=["GET"])
def user_following(handle):
    user = find_user_by_handle_or_id(handle)
    if not user:
        return jsonify({"error": "User not found"}), 404

    follows = (
        Follow.query
        .filter_by(follower_user_id=user.id)
        .order_by(Follow.created_at.desc())
        .all()
    )
    return jsonify({"following": [f.to_dict() for f in follows], "count": len(follows)}), 200
