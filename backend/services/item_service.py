"""Collection items — create, update, value, list for sale, and sell."""

from datetime import datetime

from initialization.database import db
from models import Item
from services.feed_service import record_event
from services.valuation_service import (
    compute_estimate,
    ensure_item_estimates,
    format_valuation_result,
    revalue_item,
)
from utils.item_serialization import serialize_item, serialize_items
from utils.items import (
    clean_string,
    dollars_to_cents,
    normalize_item_payload,
    validate_item,
)


class ItemService:
    @staticmethod
    def estimate(user_id, data):
        payload = normalize_item_payload(data or {})
        validation_error = validate_item(payload)
        if validation_error:
            return None, validation_error, 400

        preview = Item(user_id=user_id, **payload)
        result = compute_estimate(preview)
        return {"valuation": format_valuation_result(result)}, None, 200

    @staticmethod
    def list_for_user(user_id):
        items = (
            Item.query
            .filter_by(user_id=user_id)
            .order_by(Item.created_at.desc())
            .all()
        )
        ensure_item_estimates(items)
        return {"items": serialize_items(items, viewer_user_id=user_id)}, None, 200

    @staticmethod
    def create(user_id, data):
        payload = normalize_item_payload(data or {})
        validation_error = validate_item(payload)
        if validation_error:
            return None, validation_error, 400

        item = Item(user_id=user_id, **payload)
        db.session.add(item)
        db.session.flush()
        revalue_item(item)
        record_event(
            kind="added",
            actor_user_id=user_id,
            subject_type="item",
            subject_id=item.id,
            payload={
                "title": item.title,
                "player": item.player_id,
                "sport": item.sport,
                "type": item.item_type,
            },
        )
        db.session.commit()
        return {"item": serialize_item(item, viewer_user_id=user_id)}, None, 201

    @staticmethod
    def get(item_id, viewer_user_id):
        item = Item.query.filter_by(id=item_id).first()
        if not item:
            return None, "Item not found", 404
        if item.user_id != viewer_user_id and item.visibility != "public":
            return None, "Item not found", 404
        return {
            "item": serialize_item(item, viewer_user_id=viewer_user_id),
            "valuation": format_valuation_result(compute_estimate(item)),
        }, None, 200

    @staticmethod
    def update(user_id, item_id, data):
        item, error = ItemService._require_owned(item_id, user_id)
        if error:
            return None, error, 404

        payload = normalize_item_payload(data or {}, defaults=item)
        for key, value in payload.items():
            setattr(item, key, value)

        revalue_item(item)
        record_event(
            kind="updated",
            actor_user_id=user_id,
            subject_type="item",
            subject_id=item.id,
            payload={"title": item.title},
        )
        db.session.commit()
        return {"item": serialize_item(item, viewer_user_id=user_id)}, None, 200

    @staticmethod
    def delete(user_id, item_id):
        item, error = ItemService._require_owned(item_id, user_id)
        if error:
            return None, error, 404
        db.session.delete(item)
        db.session.commit()
        return {"message": "Item deleted"}, None, 200

    @staticmethod
    def revalue(user_id, item_id):
        item, error = ItemService._require_owned(item_id, user_id)
        if error:
            return None, error, 404
        valuation = revalue_item(item)
        db.session.commit()
        return {
            "item": serialize_item(item, viewer_user_id=user_id),
            "valuation": valuation,
        }, None, 200

    @staticmethod
    def list_for_sale(user_id, item_id, data):
        item, error = ItemService._require_owned(item_id, user_id)
        if error:
            return None, error, 404

        item.for_sale = True
        asking = data.get("askingPrice") or data.get("asking") or data.get("asking_price")
        if asking is not None:
            item.asking_price_cents = dollars_to_cents(asking)

        record_event(
            kind="listed",
            actor_user_id=user_id,
            subject_type="item",
            subject_id=item.id,
            payload={"title": item.title, "asking": item.asking_price_cents},
        )
        db.session.commit()
        return {"item": serialize_item(item, viewer_user_id=user_id)}, None, 200

    @staticmethod
    def unlist(user_id, item_id):
        item, error = ItemService._require_owned(item_id, user_id)
        if error:
            return None, error, 404

        item.for_sale = False
        item.asking_price_cents = None
        db.session.commit()
        return {"item": serialize_item(item, viewer_user_id=user_id)}, None, 200

    @staticmethod
    def mark_sold(user_id, item_id, data):
        item, error = ItemService._require_owned(item_id, user_id)
        if error:
            return None, error, 404

        item.sold_at = datetime.utcnow()
        sold_price = data.get("soldPrice") or data.get("price")
        if sold_price is not None:
            item.sold_price_cents = dollars_to_cents(sold_price)
        item.sold_to = clean_string(data.get("soldTo"))
        item.for_sale = False

        record_event(
            kind="sold",
            actor_user_id=user_id,
            subject_type="item",
            subject_id=item.id,
            payload={"title": item.title, "soldPrice": item.sold_price_cents},
        )
        db.session.commit()
        return {"item": serialize_item(item, viewer_user_id=user_id)}, None, 200

    @staticmethod
    def _require_owned(item_id, user_id):
        item = Item.query.filter_by(id=item_id, user_id=user_id).first()
        if item:
            return item, None
        return None, "Item not found"
