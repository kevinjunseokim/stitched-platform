from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request

from models import NotableSale, Player, PlayerIndexPoint


players_bp = Blueprint("players", __name__)


RANGE_DAYS = {
    "30d": 30,
    "90d": 90,
    "365d": 365,
    "1y": 365,
}


@players_bp.route("/players", methods=["GET"])
def list_players():
    sport = request.args.get("sport")
    limit = min(int(request.args.get("limit", 50)), 200)

    query = Player.query
    if sport and sport.lower() != "all":
        query = query.filter(Player.sport == sport.upper())

    players = query.order_by(Player.current_index.desc()).limit(limit).all()
    return jsonify({"players": [p.to_dict() for p in players]}), 200


@players_bp.route("/players/<player_id>", methods=["GET"])
def get_player(player_id):
    player = Player.query.get(player_id)
    if not player:
        return jsonify({"error": "Player not found"}), 404
    return jsonify({"player": player.to_dict()}), 200


@players_bp.route("/players/<player_id>/index", methods=["GET"])
def get_player_index(player_id):
    range_key = request.args.get("range", "365d").lower()
    days = RANGE_DAYS.get(range_key, 365)
    cutoff = datetime.utcnow() - timedelta(days=days + 7)

    points = (
        PlayerIndexPoint.query
        .filter(PlayerIndexPoint.player_id == player_id)
        .filter(PlayerIndexPoint.ts >= cutoff)
        .order_by(PlayerIndexPoint.ts.asc())
        .all()
    )
    return jsonify({
        "playerId": player_id,
        "range": range_key,
        "points": [{"ts": p.ts.isoformat(), "value": p.value} for p in points],
    }), 200


@players_bp.route("/players/<player_id>/notable-sales", methods=["GET"])
def player_notable_sales(player_id):
    sales = (
        NotableSale.query
        .filter(NotableSale.player_id == player_id)
        .order_by(NotableSale.price_cents.desc())
        .all()
    )
    return jsonify({"sales": [s.to_dict() for s in sales]}), 200


@players_bp.route("/players/<player_id>/related", methods=["GET"])
def related_players(player_id):
    player = Player.query.get(player_id)
    if not player:
        return jsonify({"error": "Player not found"}), 404

    related = (
        Player.query
        .filter(Player.sport == player.sport)
        .filter(Player.id != player.id)
        .order_by(Player.current_index.desc())
        .limit(6)
        .all()
    )
    return jsonify({"players": [p.to_dict() for p in related]}), 200
