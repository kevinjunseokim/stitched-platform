"""Read-only catalog data: players, index history, comps, market ticker."""

from datetime import datetime, timedelta

from initialization.database import db
from models import Comp, MarketTickerEntry, NotableSale, Player, PlayerIndexPoint


PLAYERS = [
    {"id": "corbin-carroll", "name": "Corbin Carroll", "team": "Arizona Diamondbacks", "sport": "MLB", "initials": "CC", "color": "#5C3820", "index": 1284.12, "d30": 8.4, "d90": 14.2, "d365": 41.6},
    {"id": "shohei-ohtani", "name": "Shohei Ohtani", "team": "Los Angeles Dodgers", "sport": "MLB", "initials": "SO", "color": "#1F4A30", "index": 2201.16, "d30": 1.2, "d90": 6.8, "d365": 22.4},
    {"id": "anthony-edwards", "name": "Anthony Edwards", "team": "Minnesota Timberwolves", "sport": "NBA", "initials": "AE", "color": "#1A3F6B", "index": 1844.20, "d30": 5.6, "d90": 11.2, "d365": 38.2},
    {"id": "patrick-mahomes", "name": "Patrick Mahomes", "team": "Kansas City Chiefs", "sport": "NFL", "initials": "PM", "color": "#9B3618", "index": 2417.30, "d30": 3.8, "d90": 9.4, "d365": 18.6},
    {"id": "julio-rodriguez", "name": "Julio Rodríguez", "team": "Seattle Mariners", "sport": "MLB", "initials": "JR", "color": "#B8902F", "index": 1408.55, "d30": -2.1, "d90": 4.4, "d365": 12.8},
    {"id": "victor-wembanyama", "name": "Victor Wembanyama", "team": "San Antonio Spurs", "sport": "NBA", "initials": "VW", "color": "#3E2616", "index": 2884.06, "d30": 7.2, "d90": 22.4, "d365": 124.0},
    {"id": "aaron-judge", "name": "Aaron Judge", "team": "New York Yankees", "sport": "MLB", "initials": "AJ", "color": "#1A3F6B", "index": 1722.40, "d30": -0.4, "d90": 2.8, "d365": 8.6},
    {"id": "bobby-witt-jr", "name": "Bobby Witt Jr.", "team": "Kansas City Royals", "sport": "MLB", "initials": "BW", "color": "#1F4A30", "index": 988.20, "d30": 4.2, "d90": 8.1, "d365": 28.4},
    {"id": "lebron-james", "name": "LeBron James", "team": "Los Angeles Lakers", "sport": "NBA", "initials": "LJ", "color": "#9B3618", "index": 1704.30, "d30": 0.8, "d90": 3.2, "d365": 6.4},
    {"id": "connor-mcdavid", "name": "Connor McDavid", "team": "Edmonton Oilers", "sport": "NHL", "initials": "CM", "color": "#1A3F6B", "index": 986.12, "d30": 2.6, "d90": 5.1, "d365": 11.8},
]


SERIES = {
    "corbin-carroll": [820, 845, 832, 870, 858, 884, 904, 928, 942, 936, 968, 992, 1008, 1042, 1058, 1086, 1102, 1144, 1188, 1212, 1226, 1248, 1268, 1284],
    "shohei-ohtani": [1820, 1844, 1862, 1854, 1872, 1908, 1924, 1942, 1968, 1986, 2002, 2018, 2034, 2042, 2058, 2074, 2092, 2118, 2146, 2168, 2184, 2192, 2198, 2201],
    "anthony-edwards": [1320, 1346, 1372, 1364, 1388, 1422, 1448, 1486, 1510, 1542, 1568, 1594, 1612, 1638, 1664, 1696, 1722, 1748, 1768, 1786, 1808, 1822, 1834, 1844],
    "patrick-mahomes": [2040, 2068, 2092, 2118, 2138, 2156, 2178, 2204, 2218, 2236, 2254, 2278, 2298, 2316, 2334, 2352, 2368, 2378, 2386, 2392, 2400, 2408, 2412, 2417],
    "julio-rodriguez": [1248, 1262, 1280, 1296, 1308, 1322, 1336, 1348, 1356, 1368, 1374, 1380, 1386, 1390, 1396, 1400, 1402, 1406, 1408, 1408, 1409, 1408, 1408, 1408],
    "victor-wembanyama": [1284, 1366, 1448, 1538, 1620, 1716, 1808, 1908, 2008, 2102, 2188, 2278, 2358, 2438, 2516, 2596, 2658, 2716, 2768, 2812, 2842, 2864, 2876, 2884],
    "aaron-judge": [1586, 1598, 1614, 1628, 1640, 1652, 1664, 1672, 1680, 1686, 1692, 1696, 1700, 1704, 1708, 1710, 1712, 1714, 1716, 1718, 1720, 1722, 1722, 1722],
    "bobby-witt-jr": [770, 790, 808, 822, 836, 850, 864, 878, 890, 902, 914, 924, 932, 942, 950, 958, 964, 970, 974, 978, 982, 984, 986, 988],
    "lebron-james": [1620, 1634, 1648, 1656, 1664, 1672, 1680, 1686, 1692, 1696, 1700, 1704, 1706, 1708, 1704, 1702, 1704, 1706, 1704, 1704, 1704, 1704, 1704, 1704],
    "connor-mcdavid": [920, 932, 944, 952, 958, 964, 970, 976, 980, 982, 984, 986, 986, 986, 986, 986, 986, 986, 986, 986, 986, 986, 986, 986],
}


COMPS = [
    {"id": "c1", "title": "2023 Topps Carroll Rookie RPA /99 (PSA 10)", "source": "Goldin", "date": "2025-04-12", "price": 14250, "premium": 0.20, "player": "corbin-carroll", "type": "Card", "auth": "PSA/DNA", "confidence": 95, "usedIn": True},
    {"id": "c2", "title": "Carroll 2023 Game-Used Bat (Sept 14 vs LAD)", "source": "MLB Auctions", "date": "2025-03-28", "price": 2820, "premium": 0.18, "player": "corbin-carroll", "type": "Bat", "auth": "MLB Authentication", "confidence": 92, "usedIn": True},
    {"id": "c3", "title": "Carroll Rookie Season Signed Bat (LOA)", "source": "Heritage Auctions", "date": "2025-03-04", "price": 1680, "premium": 0.20, "player": "corbin-carroll", "type": "Bat", "auth": "JSA", "confidence": 78, "usedIn": False},
    {"id": "c4", "title": "Carroll Game-Used Batting Helmet (2023 NLDS)", "source": "Hunt Auctions", "date": "2025-02-19", "price": 4220, "premium": 0.22, "player": "corbin-carroll", "type": "Helmet", "auth": "MLB Authentication", "confidence": 88, "usedIn": False},
    {"id": "c5", "title": "Carroll Photo-Matched Jersey (Sept 2023)", "source": "Lelands", "date": "2025-02-08", "price": 18800, "premium": 0.18, "player": "corbin-carroll", "type": "Jersey", "auth": "MeiGray", "confidence": 96, "usedIn": True},
    {"id": "c6", "title": "Carroll 2023 Game-Used Bat (Aug 11)", "source": "MLB Auctions", "date": "2025-01-22", "price": 2410, "premium": 0.18, "player": "corbin-carroll", "type": "Bat", "auth": "MLB Authentication", "confidence": 90, "usedIn": True},
    {"id": "c7", "title": "Carroll Signed Rookie Card #BB-1 (1/1)", "source": "Goldin", "date": "2024-12-14", "price": 9400, "premium": 0.20, "player": "corbin-carroll", "type": "Card", "auth": "Beckett", "confidence": 82, "usedIn": False},
    {"id": "c8", "title": "Ohtani 2024 50/50 game-used ball (mid-game)", "source": "Fanatics Auctions", "date": "2025-04-08", "price": 4625000, "premium": 0.20, "player": "shohei-ohtani", "type": "Baseball", "auth": "MLB Authentication", "confidence": 99, "usedIn": True},
    {"id": "c9", "title": "Wembanyama Rookie Photo-Match Jersey (Feb 9)", "source": "Lelands", "date": "2025-03-19", "price": 78400, "premium": 0.18, "player": "victor-wembanyama", "type": "Jersey", "auth": "MeiGray", "confidence": 96, "usedIn": True},
    {"id": "c10", "title": "Edwards Signed Rookie Card #BB-1", "source": "Goldin", "date": "2025-03-12", "price": 8200, "premium": 0.20, "player": "anthony-edwards", "type": "Card", "auth": "PSA/DNA", "confidence": 90, "usedIn": True},
    {"id": "c11", "title": "Mahomes 2023 Game-Used Cleats (Week 7)", "source": "Heritage Auctions", "date": "2025-02-26", "price": 5400, "premium": 0.22, "player": "patrick-mahomes", "type": "Cleats", "auth": "Fanatics Authentic", "confidence": 88, "usedIn": True},
    {"id": "c12", "title": "Witt Jr. Game-Used Jersey (June 2024)", "source": "Hunt Auctions", "date": "2025-01-08", "price": 3820, "premium": 0.20, "player": "bobby-witt-jr", "type": "Jersey", "auth": "MLB Authentication", "confidence": 86, "usedIn": False},
    {"id": "c13", "title": "Judge Game-Used Bat (Sept 14 vs HOU)", "source": "MLB Auctions", "date": "2024-12-22", "price": 4200, "premium": 0.18, "player": "aaron-judge", "type": "Bat", "auth": "MLB Authentication", "confidence": 94, "usedIn": True},
    {"id": "c14", "title": "Julio Rodriguez Game-Used Batting Gloves (Aug 2023)", "source": "MLB Auctions", "date": "2024-11-15", "price": 1100, "premium": 0.18, "player": "julio-rodriguez", "type": "Batting Gloves", "auth": "MLB Authentication", "confidence": 84, "usedIn": True},
    {"id": "c15", "title": "Julio Rodriguez Signed Rookie Jersey", "source": "Goldin", "date": "2024-10-22", "price": 2400, "premium": 0.20, "player": "julio-rodriguez", "type": "Jersey", "auth": "PSA/DNA", "confidence": 88, "usedIn": False},
    {"id": "c16", "title": "Ohtani 2024 Game-Used Baseball (June 22)", "source": "MLB Auctions", "date": "2025-03-15", "price": 6100, "premium": 0.18, "player": "shohei-ohtani", "type": "Baseball", "auth": "MLB Authentication", "confidence": 93, "usedIn": True},
    {"id": "c17", "title": "Edwards 2024 Game-Worn Jersey (Playoffs)", "source": "Fanatics Auctions", "date": "2025-02-02", "price": 12400, "premium": 0.20, "player": "anthony-edwards", "type": "Jersey", "auth": "Fanatics Authentic", "confidence": 91, "usedIn": True},
    {"id": "c18", "title": "Mahomes Super Bowl LVIII Game-Used Football", "source": "Goldin", "date": "2025-04-12", "price": 186000, "premium": 0.20, "player": "patrick-mahomes", "type": "Football", "auth": "Fanatics Authentic", "confidence": 97, "usedIn": False},
    {"id": "c19", "title": "Judge 2024 Home Run No. 40 Game-Used Bat", "source": "Heritage Auctions", "date": "2025-01-30", "price": 8900, "premium": 0.18, "player": "aaron-judge", "type": "Bat", "auth": "MLB Authentication", "confidence": 95, "usedIn": True},
    {"id": "c20", "title": "Wembanyama Debut Game-Used Sneakers", "source": "Sotheby's", "date": "2025-01-30", "price": 124500, "premium": 0.18, "player": "victor-wembanyama", "type": "Sneakers", "auth": "MeiGray", "confidence": 94, "usedIn": True},
    {"id": "c21", "title": "LeBron 2020 Finals Game-Worn Jersey", "source": "Goldin", "date": "2024-11-08", "price": 420000, "premium": 0.20, "player": "lebron-james", "type": "Jersey", "auth": "MeiGray", "confidence": 98, "usedIn": True},
    {"id": "c22", "title": "McDavid Hart Trophy Season Signed Puck", "source": "Heritage Auctions", "date": "2024-12-18", "price": 4200, "premium": 0.20, "player": "connor-mcdavid", "type": "Puck", "auth": "Upper Deck Authenticated", "confidence": 85, "usedIn": True},
    {"id": "c23", "title": "Carroll 2023 Rookie Season Game-Used Bat (Sept 12)", "source": "MLB Auctions", "date": "2024-09-18", "price": 2650, "premium": 0.18, "player": "corbin-carroll", "type": "Bat", "auth": "MLB Authentication", "confidence": 91, "usedIn": True},
    {"id": "c24", "title": "Edwards Timberwolves City Edition Signed Jersey", "source": "Goldin", "date": "2025-02-14", "price": 9800, "premium": 0.20, "player": "anthony-edwards", "type": "Jersey", "auth": "Fanatics Authentic", "confidence": 87, "usedIn": True},
]


NOTABLE_SALES = [
    {"title": "Mahomes SB LIV jersey", "house": "Goldin", "date": "Apr 12, 2025", "price": 1070000, "player": "patrick-mahomes", "sport": "NFL"},
    {"title": "Carroll rookie photo-match jersey", "house": "Lelands", "date": "Feb 08, 2025", "price": 18800, "player": "corbin-carroll", "sport": "MLB"},
    {"title": "Wemby debut sneakers (photo-match)", "house": "Sotheby's", "date": "Jan 30, 2025", "price": 124500, "player": "victor-wembanyama", "sport": "NBA"},
    {"title": "Ohtani 50/50 game-used ball", "house": "Fanatics Auctions", "date": "Dec 14, 2024", "price": 4625000, "player": "shohei-ohtani", "sport": "MLB"},
    {"title": "LeBron 2020 Finals jersey", "house": "Goldin", "date": "Nov 08, 2024", "price": 420000, "player": "lebron-james", "sport": "NBA"},
    {"title": "Judge 40th HR bat", "house": "Heritage Auctions", "date": "Jan 30, 2025", "price": 8900, "player": "aaron-judge", "sport": "MLB"},
]


MARKET_TICKER_ITEMS = [
    {"label": "Stitched 100", "value": "1,842.06", "pct": 1.8, "sport": None},
    {"label": "MLB", "value": "912.40", "pct": 2.1, "sport": "MLB"},
    {"label": "NBA", "value": "1,104.88", "pct": -0.4, "sport": "NBA"},
    {"label": "NFL", "value": "2,201.16", "pct": 3.8, "sport": "NFL"},
    {"label": "NHL", "value": "648.22", "pct": 0.6, "sport": "NHL"},
    {"label": "Ohtani", "value": "2,441.20", "pct": 3.2, "sport": "MLB"},
    {"label": "Wembanyama", "value": "2,884.06", "pct": 7.2, "sport": "NBA"},
    {"label": "Mahomes", "value": "1,156.40", "pct": 1.4, "sport": "NFL"},
    {"label": "Judge", "value": "1,892.55", "pct": -1.1, "sport": "MLB"},
    {"label": "LeBron", "value": "1,704.30", "pct": 0.8, "sport": "NBA"},
    {"label": "McDavid", "value": "986.12", "pct": 2.6, "sport": "NHL"},
]


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
