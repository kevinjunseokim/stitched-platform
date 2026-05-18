from flask import Blueprint, g, jsonify, request

from initialization.database import db
from models import ActivityEvent, Follow, Item, User
from utils.auth import jwt_required, optional_jwt
from utils.item_serialization import serialize_items
from utils.users import find_user_by_handle_or_id
from utils.validators import validate_handle


profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/profiles/<handle>", methods=["GET"])
@optional_jwt
def get_profile(handle):
    user = find_user_by_handle_or_id(handle)
    if not user:
        return jsonify({"error": "Profile not found"}), 404

    items = (
        Item.query
        .filter_by(user_id=user.id)
        .order_by(Item.created_at.desc())
        .all()
    )
    viewer_id = g.current_user.id if g.current_user else None
    visible_items = items if viewer_id == user.id else [i for i in items if i.visibility == "public"]
    public_items = [i for i in items if i.visibility == "public"]

    total_estimate_cents = sum((i.estimate_mid_cents or 0) for i in items)
    total_acquired_cents = sum((i.acquisition_price_cents or 0) for i in items)

    follower_count = Follow.query.filter_by(target_type="user", target_id=user.id).count()
    following_count = Follow.query.filter_by(follower_user_id=user.id).count()

    recent_events = (
        ActivityEvent.query
        .filter_by(actor_user_id=user.id)
        .filter(ActivityEvent.kind != "milestone")
        .order_by(ActivityEvent.created_at.desc())
        .limit(20)
        .all()
    )

    sold_items = [i for i in items if i.sold_at is not None]

    return jsonify({
        "user": user.to_dict(),
        "stats": {
            "pieces": len(items),
            "publicPieces": len(public_items),
            "totalEstimate": total_estimate_cents // 100,
            "totalAcquired": total_acquired_cents // 100,
            "followers": follower_count,
            "following": following_count,
            "sold": len(sold_items),
        },
        "items": serialize_items(visible_items, viewer_user_id=viewer_id),
        "soldItems": serialize_items(sold_items, viewer_user_id=viewer_id),
        "activity": [e.to_dict() for e in recent_events],
    }), 200


@profile_bp.route("/me", methods=["PATCH"])
@jwt_required
def update_me():
    data = request.get_json() or {}
    user = g.current_user

    if "displayName" in data and data["displayName"]:
        parts = str(data["displayName"]).strip().split()
        user.first_name = parts[0] if parts else user.first_name
        user.last_name = " ".join(parts[1:]) if len(parts) > 1 else user.last_name

    if "firstName" in data:
        user.first_name = str(data["firstName"]).strip() or user.first_name
    if "lastName" in data:
        user.last_name = str(data["lastName"]).strip() or user.last_name

    if "bio" in data:
        user.bio = str(data["bio"] or "").strip()

    if "handle" in data and data["handle"]:
        handle, error = validate_handle(data["handle"])
        if error:
            return jsonify({"error": error}), 400
        existing = User.query.filter(User.handle == handle, User.id != user.id).first()
        if existing:
            return jsonify({"error": "Handle already taken"}), 400
        user.handle = handle

    db.session.commit()
    return jsonify({"user": user.to_dict()}), 200
