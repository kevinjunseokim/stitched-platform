from flask import Blueprint, g, jsonify, request

from initialization.database import db
from models import ActivityEvent, Comment, Item, Like, User
from utils.auth import jwt_required
from utils.payload import str_field


social_bp = Blueprint("social", __name__)

VALID_LIKE_TARGETS = {"event", "item", "comment"}
VALID_COMMENT_TARGETS = {"event", "item"}


@social_bp.route("/likes", methods=["POST"])
@jwt_required
def create_like():
    data = request.get_json() or {}
    target_type = str_field(data, "targetType", lower=True)
    target_id = str_field(data, "targetId")

    if target_type not in VALID_LIKE_TARGETS:
        return jsonify({"error": "Invalid like target"}), 400
    if not target_id:
        return jsonify({"error": "targetId is required"}), 400

    existing = Like.query.filter_by(
        user_id=g.current_user.id,
        target_type=target_type,
        target_id=target_id,
    ).first()
    if existing:
        return jsonify({"liked": True, "count": _like_count(target_type, target_id)}), 200

    like = Like(user_id=g.current_user.id, target_type=target_type, target_id=target_id)
    db.session.add(like)
    _adjust_counter(target_type, target_id, delta=1)
    db.session.commit()

    return jsonify({"liked": True, "count": _like_count(target_type, target_id)}), 201


@social_bp.route("/likes/<target_type>/<target_id>", methods=["DELETE"])
@jwt_required
def delete_like(target_type, target_id):
    target_type = target_type.lower()
    existing = Like.query.filter_by(
        user_id=g.current_user.id,
        target_type=target_type,
        target_id=target_id,
    ).first()
    if existing:
        db.session.delete(existing)
        _adjust_counter(target_type, target_id, delta=-1)
        db.session.commit()
    return jsonify({"liked": False, "count": _like_count(target_type, target_id)}), 200


@social_bp.route("/<target_type>/<target_id>/comments", methods=["GET"])
def list_comments(target_type, target_id):
    target_type = target_type.lower().rstrip("s")
    if target_type not in VALID_COMMENT_TARGETS:
        return jsonify({"error": "Invalid comment target"}), 400

    comments = (
        Comment.query
        .filter_by(target_type=target_type, target_id=target_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    user_ids = list({c.user_id for c in comments})
    users = {u.id: u for u in User.query.filter(User.id.in_(user_ids)).all()} if user_ids else {}
    return jsonify({
        "comments": [c.to_dict(author=users.get(c.user_id)) for c in comments],
    }), 200


@social_bp.route("/<target_type>/<target_id>/comments", methods=["POST"])
@jwt_required
def create_comment(target_type, target_id):
    target_type = target_type.lower().rstrip("s")
    if target_type not in VALID_COMMENT_TARGETS:
        return jsonify({"error": "Invalid comment target"}), 400

    data = request.get_json() or {}
    body = (data.get("body") or "").strip()
    if not body:
        return jsonify({"error": "Comment body is required"}), 400

    comment = Comment(
        user_id=g.current_user.id,
        target_type=target_type,
        target_id=target_id,
        body=body,
    )
    db.session.add(comment)
    _adjust_comment_counter(target_type, target_id, delta=1)
    db.session.commit()
    return jsonify({"comment": comment.to_dict(author=g.current_user)}), 201


def _like_count(target_type, target_id):
    return Like.query.filter_by(target_type=target_type, target_id=target_id).count()


def _adjust_counter(target_type, target_id, delta):
    if target_type == "item":
        item = Item.query.get(target_id)
        if item:
            item.like_count = max(0, (item.like_count or 0) + delta)
    elif target_type == "event":
        event = ActivityEvent.query.get(target_id)
        if event:
            event.like_count = max(0, (event.like_count or 0) + delta)


def _adjust_comment_counter(target_type, target_id, delta):
    if target_type == "item":
        item = Item.query.get(target_id)
        if item:
            item.comment_count = max(0, (item.comment_count or 0) + delta)
    elif target_type == "event":
        event = ActivityEvent.query.get(target_id)
        if event:
            event.comment_count = max(0, (event.comment_count or 0) + delta)
