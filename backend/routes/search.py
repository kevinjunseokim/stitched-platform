from flask import Blueprint, g, jsonify, request
from sqlalchemy import or_

from models import Comp, Item, Player, User
from utils.auth import optional_jwt
from utils.item_serialization import serialize_items


search_bp = Blueprint("search", __name__)


@search_bp.route("/search", methods=["GET"])
@optional_jwt
def search():
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify({"items": [], "players": [], "comps": [], "collectors": []}), 200

    pattern = f"%{q}%"

    players = (
        Player.query.filter(
            or_(Player.name.ilike(pattern), Player.team.ilike(pattern), Player.id.ilike(pattern))
        )
        .limit(10)
        .all()
    )

    comps = (
        Comp.query.filter(
            or_(Comp.title.ilike(pattern), Comp.source.ilike(pattern), Comp.auth.ilike(pattern))
        )
        .order_by(Comp.sale_date.desc())
        .limit(15)
        .all()
    )

    collectors = (
        User.query.filter(
            or_(
                User.first_name.ilike(pattern),
                User.last_name.ilike(pattern),
                User.handle.ilike(pattern),
            )
        )
        .limit(10)
        .all()
    )

    items_query = Item.query.filter(
        or_(
            Item.title.ilike(pattern),
            Item.player_id.ilike(pattern),
            Item.team.ilike(pattern),
            Item.item_type.ilike(pattern),
        )
    )

    current_user = g.current_user
    if current_user:
        items_query = items_query.filter(
            or_(Item.user_id == current_user.id, Item.visibility == "public")
        )
    else:
        items_query = items_query.filter(Item.visibility == "public")

    items = items_query.order_by(Item.created_at.desc()).limit(15).all()

    viewer_id = current_user.id if current_user else None
    return jsonify({
        "items": serialize_items(items, viewer_user_id=viewer_id),
        "players": [p.to_dict() for p in players],
        "comps": [c.to_dict() for c in comps],
        "collectors": [u.to_dict() for u in collectors],
    }), 200
