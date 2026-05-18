from flask import Blueprint, jsonify

from models import MarketTickerEntry, NotableSale


market_bp = Blueprint("market", __name__)


@market_bp.route("/market/ticker", methods=["GET"])
def ticker():
    entries = MarketTickerEntry.query.order_by(MarketTickerEntry.sort_order.asc()).all()
    return jsonify({"ticker": [e.to_dict() for e in entries]}), 200


@market_bp.route("/market/notable-sales", methods=["GET"])
def notable_sales():
    sales = NotableSale.query.order_by(NotableSale.price_cents.desc()).all()
    return jsonify({"sales": [s.to_dict() for s in sales]}), 200
