from collections import defaultdict
from datetime import datetime, timedelta

from flask import Blueprint, g, jsonify

from models import Item
from services.valuation_service import ensure_item_estimates
from utils.auth import jwt_required


collection_bp = Blueprint("collection", __name__)


@collection_bp.route("/me/collection/summary", methods=["GET"])
@jwt_required
def collection_summary():
    items = Item.query.filter_by(user_id=g.current_user.id).all()
    ensure_item_estimates(items)

    total_estimate_cents = sum((i.estimate_mid_cents or 0) for i in items)
    total_acquired_cents = sum((i.acquisition_price_cents or 0) for i in items)
    sold_items = [i for i in items if i.sold_at is not None]
    for_sale_count = sum(1 for i in items if i.for_sale)
    authenticated_count = sum(1 for i in items if (i.authentication_source or "").strip())

    by_sport = defaultdict(lambda: {"count": 0, "valueCents": 0})
    for i in items:
        sport = i.sport or "Other"
        by_sport[sport]["count"] += 1
        by_sport[sport]["valueCents"] += (i.estimate_mid_cents or 0)

    by_type = defaultdict(lambda: {"count": 0, "valueCents": 0})
    for i in items:
        kind = i.item_type or "Other"
        by_type[kind]["count"] += 1
        by_type[kind]["valueCents"] += (i.estimate_mid_cents or 0)

    history = _value_history(items)

    delta_30d = _percent_delta(history, 30)
    delta_90d = _percent_delta(history, 90)
    delta_365d = _percent_delta(history, 365)

    return jsonify({
        "totals": {
            "pieces": len(items),
            "estimate": total_estimate_cents // 100,
            "acquired": total_acquired_cents // 100,
            "gain": (total_estimate_cents - total_acquired_cents) // 100,
            "forSale": for_sale_count,
            "sold": len(sold_items),
            "authenticatedPct": round((authenticated_count / len(items)) * 100) if items else 0,
            "delta30d": delta_30d,
            "delta90d": delta_90d,
            "delta365d": delta_365d,
        },
        "bySport": [
            {"sport": s, "count": v["count"], "value": v["valueCents"] // 100}
            for s, v in sorted(by_sport.items(), key=lambda kv: kv[1]["valueCents"], reverse=True)
        ],
        "byType": [
            {"type": t, "count": v["count"], "value": v["valueCents"] // 100}
            for t, v in sorted(by_type.items(), key=lambda kv: kv[1]["valueCents"], reverse=True)
        ],
        "history": history,
    }), 200


def _value_history(items, weeks=24):
    """Compute a simple weekly running-total value-history for the user's items.

    Without a per-item time series of estimates, we approximate growth by
    walking forward from acquisition date and assuming each item's mid
    estimate phases in linearly between purchase and today.
    """
    if not items:
        return []

    now = datetime.utcnow().date()
    points = []
    step = max(1, 365 // weeks)
    for i in range(weeks, -1, -1):
        anchor = now - timedelta(days=i * step)
        total_cents = 0
        for item in items:
            mid = item.estimate_mid_cents or 0
            acquired = item.acquisition_price_cents or mid
            acquired_date = _parse_date(item.acquisition_date) or item.created_at.date()
            if anchor < acquired_date:
                continue
            days_held = max(1, (now - acquired_date).days)
            elapsed = (anchor - acquired_date).days
            ratio = min(1.0, max(0.0, elapsed / days_held))
            total_cents += acquired + int((mid - acquired) * ratio)
        points.append({
            "date": anchor.isoformat(),
            "value": total_cents // 100,
        })
    return points


def _parse_date(value):
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%Y/%m/%d"):
        try:
            return datetime.strptime(value, fmt).date()
        except (ValueError, TypeError):
            continue
    return None


def _percent_delta(history, days):
    if not history or len(history) < 2:
        return 0.0
    latest = history[-1]["value"]
    if latest == 0:
        return 0.0
    target_date = datetime.utcnow().date() - timedelta(days=days)
    prior = history[0]["value"]
    for point in history:
        if datetime.strptime(point["date"], "%Y-%m-%d").date() <= target_date:
            prior = point["value"]
        else:
            break
    if prior == 0:
        return 0.0
    return round(((latest - prior) / prior) * 100, 1)
