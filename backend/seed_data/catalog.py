"""Read-only catalog data: players, index history, comps, market ticker.

Catalog fixtures live in ``shared/catalog.json`` — the single source of truth
consumed by both the backend seeder and the frontend bootstrap layer.
"""

from datetime import datetime, timedelta

from initialization.database import db
from models import Comp, MarketTickerEntry, NotableSale, Player, PlayerIndexPoint
from seed_data.load_shared import load_shared_json

_CATALOG = load_shared_json("catalog.json")

PLAYERS = _CATALOG["players"]
SERIES = _CATALOG["playerIndexSeries"]
COMPS = _CATALOG["comps"]
NOTABLE_SALES = _CATALOG["notableSales"]
MARKET_TICKER_ITEMS = _CATALOG["marketTicker"]


def seed_catalog(*, force=False):
    """Seed players, index points, comps, notable sales, and ticker. Idempotent unless force=True."""
    _seed_players(force=force)
    _seed_player_index_points(force=force)
    _seed_comps(force=force)
    _seed_notable_sales(force=force)
    _seed_market_ticker(force=force)
    db.session.commit()


def _seed_players(force=False):
    if Player.query.count() > 0 and not force:
        return
    if force:
        PlayerIndexPoint.query.delete()
        Comp.query.delete()
        Player.query.delete()
    for entry in PLAYERS:
        db.session.add(Player(
            id=entry["id"],
            name=entry["name"],
            team=entry["team"],
            sport=entry["sport"],
            initials=entry["initials"],
            color=entry["color"],
            current_index=entry["index"],
            d30=entry["d30"],
            d90=entry["d90"],
            d365=entry["d365"],
        ))


def _seed_player_index_points(force=False):
    if PlayerIndexPoint.query.count() > 0 and not force:
        return
    if force:
        PlayerIndexPoint.query.delete()
    base = datetime.utcnow()
    for player_id, values in SERIES.items():
        total = len(values)
        for idx, value in enumerate(values):
            offset = (total - 1 - idx) * 15
            ts = base - timedelta(days=offset)
            db.session.add(PlayerIndexPoint(player_id=player_id, ts=ts, value=float(value)))


def _seed_comps(force=False):
    if Comp.query.count() > 0 and not force:
        return
    if force:
        Comp.query.delete()
    for entry in COMPS:
        db.session.add(Comp(
            id=entry["id"],
            player_id=entry["player"],
            title=entry["title"],
            source=entry["source"],
            sale_date=entry["date"],
            price_cents=int(entry["price"]) * 100,
            buyers_premium=entry["premium"],
            item_type=entry["type"],
            auth=entry["auth"],
            confidence=entry["confidence"],
            used_in_valuation=entry["usedIn"],
        ))


def _seed_notable_sales(force=False):
    if NotableSale.query.count() > 0 and not force:
        return
    if force:
        NotableSale.query.delete()
    for entry in NOTABLE_SALES:
        db.session.add(NotableSale(
            title=entry["title"],
            house=entry["house"],
            sale_date=entry["date"],
            price_cents=int(entry["price"]) * 100,
            player_id=entry.get("player"),
            sport=entry.get("sport"),
        ))


def _seed_market_ticker(force=False):
    if MarketTickerEntry.query.count() > 0 and not force:
        return
    if force:
        MarketTickerEntry.query.delete()
    for idx, entry in enumerate(MARKET_TICKER_ITEMS):
        db.session.add(MarketTickerEntry(
            label=entry["label"],
            value=entry["value"],
            pct_change=entry["pct"],
            sport=entry.get("sport"),
            sort_order=idx,
        ))
