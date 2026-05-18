"""Index- and trait-driven valuation for game-used collectibles.

Estimates anchor on the player's Stitched index and item type, then apply
documented multipliers (postseason, photo-match, rookie, auth tier, etc.).
When comparable sales exist, we blend in comp medians to keep outputs
grounded in recent auction results.
"""
import statistics

from models import Comp, Player


HIGH_CONFIDENCE = "High"
MEDIUM_CONFIDENCE = "Medium"
LOW_CONFIDENCE = "Low"

INDEX_REFERENCE = 1000.0

# Baseline market value (cents) at index 1000, by normalized item type.
TYPE_BASE_CENTS = {
    "bat": 200_000,
    "jersey": 900_000,
    "card": 350_000,
    "helmet": 450_000,
    "cleats": 350_000,
    "sneakers": 800_000,
    "baseball": 150_000,
    "football": 500_000,
    "glove": 250_000,
    "batting gloves": 80_000,
    "puck": 120_000,
    "default": 250_000,
}

TRAIT_MULTIPLIERS = {
    "postseason": 1.25,
    "photo_matched": 1.35,
    "game_used": 1.15,
    "signed": 1.10,
    "issued": 0.92,
    "rookie": 1.18,
}

AUTH_MULTIPLIERS = {
    "meigray": 1.14,
    "mlb authentication": 1.10,
    "fanatics authentic": 1.08,
    "psa/dna": 1.12,
    "beckett": 1.10,
    "jsa": 1.06,
    "upper deck authenticated": 1.08,
    "team loa": 1.04,
    "photo match": 1.12,
    "none": 0.88,
    "unauthenticated": 0.85,
}

CONFIDENCE_SPREAD = {
    HIGH_CONFIDENCE: 0.12,
    MEDIUM_CONFIDENCE: 0.18,
    LOW_CONFIDENCE: 0.24,
}

COMP_BLEND_WEIGHT = 0.32
ACQUISITION_FALLBACK_MULTIPLIER = 1.18


def revalue_item(item):
    """Compute and persist an updated estimate on the item. Returns a result dict."""
    result = compute_estimate(item)
    low_cents = result.get("lowCents")
    mid_cents = result.get("midCents")
    high_cents = result.get("highCents")

    if mid_cents is None and item.acquisition_price_cents:
        mid_cents = int(item.acquisition_price_cents * ACQUISITION_FALLBACK_MULTIPLIER)
        low_cents = int(mid_cents * 0.86)
        high_cents = int(mid_cents * 1.16)

    item.estimate_low_cents = low_cents
    item.estimate_mid_cents = mid_cents
    item.estimate_high_cents = high_cents
    item.confidence = result["confidence"]
    return format_valuation_result({
        **result,
        "lowCents": low_cents,
        "midCents": mid_cents,
        "highCents": high_cents,
    })


def ensure_item_estimates(items):
    """Backfill missing estimates for items (e.g. legacy rows or pre-valuation imports)."""
    from initialization.database import db

    updated = False
    for item in items:
        if item.estimate_mid_cents is None:
            revalue_item(item)
            updated = True
    if updated:
        db.session.commit()
    return updated


def format_valuation_result(result):
    """Shape an internal estimate dict for API responses."""
    used = result.get("compsUsed") or []
    return {
        "low": _cents_to_dollars(result.get("lowCents")),
        "mid": _cents_to_dollars(result.get("midCents")),
        "high": _cents_to_dollars(result.get("highCents")),
        "confidence": result["confidence"],
        "compsUsed": [c.to_dict() for c in used],
        "compsConsidered": result.get("compsConsidered", 0),
        "factors": result.get("factors", []),
        "playerIndex": result.get("playerIndex"),
    }


def compute_estimate(item):
    """Return a full valuation breakdown without mutating the item."""
    player = Player.query.get(item.player_id) if item.player_id else None
    has_player_index = bool(player and player.current_index)
    player_index = float(player.current_index) if has_player_index else None

    factors = []
    multiplier = 1.0
    anchor_cents = 0

    if has_player_index:
        type_key = _normalize_type(item.item_type)
        type_base = TYPE_BASE_CENTS.get(type_key, TYPE_BASE_CENTS["default"])
        anchor_cents = int(type_base * (player_index / INDEX_REFERENCE))
        factors.append({
            "dir": "up",
            "label": f"{player.name} index ({player_index:,.0f})",
            "weight": "base",
        })

    usage = (item.usage_type or "").lower()
    auth = (item.authentication_source or "").lower()

    if item.postseason:
        multiplier = _apply_trait(multiplier, TRAIT_MULTIPLIERS["postseason"], "Postseason game", factors)

    if _is_photo_matched(usage, auth, item):
        multiplier = _apply_trait(multiplier, TRAIT_MULTIPLIERS["photo_matched"], "Photo-matched", factors)
    elif "game-used" in usage or "game used" in usage:
        multiplier = _apply_trait(multiplier, TRAIT_MULTIPLIERS["game_used"], "Game-used", factors)
    elif "signed" in usage:
        multiplier = _apply_trait(multiplier, TRAIT_MULTIPLIERS["signed"], "Signed", factors)
    elif "issued" in usage:
        multiplier = _apply_trait(multiplier, TRAIT_MULTIPLIERS["issued"], "Team-issued (non game-used)", factors)

    if item.rookie:
        multiplier = _apply_trait(multiplier, TRAIT_MULTIPLIERS["rookie"], "Rookie season piece", factors)

    if auth:
        auth_mult = _auth_multiplier(auth)
        if auth_mult != 1.0:
            label = item.authentication_source or "Authentication"
            multiplier = _apply_trait(multiplier, auth_mult, f"{label} authenticated", factors)
        if "none" in auth or "unauthenticated" in auth:
            multiplier = _apply_trait(
                multiplier,
                AUTH_MULTIPLIERS["unauthenticated"],
                "No third-party authentication",
                factors,
            )

    index_mid_cents = max(int(anchor_cents * multiplier), 0) if has_player_index else 0

    comps = _matching_comps(item)
    used = [c for c in comps if c.used_in_valuation] or comps
    comp_mid_cents = _comp_mid_cents(used)

    if comp_mid_cents and index_mid_cents > 0:
        mid_cents = int((1 - COMP_BLEND_WEIGHT) * index_mid_cents + COMP_BLEND_WEIGHT * comp_mid_cents)
        factors.append({
            "dir": "up" if comp_mid_cents >= index_mid_cents else "down",
            "label": f"{len(used)} comparable sale{'s' if len(used) != 1 else ''}",
            "weight": _format_weight(comp_mid_cents / index_mid_cents),
        })
    elif comp_mid_cents:
        mid_cents = comp_mid_cents
    elif index_mid_cents > 0:
        mid_cents = index_mid_cents
    else:
        return _acquisition_fallback(item)

    confidence = _confidence_for(used, has_index_anchor=has_player_index)
    low_cents, high_cents = _estimate_range(mid_cents, confidence, used)

    return {
        "lowCents": low_cents,
        "midCents": mid_cents,
        "highCents": high_cents,
        "confidence": confidence,
        "compsUsed": used,
        "compsConsidered": len(comps),
        "factors": factors[:8],
        "playerIndex": round(player_index, 2) if player_index is not None else None,
        "indexMidCents": index_mid_cents,
        "compMidCents": comp_mid_cents,
    }


def _acquisition_fallback(item):
    base = item.acquisition_price_cents or 0
    if base <= 0:
        return {
            "lowCents": None,
            "midCents": None,
            "highCents": None,
            "confidence": LOW_CONFIDENCE,
            "compsUsed": [],
            "compsConsidered": 0,
            "factors": [],
            "playerIndex": None,
            "indexMidCents": None,
            "compMidCents": None,
        }

    mid_cents = int(base * ACQUISITION_FALLBACK_MULTIPLIER)
    low_cents = int(mid_cents * 0.86)
    high_cents = int(mid_cents * 1.16)
    factors = [{
        "dir": "up",
        "label": "Acquisition price anchor (no index/comps)",
        "weight": _format_weight(ACQUISITION_FALLBACK_MULTIPLIER),
    }]

    return {
        "lowCents": low_cents,
        "midCents": mid_cents,
        "highCents": high_cents,
        "confidence": LOW_CONFIDENCE,
        "compsUsed": [],
        "compsConsidered": 0,
        "factors": factors,
        "playerIndex": None,
        "indexMidCents": None,
        "compMidCents": None,
    }


def _matching_comps(item):
    if not item.player_id:
        return []
    query = Comp.query.filter_by(player_id=item.player_id)
    if item.item_type:
        type_matches = query.filter(Comp.item_type.ilike(item.item_type)).all()
        if type_matches:
            return type_matches
    return query.all()


def _comp_mid_cents(comps):
    if not comps:
        return None
    prices = sorted(c.price_cents for c in comps)
    return int(statistics.median(prices))


def _confidence_for(comps, has_index_anchor=False):
    if not comps and not has_index_anchor:
        return LOW_CONFIDENCE
    if not comps:
        return MEDIUM_CONFIDENCE if has_index_anchor else LOW_CONFIDENCE

    avg = sum(c.confidence for c in comps) / len(comps)
    if avg >= 90 and len(comps) >= 3 and has_index_anchor:
        return HIGH_CONFIDENCE
    if avg >= 80:
        return MEDIUM_CONFIDENCE
    return LOW_CONFIDENCE


def _estimate_range(mid_cents, confidence, comps):
    spread = CONFIDENCE_SPREAD.get(confidence, 0.24)
    if len(comps) >= 2:
        prices = sorted(c.price_cents for c in comps)
        comp_spread = (prices[-1] - prices[0]) / max(mid_cents, 1)
        spread = min(0.30, max(spread, comp_spread * 0.45))

    low = int(mid_cents * (1 - spread))
    high = int(mid_cents * (1 + spread))
    return max(low, 0), max(high, 0)


def _normalize_type(item_type):
    return (item_type or "").strip().lower() or "default"


def _is_photo_matched(usage, auth, item):
    haystack = " ".join([
        usage,
        auth,
        (item.provenance or "").lower(),
        (item.notes or "").lower(),
    ])
    return "photo-match" in haystack or "photo match" in haystack or "photo-matched" in haystack


def _auth_multiplier(auth):
    if not auth:
        return 1.0
    for key, mult in AUTH_MULTIPLIERS.items():
        if key in auth:
            return mult
    return 1.06


def _apply_trait(multiplier, trait_mult, label, factors):
    if trait_mult == 1.0:
        return multiplier
    factors.append({
        "dir": "up" if trait_mult >= 1.0 else "down",
        "label": label,
        "weight": _format_weight(trait_mult),
    })
    return multiplier * trait_mult


def _cents_to_dollars(cents):
    if cents is None:
        return None
    return round(cents / 100)


def _format_weight(multiplier):
    if isinstance(multiplier, str) and multiplier == "base":
        return "base"
    pct = (float(multiplier) - 1.0) * 100
    if abs(pct) < 0.5:
        return "—"
    if pct > 0:
        return f"+{pct:.0f}%"
    return f"{pct:.0f}%"
