"""Watchlist entries and saved searches."""

import json

from initialization.database import db
from models import Player, SavedSearch, WatchlistEntry
from utils.payload import str_field


class WatchlistService:
    @staticmethod
    def list_entries(user_id):
        entries = (
            WatchlistEntry.query
            .filter_by(user_id=user_id)
            .order_by(WatchlistEntry.created_at.desc())
            .all()
        )

        player_ids = [entry.target_id for entry in entries if entry.target_type == "player"]
        players = (
            {player.id: player.to_dict() for player in Player.query.filter(Player.id.in_(player_ids)).all()}
            if player_ids else {}
        )

        hydrated = []
        for entry in entries:
            payload = entry.to_dict()
            if entry.target_type == "player" and entry.target_id in players:
                payload["player"] = players[entry.target_id]
            hydrated.append(payload)

        return {"entries": hydrated}, None, 200

    @staticmethod
    def create_entry(user_id, data):
        target_type = str_field(data, "targetType", lower=True)
        target_id = str_field(data, "targetId")

        if target_type not in ("player", "saved_search", "item"):
            return None, "Invalid targetType", 400
        if not target_id:
            return None, "targetId is required", 400

        existing = WatchlistEntry.query.filter_by(
            user_id=user_id,
            target_type=target_type,
            target_id=target_id,
        ).first()
        if existing:
            return {"entry": existing.to_dict(), "alreadyWatching": True}, None, 200

        entry = WatchlistEntry(
            user_id=user_id,
            target_type=target_type,
            target_id=target_id,
            label=data.get("label"),
            alert_pct=float(data.get("alertPct") or 5.0),
            alert_freq=(data.get("alertFreq") or "daily").lower(),
            channels_json=json.dumps(data.get("channels") or ["push"]),
        )
        db.session.add(entry)
        db.session.commit()
        return {"entry": entry.to_dict()}, None, 201

    @staticmethod
    def update_entry(user_id, entry_id, data):
        entry = WatchlistEntry.query.filter_by(id=entry_id, user_id=user_id).first()
        if not entry:
            return None, "Entry not found", 404

        if "alertPct" in data:
            entry.alert_pct = float(data["alertPct"])
        if "alertFreq" in data:
            entry.alert_freq = (data["alertFreq"] or "daily").lower()
        if "channels" in data:
            entry.channels_json = json.dumps(data["channels"] or [])
        if "label" in data:
            entry.label = data["label"]

        db.session.commit()
        return {"entry": entry.to_dict()}, None, 200

    @staticmethod
    def delete_entry(user_id, entry_id):
        entry = WatchlistEntry.query.filter_by(id=entry_id, user_id=user_id).first()
        if not entry:
            return None, "Entry not found", 404
        db.session.delete(entry)
        db.session.commit()
        return {"message": "Removed"}, None, 200

    @staticmethod
    def list_saved_searches(user_id):
        rows = (
            db.session.query(SavedSearch)
            .filter_by(user_id=user_id)
            .order_by(SavedSearch.created_at.desc())
            .all()
        )
        return {"savedSearches": [row.to_dict() for row in rows]}, None, 200

    @staticmethod
    def create_saved_search(user_id, data):
        name = (data.get("name") or "").strip()
        query = (data.get("query") or "").strip()
        if not name and not query:
            return None, "Name or query is required", 400

        saved = SavedSearch(
            user_id=user_id,
            name=name or query,
            query=query,
            filters_json=json.dumps(data.get("filters") or {}),
        )
        db.session.add(saved)
        db.session.commit()
        return {"savedSearch": saved.to_dict()}, None, 201

    @staticmethod
    def delete_saved_search(user_id, saved_id):
        saved = (
            db.session.query(SavedSearch)
            .filter_by(id=saved_id, user_id=user_id)
            .first()
        )
        if not saved:
            return None, "Not found", 404
        db.session.delete(saved)
        db.session.commit()
        return {"message": "Deleted"}, None, 200
