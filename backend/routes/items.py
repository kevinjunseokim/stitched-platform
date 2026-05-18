from datetime import datetime

from flask import Blueprint, g, jsonify, request

from initialization.database import db
from models import Item
from services.feed_service import record_event
from utils.items import (
    clean_string,
    dollars_to_cents,
    get_owned_item,
    normalize_item_payload,
    validate_item,
)
from services.valuation_service import (
    compute_estimate,
    ensure_item_estimates,
    format_valuation_result,
    revalue_item,
)
from utils.auth import jwt_required
from utils.item_serialization import serialize_item, serialize_items


items_bp = Blueprint("items", __name__)


@items_bp.route("/items/estimate", methods=["POST"])
@jwt_required
def estimate_item():
    """Dry-run valuation from an item payload (add-item preview, etc.)."""
    payload = normalize_item_payload(request.get_json() or {})
    validation_error = validate_item(payload)
    if validation_error:
        return jsonify({"error": validation_error}), 400

    preview = Item(user_id=g.current_user.id, **payload)
    result = compute_estimate(preview)
    return jsonify({"valuation": format_valuation_result(result)}), 200


@items_bp.route("/items", methods=["GET"])
@jwt_required
def list_items():
    items = (
        Item.query
        .filter_by(user_id=g.current_user.id)
        .order_by(Item.created_at.desc())
        .all()
    )
    ensure_item_estimates(items)
    return jsonify({"items": serialize_items(items, viewer_user_id=g.current_user.id)}), 200


@items_bp.route("/items", methods=["POST"])
@jwt_required
def create_item():
    payload = normalize_item_payload(request.get_json() or {})
    validation_error = validate_item(payload)
    if validation_error:
        return jsonify({"error": validation_error}), 400

    item = Item(user_id=g.current_user.id, **payload)
    db.session.add(item)
    db.session.flush()
    revalue_item(item)
    record_event(
        kind="added",
        actor_user_id=g.current_user.id,
        subject_type="item",
        subject_id=item.id,
        payload={"title": item.title, "player": item.player_id, "sport": item.sport, "type": item.item_type},
    )
    db.session.commit()
    return jsonify({"item": serialize_item(item, viewer_user_id=g.current_user.id)}), 201


@items_bp.route("/items/<item_id>", methods=["GET"])
@jwt_required
def get_item(item_id):
    item = Item.query.filter_by(id=item_id).first()
    if not item:
        return jsonify({"error": "Item not found"}), 404
    if item.user_id != g.current_user.id and item.visibility != "public":
        return jsonify({"error": "Item not found"}), 404
    return jsonify({
        "item": serialize_item(item, viewer_user_id=g.current_user.id),
        "valuation": format_valuation_result(compute_estimate(item)),
    }), 200


@items_bp.route("/items/<item_id>", methods=["PATCH"])
@jwt_required
def update_item(item_id):
    item, error_response = get_owned_item(item_id, g.current_user.id)
    if error_response:
        return error_response

    data = request.get_json() or {}
    payload = normalize_item_payload(data, defaults=item)
    for key, value in payload.items():
        setattr(item, key, value)

    revalue_item(item)
    record_event(
        kind="updated",
        actor_user_id=g.current_user.id,
        subject_type="item",
        subject_id=item.id,
        payload={"title": item.title},
    )
    db.session.commit()
    return jsonify({"item": serialize_item(item, viewer_user_id=g.current_user.id)}), 200


@items_bp.route("/items/<item_id>", methods=["DELETE"])
@jwt_required
def delete_item(item_id):
    item, error_response = get_owned_item(item_id, g.current_user.id)
    if error_response:
        return error_response
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Item deleted"}), 200


@items_bp.route("/items/<item_id>/revalue", methods=["POST"])
@jwt_required
def revalue(item_id):
    item, error_response = get_owned_item(item_id, g.current_user.id)
    if error_response:
        return error_response
    valuation = revalue_item(item)
    db.session.commit()
    return jsonify({
        "item": serialize_item(item, viewer_user_id=g.current_user.id),
        "valuation": valuation,
    }), 200


@items_bp.route("/items/<item_id>/list", methods=["POST"])
@jwt_required
def list_for_sale(item_id):
    item, error_response = get_owned_item(item_id, g.current_user.id)
    if error_response:
        return error_response

    data = request.get_json() or {}
    item.for_sale = True
    asking = data.get("askingPrice") or data.get("asking") or data.get("asking_price")
    if asking is not None:
        item.asking_price_cents = dollars_to_cents(asking)

    record_event(
        kind="listed",
        actor_user_id=g.current_user.id,
        subject_type="item",
        subject_id=item.id,
        payload={"title": item.title, "asking": item.asking_price_cents},
    )
    db.session.commit()
    return jsonify({"item": serialize_item(item, viewer_user_id=g.current_user.id)}), 200


@items_bp.route("/items/<item_id>/unlist", methods=["POST"])
@jwt_required
def unlist(item_id):
    item, error_response = get_owned_item(item_id, g.current_user.id)
    if error_response:
        return error_response

    item.for_sale = False
    item.asking_price_cents = None
    db.session.commit()
    return jsonify({"item": serialize_item(item, viewer_user_id=g.current_user.id)}), 200


@items_bp.route("/items/<item_id>/sell", methods=["POST"])
@jwt_required
def mark_sold(item_id):
    item, error_response = get_owned_item(item_id, g.current_user.id)
    if error_response:
        return error_response

    data = request.get_json() or {}
    item.sold_at = datetime.utcnow()
    sold_price = data.get("soldPrice") or data.get("price")
    if sold_price is not None:
        item.sold_price_cents = dollars_to_cents(sold_price)
    item.sold_to = clean_string(data.get("soldTo"))
    item.for_sale = False

    record_event(
        kind="sold",
        actor_user_id=g.current_user.id,
        subject_type="item",
        subject_id=item.id,
        payload={"title": item.title, "soldPrice": item.sold_price_cents},
    )
    db.session.commit()
    return jsonify({"item": serialize_item(item, viewer_user_id=g.current_user.id)}), 200
