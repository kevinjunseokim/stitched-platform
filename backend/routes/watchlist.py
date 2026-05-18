import json

from flask import Blueprint, g, jsonify, request

from initialization.database import db
from models import Player, SavedSearch, WatchlistEntry
from utils.auth import jwt_required
from utils.payload import str_field


watchlist_bp = Blueprint("watchlist", __name__)


@watchlist_bp.route("/watchlist", methods=["GET"])
@jwt_required
def list_watchlist():
    entries = (
        WatchlistEntry.query
        .filter_by(user_id=g.current_user.id)
        .order_by(WatchlistEntry.created_at.desc())
        .all()
    )

    player_ids = [e.target_id for e in entries if e.target_type == "player"]
    players = {p.id: p.to_dict() for p in Player.query.filter(Player.id.in_(player_ids)).all()} if player_ids else {}

    hydrated = []
    for e in entries:
        d = e.to_dict()
        if e.target_type == "player" and e.target_id in players:
            d["player"] = players[e.target_id]
        hydrated.append(d)

    return jsonify({"entries": hydrated}), 200


@watchlist_bp.route("/watchlist", methods=["POST"])
@jwt_required
def create_watchlist_entry():
    data = request.get_json() or {}
    target_type = str_field(data, "targetType", lower=True)
    target_id = str_field(data, "targetId")

    if target_type not in ("player", "saved_search", "item"):
        return jsonify({"error": "Invalid targetType"}), 400
    if not target_id:
        return jsonify({"error": "targetId is required"}), 400

    existing = WatchlistEntry.query.filter_by(
        user_id=g.current_user.id,
        target_type=target_type,
        target_id=target_id,
    ).first()
    if existing:
        return jsonify({"entry": existing.to_dict(), "alreadyWatching": True}), 200

    entry = WatchlistEntry(
        user_id=g.current_user.id,
        target_type=target_type,
        target_id=target_id,
        label=data.get("label"),
        alert_pct=float(data.get("alertPct", 5.0)),
        alert_freq=(data.get("alertFreq") or "daily").lower(),
        channels_json=json.dumps(data.get("channels") or ["push"]),
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({"entry": entry.to_dict()}), 201


@watchlist_bp.route("/watchlist/<int:entry_id>", methods=["PATCH"])
@jwt_required
def update_watchlist_entry(entry_id):
    entry = WatchlistEntry.query.filter_by(id=entry_id, user_id=g.current_user.id).first()
    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    data = request.get_json() or {}
    if "alertPct" in data:
        entry.alert_pct = float(data["alertPct"])
    if "alertFreq" in data:
        entry.alert_freq = (data["alertFreq"] or "daily").lower()
    if "channels" in data:
        entry.channels_json = json.dumps(data["channels"] or [])
    if "label" in data:
        entry.label = data["label"]

    db.session.commit()
    return jsonify({"entry": entry.to_dict()}), 200


@watchlist_bp.route("/watchlist/<int:entry_id>", methods=["DELETE"])
@jwt_required
def delete_watchlist_entry(entry_id):
    entry = WatchlistEntry.query.filter_by(id=entry_id, user_id=g.current_user.id).first()
    if not entry:
        return jsonify({"error": "Entry not found"}), 404
    db.session.delete(entry)
    db.session.commit()
    return jsonify({"message": "Removed"}), 200


@watchlist_bp.route("/saved-searches", methods=["GET"])
@jwt_required
def list_saved_searches():
    # NB: SavedSearch has a column named `query`, which shadows the default
    # Flask-SQLAlchemy `Model.query` manager. Use `db.session.query` instead.
    rows = (
        db.session.query(SavedSearch)
        .filter_by(user_id=g.current_user.id)
        .order_by(SavedSearch.created_at.desc())
        .all()
    )
    return jsonify({"savedSearches": [r.to_dict() for r in rows]}), 200


@watchlist_bp.route("/saved-searches", methods=["POST"])
@jwt_required
def create_saved_search():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    query = (data.get("query") or "").strip()
    if not name and not query:
        return jsonify({"error": "Name or query is required"}), 400

    saved = SavedSearch(
        user_id=g.current_user.id,
        name=name or query,
        query=query,
        filters_json=json.dumps(data.get("filters") or {}),
    )
    db.session.add(saved)
    db.session.commit()
    return jsonify({"savedSearch": saved.to_dict()}), 201


@watchlist_bp.route("/saved-searches/<int:saved_id>", methods=["DELETE"])
@jwt_required
def delete_saved_search(saved_id):
    saved = (
        db.session.query(SavedSearch)
        .filter_by(id=saved_id, user_id=g.current_user.id)
        .first()
    )
    if not saved:
        return jsonify({"error": "Not found"}), 404
    db.session.delete(saved)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200
