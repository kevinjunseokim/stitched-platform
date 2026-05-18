from datetime import datetime

from flask import Blueprint, g, jsonify, request

from initialization.database import db
from models import Notification
from utils.auth import jwt_required


notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("/notifications", methods=["GET"])
@jwt_required
def list_notifications():
    limit = min(int(request.args.get("limit", 50)), 200)
    rows = (
        Notification.query
        .filter_by(user_id=g.current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )
    unread = sum(1 for r in rows if r.read_at is None)
    return jsonify({
        "notifications": [r.to_dict() for r in rows],
        "unread": unread,
    }), 200


@notifications_bp.route("/notifications/mark-read", methods=["POST"])
@jwt_required
def mark_read():
    data = request.get_json() or {}
    ids = data.get("ids")

    query = Notification.query.filter_by(user_id=g.current_user.id, read_at=None)
    if ids:
        query = query.filter(Notification.id.in_(ids))

    now = datetime.utcnow()
    updated = 0
    for n in query.all():
        n.read_at = now
        updated += 1
    db.session.commit()
    return jsonify({"updated": updated}), 200
