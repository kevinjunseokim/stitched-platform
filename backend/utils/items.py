"""Item payload, display, and lookup helpers."""

import json


_COLUMN_MAP = {
    "title": "title",
    "sport": "sport",
    "league": "league",
    "player": "player_id",
    "team": "team",
    "type": "item_type",
    "season": "season",
    "gameDate": "game_date",
    "usage": "usage_type",
    "event": "event",
    "stats": "stats",
    "rookie": "rookie",
    "postseason": "postseason",
    "auth": "authentication_source",
    "cert": "certification_number",
    "provenance": "provenance",
    "priceDate": "acquisition_date",
    "acquiredDate": "acquisition_date",
    "source": "acquisition_source",
    "lot": "lot_reference",
    "notes": "notes",
    "visibility": "visibility",
    "forSale": "for_sale",
}


def normalize_item_payload(data, defaults=None):
    """Build a dict of Item column values from the wire payload.

    When ``defaults`` is provided (PATCH), missing keys fall back to the
    existing item value instead of being wiped to NULL.
    """

    def pick(key, fallback=None):
        if key in data:
            return data.get(key)
        if defaults is not None:
            attr = _column_for(key)
            return getattr(defaults, attr, fallback)
        return fallback

    price_value = data.get("price", data.get("acquired"))
    if price_value is None and defaults is not None:
        price_cents = defaults.acquisition_price_cents
    else:
        price_cents = dollars_to_cents(price_value)

    tags = [
        "Rookie season" if pick("rookie") else None,
        pick("usage"),
        pick("auth"),
        pick("type"),
        pick("team"),
    ]

    asking = data.get("asking", data.get("askingPrice"))
    if asking is None and defaults is not None:
        asking_cents = defaults.asking_price_cents
    else:
        asking_cents = dollars_to_cents(asking)

    sport = clean_string(pick("sport"))
    league = clean_string(pick("league"))
    if not league and sport:
        league = sport

    payload = {
        "title": clean_string(pick("title")),
        "sport": sport,
        "league": league,
        "player_id": clean_string(pick("player")),
        "team": clean_string(pick("team")),
        "item_type": clean_string(pick("type")),
        "season": clean_string(pick("season")),
        "game_date": clean_string(pick("gameDate")),
        "usage_type": clean_string(pick("usage")),
        "event": clean_string(pick("event")),
        "stats": clean_string(pick("stats")),
        "rookie": bool(pick("rookie")),
        "postseason": bool(pick("postseason")),
        "authentication_source": clean_string(pick("auth")),
        "certification_number": clean_string(pick("cert")),
        "provenance": clean_string(pick("provenance")),
        "acquisition_price_cents": price_cents,
        "acquisition_date": clean_string(pick("priceDate") or pick("acquiredDate")),
        "acquisition_source": clean_string(pick("source")),
        "lot_reference": clean_string(pick("lot")),
        "notes": clean_string(pick("notes")),
        "visibility": clean_string(pick("visibility")) or "public",
        "for_sale": bool(pick("forSale")) if "forSale" in data or defaults is None else defaults.for_sale,
        "asking_price_cents": asking_cents,
        "share_to_feed": data.get("share") is not False if defaults is None else data.get("share", defaults.share_to_feed) is not False,
        "tint": getattr(defaults, "tint", None) or "#5C3820",
        "glyph": glyph_for_type(pick("type", "")),
        "tags_json": json.dumps([tag for tag in tags if tag]),
        "badges_json": json.dumps(badges_for_item(data, defaults=defaults)),
    }

    if "images" in data or defaults is None:
        images = data.get("images", [])
        if not isinstance(images, list):
            images = []
        payload["images_json"] = json.dumps([
            str(url).strip()
            for url in images
            if str(url or "").strip()
        ])

    return payload


def validate_item(item):
    if not item["title"]:
        return "Item title is required"
    if not item["sport"]:
        return "Sport is required"
    if not item["item_type"]:
        return "Item type is required"
    if not item["player_id"]:
        return "Player is required"
    return None


def get_owned_item(item_id, user_id):
    from flask import jsonify
    from models import Item

    item = Item.query.filter_by(id=item_id, user_id=user_id).first()
    if item:
        return item, None
    return None, (jsonify({"error": "Item not found"}), 404)


def clean_string(value):
    return str(value or "").strip()


def dollars_to_cents(value):
    if value in (None, ""):
        return None
    try:
        normalized = str(value).replace("$", "").replace(",", "").strip()
        return round(float(normalized) * 100)
    except ValueError:
        return None


def cents_to_dollars(value):
    if value is None:
        return None
    return round(value / 100)


def parse_json_array(value):
    try:
        parsed = json.loads(value or "[]")
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []


def glyph_for_type(item_type):
    lowered = (item_type or "").lower()
    if "jersey" in lowered:
        return "J"
    if "cleat" in lowered or "sneaker" in lowered:
        return "C"
    if "glove" in lowered:
        return "G"
    if "ball" in lowered or "bat" in lowered or "puck" in lowered or "football" in lowered:
        return "B"
    return "S"


def badges_for_item(data, defaults=None):
    badges = []
    auth = data.get("auth") if "auth" in data else getattr(defaults, "authentication_source", None)
    rookie = data.get("rookie") if "rookie" in data else getattr(defaults, "rookie", False)
    for_sale = data.get("forSale") if "forSale" in data else getattr(defaults, "for_sale", False)
    if auth:
        badges.append({"kind": "auth", "label": "AUTH"})
    if rookie:
        badges.append({"kind": "field", "label": "ROOKIE"})
    if for_sale:
        badges.append({"kind": "pending", "label": "FOR SALE"})
    return badges


def _column_for(key):
    return _COLUMN_MAP.get(key, key)
