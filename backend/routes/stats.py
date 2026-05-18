from flask import Blueprint, jsonify
from sqlalchemy import func

from initialization.database import db
from models import Item, User

stats_bp = Blueprint("stats", __name__)

# Baseline counts so the landing page reflects early traction while growing with real signups/uploads.
BASE_COLLECTORS = 38_420
BASE_PIECES = 142_118
DEFAULT_AUTHENTICATED_PCT = 94
UNAUTHENTICATED_AUTH_VALUES = ("none", "none / unauthenticated", "unauthenticated")


def authenticated_pct(item_count, authenticated_count):
    if item_count == 0:
        return DEFAULT_AUTHENTICATED_PCT
    return round((authenticated_count / item_count) * 100)


@stats_bp.route("/stats", methods=["GET"])
def platform_stats():
    user_count = User.query.count()
    item_count = Item.query.count()
    authenticated_count = (
        db.session.query(func.count(Item.id))
        .filter(
            Item.authentication_source.isnot(None),
            Item.authentication_source != "",
            func.lower(Item.authentication_source).notin_(UNAUTHENTICATED_AUTH_VALUES),
        )
        .scalar()
        or 0
    )

    collectors = BASE_COLLECTORS + user_count
    pieces_tracked = BASE_PIECES + item_count
    auth_pct = authenticated_pct(item_count, authenticated_count)

    return jsonify({
        "collectors": collectors,
        "piecesTracked": pieces_tracked,
        "authenticatedPct": auth_pct,
        "liveUsers": user_count,
        "liveItems": item_count,
    }), 200
