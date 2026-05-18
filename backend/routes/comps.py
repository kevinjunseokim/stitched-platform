from flask import Blueprint, jsonify, request
from sqlalchemy import or_

from models import Comp, Player


comps_bp = Blueprint("comps", __name__)


@comps_bp.route("/comps", methods=["GET"])
def list_comps():
    player = request.args.get("player")
    item_type = request.args.get("type")
    sport = request.args.get("sport")
    source = request.args.get("source")
    search = (request.args.get("q") or "").strip()
    used_only = request.args.get("usedOnly", "").lower() == "true"
    limit = min(int(request.args.get("limit", 50)), 200)

    query = Comp.query
    if player and player.lower() != "all":
        query = query.filter(Comp.player_id == player)
    if item_type and item_type.lower() != "all":
        query = query.filter(Comp.item_type.ilike(item_type))
    if sport and sport.lower() != "all":
        query = query.join(Player, Comp.player_id == Player.id).filter(Player.sport == sport.upper())
    if source and source.lower() != "all":
        query = query.filter(Comp.source.ilike(source))
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Comp.title.ilike(pattern),
                Comp.source.ilike(pattern),
                Comp.auth.ilike(pattern),
                Comp.item_type.ilike(pattern),
            )
        )
    if used_only:
        query = query.filter(Comp.used_in_valuation.is_(True))

    comps = query.order_by(Comp.sale_date.desc()).limit(limit).all()
    return jsonify({"comps": [c.to_dict() for c in comps]}), 200
