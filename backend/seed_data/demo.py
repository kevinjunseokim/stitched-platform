"""Demo users, collection items, feed, and social graph for local development."""

import json
from datetime import datetime, timedelta

from werkzeug.security import generate_password_hash

from initialization.database import db
from models import (
    ActivityEvent,
    Comment,
    Follow,
    Item,
    Like,
    Notification,
    SavedSearch,
    User,
    WatchlistEntry,
)
from services.valuation_service import revalue_item
from utils.items import glyph_for_type

DEMO_PASSWORD = "demodemo1"
DEMO_EMAIL_SUFFIX = "@stitched.demo"


DEMO_USERS = [
    {
        "id": "demo-user-kevin",
        "email": f"kevin{DEMO_EMAIL_SUFFIX}",
        "handle": "kevin",
        "first_name": "Kevin",
        "last_name": "Kim",
        "bio": "Building Stitched. Game-used MLB and NBA focus.",
        "color": "#5C3820",
    },
    {
        "id": "demo-user-maya",
        "email": f"maya{DEMO_EMAIL_SUFFIX}",
        "handle": "maya",
        "first_name": "Maya",
        "last_name": "Okafor",
        "bio": "Vintage jerseys and authenticated bats. Always hunting rookie comps.",
        "color": "#1A3F6B",
    },
    {
        "id": "demo-user-rcho",
        "email": f"rcho{DEMO_EMAIL_SUFFIX}",
        "handle": "rcho",
        "first_name": "Roland",
        "last_name": "Cho",
        "bio": "NFL game-worn specialist. Chiefs and 49ers.",
        "color": "#1F4A30",
    },
    {
        "id": "demo-user-theo",
        "email": f"theo{DEMO_EMAIL_SUFFIX}",
        "handle": "theo",
        "first_name": "Theo",
        "last_name": "Brandt",
        "bio": "Cross-sport collector tracking unrealized gain on every piece.",
        "color": "#9B3618",
    },
    {
        "id": "demo-user-camille",
        "email": f"camille{DEMO_EMAIL_SUFFIX}",
        "handle": "camille",
        "first_name": "Camille",
        "last_name": "Lefevre",
        "bio": "Photo-match obsessive. MeiGray and MLB Authentication only.",
        "color": "#B8902F",
    },
]


def _item(
    item_id,
    owner_handle,
    title,
    player,
    team,
    sport,
    item_type,
    *,
    season=None,
    game_date=None,
    usage="Game-used",
    auth="MLB Authentication",
    cert=None,
    acquired=None,
    acquired_date=None,
    source="MLB Auctions",
    rookie=False,
    postseason=False,
    visibility="public",
    for_sale=False,
    asking=None,
    tint="#5C3820",
    glyph=None,
    tags=None,
    badges=None,
    notes="",
    sold=False,
    sold_price=None,
    days_ago=14,
):
    glyph = glyph or glyph_for_type(item_type)
    return {
        "id": item_id,
        "owner": owner_handle,
        "title": title,
        "player": player,
        "team": team,
        "sport": sport,
        "league": sport,
        "type": item_type,
        "season": season,
        "gameDate": game_date,
        "usage": usage,
        "auth": auth,
        "cert": cert,
        "acquired": acquired,
        "acquiredDate": acquired_date,
        "source": source,
        "rookie": rookie,
        "postseason": postseason,
        "visibility": visibility,
        "forSale": for_sale,
        "asking": asking,
        "tint": tint,
        "glyph": glyph,
        "tags": tags or [],
        "badges": badges or [],
        "notes": notes,
        "sold": sold,
        "soldPrice": sold_price,
        "daysAgo": days_ago,
    }


DEMO_ITEMS = [
    _item(
        "carroll-bat-2023", "kevin",
        "Corbin Carroll 2023 Rookie Season Game-Used Bat",
        "corbin-carroll", "Arizona Diamondbacks", "MLB", "Bat",
        season="2023", game_date="2023-09-12", cert="MLB-CC-0428-9B",
        acquired=1850, acquired_date="2024-02-04", rookie=True,
        tint="#5C3820", glyph="B",
        tags=["Rookie season", "Game used", "MLB authenticated", "Bat"],
        badges=[{"kind": "auth", "label": "AUTH"}, {"kind": "field", "label": "ROOKIE"}],
        notes="Pulled from the Sept 12 game vs LAD — Carroll went 2-for-4.",
        days_ago=2,
    ),
    _item(
        "ohtani-ball", "kevin",
        "Shohei Ohtani MLB-Authenticated Game-Used Baseball",
        "shohei-ohtani", "Los Angeles Dodgers", "MLB", "Baseball",
        season="2024", game_date="2024-06-22", cert="MLB-SO-1142-A2",
        acquired=4200, acquired_date="2024-08-15", tint="#1F4A30",
        tags=["Game used", "MLB authenticated", "Baseball"],
        badges=[{"kind": "auth", "label": "MLB AUTH"}],
        days_ago=11,
    ),
    _item(
        "edwards-jersey", "kevin",
        "Anthony Edwards Signed Rookie Jersey",
        "anthony-edwards", "Minnesota Timberwolves", "NBA", "Jersey",
        season="2020-21", usage="Signed", auth="Fanatics Authentic",
        cert="FAN-AE-RK-3091", acquired=1100, acquired_date="2022-11-09",
        for_sale=True, asking=4600, tint="#1A3F6B", glyph="J",
        tags=["Signed", "Rookie", "Jersey"],
        badges=[{"kind": "auth", "label": "FAN AUTH"}, {"kind": "hot", "label": "HOT"}],
        days_ago=34,
    ),
    _item(
        "mahomes-cleats", "kevin",
        "Patrick Mahomes Game-Used Cleats",
        "patrick-mahomes", "Kansas City Chiefs", "NFL", "Cleats",
        season="2023", game_date="2023-10-22", auth="Fanatics Authentic",
        cert="FAN-PM-CL-0871", acquired=3800, acquired_date="2024-01-20",
        tint="#9B3618", glyph="C", days_ago=60,
    ),
    _item(
        "julio-gloves", "kevin",
        "Julio Rodríguez Game-Used Batting Gloves",
        "julio-rodriguez", "Seattle Mariners", "MLB", "Batting Gloves",
        season="2023", game_date="2023-08-04", cert="MLB-JR-2208-7D",
        acquired=920, acquired_date="2024-03-12", tint="#B8902F", glyph="G",
        days_ago=90,
    ),
    _item(
        "wemby-jersey", "kevin",
        "Victor Wembanyama Rookie Photo-Matched Jersey",
        "victor-wembanyama", "San Antonio Spurs", "NBA", "Jersey",
        season="2023-24", game_date="2024-02-09",
        usage="Photo-matched", auth="MeiGray + Photo Match",
        cert="MEIGRAY-VW-1009", acquired=28000, acquired_date="2024-04-30",
        tint="#3E2616", glyph="J",
        badges=[{"kind": "rare", "label": "PHOTO-MATCH"}, {"kind": "auth", "label": "MEIGRAY"}],
        days_ago=120,
    ),
    _item(
        "maya-ohtani-bat", "maya",
        "Shohei Ohtani Walk-Off Signed Game-Used Bat",
        "shohei-ohtani", "Los Angeles Dodgers", "MLB", "Bat",
        season="2024", usage="Game-used", auth="MLB Authentication",
        cert="MLB-SO-WO-0912", acquired=9800, acquired_date="2024-10-02",
        sold=True, sold_price=11800, tint="#1F4A30", days_ago=45,
    ),
    _item(
        "maya-judge-bat", "maya",
        "Aaron Judge 2024 Home Run Game-Used Bat",
        "aaron-judge", "New York Yankees", "MLB", "Bat",
        season="2024", game_date="2024-08-30", acquired=6200,
        acquired_date="2024-11-18", visibility="public", days_ago=28,
    ),
    _item(
        "maya-wemby-card", "maya",
        "Victor Wembanyama Prizm Silver Rookie (PSA 10)",
        "victor-wembanyama", "San Antonio Spurs", "NBA", "Card",
        season="2023-24", usage="Issued", auth="PSA/DNA",
        acquired=2400, acquired_date="2024-06-01", tint="#3E2616", days_ago=75,
    ),
    _item(
        "rcho-mahomes-jersey", "rcho",
        "Patrick Mahomes Super Bowl LVIII Game-Worn Jersey",
        "patrick-mahomes", "Kansas City Chiefs", "NFL", "Jersey",
        season="2023", usage="Game-used", auth="Fanatics Authentic",
        acquired=42000, acquired_date="2024-03-01", tint="#9B3618", glyph="J",
        days_ago=40,
    ),
    _item(
        "rcho-mahomes-ball", "rcho",
        "Mahomes SB LVIII Game-Used Football",
        "patrick-mahomes", "Kansas City Chiefs", "NFL", "Football",
        season="2023", auth="Fanatics Authentic", acquired=8800,
        acquired_date="2024-04-12", days_ago=55,
    ),
    _item(
        "theo-carroll-helmet", "theo",
        "Corbin Carroll 2023 NLDS Game-Used Batting Helmet",
        "corbin-carroll", "Arizona Diamondbacks", "MLB", "Helmet",
        season="2023", postseason=True, acquired=3100,
        acquired_date="2024-01-08", tint="#5C3820", days_ago=50,
    ),
    _item(
        "theo-edwards-shoes", "theo",
        "Anthony Edwards Playoff Game-Worn Sneakers",
        "anthony-edwards", "Minnesota Timberwolves", "NBA", "Sneakers",
        season="2023-24", acquired=1800, acquired_date="2024-05-20",
        for_sale=True, asking=3200, tint="#1A3F6B", days_ago=22,
    ),
    _item(
        "theo-witt-jersey", "theo",
        "Bobby Witt Jr. 2024 All-Star Game Jersey",
        "bobby-witt-jr", "Kansas City Royals", "MLB", "Jersey",
        season="2024", acquired=2900, acquired_date="2024-07-18",
        days_ago=35,
    ),
    _item(
        "camille-carroll-jersey", "camille",
        "Corbin Carroll Photo-Matched Home Jersey (Sept 2023)",
        "corbin-carroll", "Arizona Diamondbacks", "MLB", "Jersey",
        season="2023", usage="Photo-matched", auth="MeiGray",
        cert="MEIGRAY-CC-0903", acquired=14200, acquired_date="2024-02-20",
        tint="#5C3820", glyph="J", days_ago=80,
    ),
    _item(
        "camille-mcdavid-puck", "camille",
        "Connor McDavid Hart Trophy Season Signed Puck",
        "connor-mcdavid", "Edmonton Oilers", "NHL", "Puck",
        season="2022-23", usage="Signed", auth="Upper Deck Authenticated",
        acquired=1800, acquired_date="2023-12-01", tint="#1A3F6B", days_ago=100,
    ),
    _item(
        "camille-lebron-jersey", "camille",
        "LeBron James 2020 Finals Game-Worn Jersey (LOA)",
        "lebron-james", "Los Angeles Lakers", "NBA", "Jersey",
        season="2019-20", auth="MeiGray", acquired=185000,
        acquired_date="2024-09-01", visibility="private", tint="#9B3618",
        days_ago=150,
    ),
]


FEED_EVENTS = [
    {
        "id": "seed-feed-001",
        "kind": "added",
        "actor": "kevin",
        "subject_type": "item",
        "subject_id": "carroll-bat-2023",
        "payload": {"title": "Corbin Carroll 2023 rookie season game-used bat"},
        "days_ago": 0.01,
        "likes": 18,
        "comments": 4,
    },
    {
        "id": "seed-feed-002",
        "kind": "mover",
        "actor": None,
        "subject_type": "player",
        "subject_id": "victor-wembanyama",
        "payload": {"player": "victor-wembanyama", "pct": 7.2},
        "days_ago": 0.03,
        "likes": 142,
        "comments": 22,
    },
    {
        "id": "seed-feed-003",
        "kind": "auction",
        "actor": None,
        "subject_type": "player",
        "subject_id": "patrick-mahomes",
        "payload": {
            "player": "patrick-mahomes",
            "auctionHouse": "Goldin",
            "price": "$1.07M",
            "delta": 24.1,
        },
        "days_ago": 0.08,
        "likes": 384,
        "comments": 68,
    },
    {
        "id": "seed-feed-004",
        "kind": "sold",
        "actor": "maya",
        "subject_type": "item",
        "subject_id": "maya-ohtani-bat",
        "payload": {"title": "Ohtani walk-off signed bat", "soldPrice": 11800},
        "days_ago": 0.16,
        "likes": 64,
        "comments": 12,
    },
    {
        "id": "seed-feed-006",
        "kind": "comp",
        "actor": None,
        "subject_type": None,
        "subject_id": None,
        "payload": {"detail": "Carroll · Edwards · Witt Jr.", "count": 3},
        "days_ago": 0.45,
        "likes": 18,
        "comments": 0,
    },
    {
        "id": "seed-feed-007",
        "kind": "listed",
        "actor": "kevin",
        "subject_type": "item",
        "subject_id": "edwards-jersey",
        "payload": {"title": "Anthony Edwards signed rookie jersey", "asking": 4600},
        "days_ago": 1.2,
        "likes": 31,
        "comments": 7,
    },
    {
        "id": "seed-feed-008",
        "kind": "added",
        "actor": "camille",
        "subject_type": "item",
        "subject_id": "camille-carroll-jersey",
        "payload": {"title": "Corbin Carroll photo-matched home jersey"},
        "days_ago": 2.5,
        "likes": 44,
        "comments": 9,
    },
]


ITEM_COMMENTS = [
    ("carroll-bat-2023", "maya", "Incredible pickup — that Sept 12 game was his best stretch.", 1.5),
    ("carroll-bat-2023", "theo", "Did you photo-match the pine tar pattern?", 1.2),
    ("carroll-bat-2023", "camille", "MLB hologram checks out. Nice comp spread on this one.", 0.9),
    ("carroll-bat-2023", "rcho", "Grail bat for any D-backs collector.", 0.5),
    ("ohtani-ball", "maya", "Still can't believe this comp range — market is wild.", 3.0),
    ("ohtani-ball", "kevin", "Holding for now but open to strong offers.", 2.0),
    ("edwards-jersey", "rcho", "Fanatics LOA is solid on these rookie signings.", 0.8),
    ("maya-ohtani-bat", "kevin", "Congrats on the sale — great timing.", 0.3),
    ("wemby-jersey", "camille", "MeiGray match report is flawless on this one.", 5.0),
    ("rcho-mahomes-jersey", "theo", "Showcase piece for sure. What's your cost basis?", 4.0),
]


EVENT_COMMENTS = [
    ("seed-feed-002", "kevin", "Wemby index still feels undervalued vs comps.", 0.2),
    ("seed-feed-002", "maya", "Bought my first Wemby jersey right before this run.", 0.15),
    ("seed-feed-003", "rcho", "Mahomes market never sleeps.", 0.1),
]


PRIVATE_DEMO_ITEM_IDS = {"camille-lebron-jersey"}

# Titles from pytest/manual smoke runs that should not appear in the dev feed.
SYNTHETIC_ITEM_TITLE_PREFIXES = (
    "smoke test",
    "test game-used",
    "test carroll bat",
)


def is_synthetic_user(user):
    """True for pytest fixtures and manual smoke accounts (not @stitched.demo collectors)."""
    email = (user.email or "").lower()
    handle = (user.handle or "").lower()
    if email.endswith(DEMO_EMAIL_SUFFIX):
        return False
    if email.endswith("@stitched.test"):
        return True
    if email.startswith("smoke") and ("@test.com" in email or "@stitched.test" in email):
        return True
    if handle.startswith("smoke"):
        return True
    if user.first_name == "Smoke" and (user.last_name or "").startswith("Test"):
        return True
    if user.first_name == "Test" and user.last_name == "Collector":
        return True
    return False


def is_synthetic_item(item):
    title = (item.title or "").lower().strip()
    return any(title.startswith(prefix) for prefix in SYNTHETIC_ITEM_TITLE_PREFIXES)


def _delete_users_related(user_ids):
    if not user_ids:
        return
    Notification.query.filter(Notification.user_id.in_(user_ids)).delete(synchronize_session=False)
    Comment.query.filter(Comment.user_id.in_(user_ids)).delete(synchronize_session=False)
    Like.query.filter(Like.user_id.in_(user_ids)).delete(synchronize_session=False)
    ActivityEvent.query.filter(ActivityEvent.actor_user_id.in_(user_ids)).delete(synchronize_session=False)
    Follow.query.filter(Follow.follower_user_id.in_(user_ids)).delete(synchronize_session=False)
    db.session.query(SavedSearch).filter(SavedSearch.user_id.in_(user_ids)).delete(synchronize_session=False)
    WatchlistEntry.query.filter(WatchlistEntry.user_id.in_(user_ids)).delete(synchronize_session=False)
    Item.query.filter(Item.user_id.in_(user_ids)).delete(synchronize_session=False)


def _delete_item_engagement(item_id):
    Comment.query.filter_by(target_type="item", target_id=item_id).delete(synchronize_session=False)
    Like.query.filter_by(target_type="item", target_id=item_id).delete(synchronize_session=False)
    ActivityEvent.query.filter(
        ActivityEvent.subject_type == "item",
        ActivityEvent.subject_id == item_id,
    ).delete(synchronize_session=False)


def purge_milestone_events():
    """Remove portfolio-value milestone feed posts and related engagement."""
    milestone_events = ActivityEvent.query.filter_by(kind="milestone").all()
    if not milestone_events:
        return 0

    event_ids = [e.id for e in milestone_events]
    Comment.query.filter(
        Comment.target_type == "event",
        Comment.target_id.in_(event_ids),
    ).delete(synchronize_session=False)
    Like.query.filter(
        Like.target_type == "event",
        Like.target_id.in_(event_ids),
    ).delete(synchronize_session=False)
    Notification.query.filter(Notification.kind.like("%milestone%")).delete(synchronize_session=False)

    for event in milestone_events:
        db.session.delete(event)

    db.session.commit()
    return len(event_ids)


def purge_synthetic_users():
    """Remove pytest/smoke accounts and placeholder items from the dev database."""
    synthetic_users = [u for u in User.query.all() if is_synthetic_user(u)]
    user_ids = [u.id for u in synthetic_users]
    removed_items = 0

    if user_ids:
        _delete_users_related(user_ids)
        for user in synthetic_users:
            db.session.delete(user)

    for item in list(Item.query.all()):
        if not is_synthetic_item(item):
            continue
        _delete_item_engagement(item.id)
        db.session.delete(item)
        removed_items += 1

    if synthetic_users or removed_items:
        db.session.commit()
    return len(synthetic_users)


def repair_demo_catalog():
    """Ensure demo collectors' pieces are discoverable in feed and search."""
    demo_users = User.query.filter(User.email.like(f"%{DEMO_EMAIL_SUFFIX}")).all()
    if not demo_users:
        return 0

    user_ids = [user.id for user in demo_users]
    updated = 0
    for item in Item.query.filter(Item.user_id.in_(user_ids)).all():
        if item.id in PRIVATE_DEMO_ITEM_IDS:
            continue
        changed = False
        if item.visibility != "public":
            item.visibility = "public"
            changed = True
        if not item.share_to_feed:
            item.share_to_feed = True
            changed = True
        if changed:
            updated += 1

    if updated:
        db.session.commit()
    return updated


def seed_demo_platform():
    """Seed demo users and all social/collection data. Skips if already present."""
    purge_synthetic_users()
    purge_milestone_events()
    if User.query.filter(User.email.like(f"%{DEMO_EMAIL_SUFFIX}")).first():
        repair_demo_catalog()
        return False

    users_by_handle = _seed_users()
    items_by_id = _seed_items(users_by_handle)
    events_by_id = _seed_feed_events(users_by_handle)
    _seed_follows(users_by_handle)
    _seed_watchlist(users_by_handle)
    _seed_saved_searches(users_by_handle)
    _seed_comments(users_by_handle, items_by_id, events_by_id)
    _seed_likes(users_by_handle, items_by_id, events_by_id)
    _sync_engagement_counts(items_by_id, events_by_id)
    _seed_notifications(users_by_handle, events_by_id)
    db.session.commit()
    return True


def clear_demo_data():
    """Remove all demo users and their related rows."""
    demo_users = User.query.filter(User.email.like(f"%{DEMO_EMAIL_SUFFIX}")).all()
    if not demo_users:
        return 0
    user_ids = [u.id for u in demo_users]
    _delete_users_related(user_ids)

    # System feed events and cross-user engagement on demo content
    ActivityEvent.query.filter(ActivityEvent.id.like("seed-feed-%")).delete(synchronize_session=False)
    Comment.query.filter(Comment.target_id.like("seed-feed-%")).delete(synchronize_session=False)
    Like.query.filter(Like.target_id.like("seed-feed-%")).delete(synchronize_session=False)
    Like.query.filter(Like.target_id.in_([i["id"] for i in DEMO_ITEMS])).delete(synchronize_session=False)
    Comment.query.filter(Comment.target_id.in_([i["id"] for i in DEMO_ITEMS])).delete(synchronize_session=False)

    for user in demo_users:
        db.session.delete(user)

    db.session.commit()
    return len(user_ids)


def _seed_users():
    password_hash = generate_password_hash(DEMO_PASSWORD, method="pbkdf2:sha256")
    users_by_handle = {}
    for spec in DEMO_USERS:
        user = User(
            id=spec["id"],
            email=spec["email"],
            password_hash=password_hash,
            first_name=spec["first_name"],
            last_name=spec["last_name"],
            handle=spec["handle"],
            bio=spec["bio"],
            email_confirmed=True,
            user_type="collector",
        )
        db.session.add(user)
        users_by_handle[spec["handle"]] = user
    db.session.flush()
    return users_by_handle


def _seed_items(users_by_handle):
    now = datetime.utcnow()
    items_by_id = {}
    for spec in DEMO_ITEMS:
        owner = users_by_handle[spec["owner"]]
        created_at = now - timedelta(days=spec.get("daysAgo", 14))
        asking_cents = round(spec["asking"] * 100) if spec.get("asking") else None
        acquired_cents = round(spec["acquired"] * 100) if spec.get("acquired") else None

        item = Item(
            id=spec["id"],
            user_id=owner.id,
            title=spec["title"],
            sport=spec["sport"],
            league=spec.get("league") or spec["sport"],
            player_id=spec["player"],
            team=spec["team"],
            item_type=spec["type"],
            season=spec.get("season"),
            game_date=spec.get("gameDate"),
            usage_type=spec.get("usage"),
            authentication_source=spec.get("auth"),
            certification_number=spec.get("cert"),
            acquisition_price_cents=acquired_cents,
            acquisition_date=spec.get("acquiredDate"),
            acquisition_source=spec.get("source"),
            notes=spec.get("notes") or "",
            visibility=spec.get("visibility", "public"),
            for_sale=bool(spec.get("forSale")),
            asking_price_cents=asking_cents,
            tint=spec.get("tint", "#5C3820"),
            glyph=spec.get("glyph", "S"),
            tags_json=json.dumps(spec.get("tags") or []),
            badges_json=json.dumps(spec.get("badges") or []),
            images_json="[]",
            created_at=created_at,
            updated_at=created_at,
        )
        if spec.get("sold"):
            item.sold_at = created_at + timedelta(days=3)
            item.sold_price_cents = round((spec.get("soldPrice") or 0) * 100)
            item.for_sale = False

        revalue_item(item)
        db.session.add(item)
        items_by_id[item.id] = item
    db.session.flush()
    return items_by_id


def _seed_feed_events(users_by_handle):
    now = datetime.utcnow()
    events_by_id = {}
    for spec in FEED_EVENTS:
        actor_id = users_by_handle[spec["actor"]].id if spec.get("actor") else None
        created_at = now - timedelta(days=spec.get("days_ago", 1))
        event = ActivityEvent(
            id=spec["id"],
            kind=spec["kind"],
            actor_user_id=actor_id,
            subject_type=spec.get("subject_type"),
            subject_id=spec.get("subject_id"),
            payload_json=json.dumps(spec.get("payload") or {}),
            like_count=spec.get("likes", 0),
            comment_count=spec.get("comments", 0),
            created_at=created_at,
        )
        db.session.add(event)
        events_by_id[event.id] = event
    db.session.flush()
    return events_by_id


def _seed_follows(users_by_handle):
    kevin = users_by_handle["kevin"]
    edges = [
        (kevin, "user", users_by_handle["maya"].id),
        (kevin, "user", users_by_handle["theo"].id),
        (kevin, "user", users_by_handle["rcho"].id),
        (kevin, "user", users_by_handle["camille"].id),
        (kevin, "player", "corbin-carroll"),
        (kevin, "player", "shohei-ohtani"),
        (kevin, "player", "victor-wembanyama"),
        (users_by_handle["maya"], "user", kevin.id),
        (users_by_handle["maya"], "user", users_by_handle["theo"].id),
        (users_by_handle["maya"], "player", "shohei-ohtani"),
        (users_by_handle["maya"], "player", "aaron-judge"),
        (users_by_handle["rcho"], "user", kevin.id),
        (users_by_handle["rcho"], "player", "patrick-mahomes"),
        (users_by_handle["theo"], "user", kevin.id),
        (users_by_handle["theo"], "user", users_by_handle["maya"].id),
        (users_by_handle["theo"], "player", "anthony-edwards"),
        (users_by_handle["camille"], "user", kevin.id),
        (users_by_handle["camille"], "player", "corbin-carroll"),
        (users_by_handle["camille"], "player", "connor-mcdavid"),
    ]
    for follower, target_type, target_id in edges:
        db.session.add(Follow(
            follower_user_id=follower.id,
            target_type=target_type,
            target_id=target_id,
        ))


def _seed_watchlist(users_by_handle):
    kevin = users_by_handle["kevin"]
    entries = [
        (kevin, "player", "corbin-carroll", "Carroll index alerts"),
        (kevin, "player", "shohei-ohtani", "Ohtani comps"),
        (kevin, "player", "victor-wembanyama", "Wemby movers"),
        (users_by_handle["maya"], "player", "aaron-judge", "Judge bats"),
    ]
    for user, target_type, target_id, label in entries:
        db.session.add(WatchlistEntry(
            user_id=user.id,
            target_type=target_type,
            target_id=target_id,
            label=label,
            alert_pct=5.0,
            alert_freq="daily",
        ))


def _seed_saved_searches(users_by_handle):
    kevin = users_by_handle["kevin"]
    db.session.add(SavedSearch(
        user_id=kevin.id,
        name="Rookie game-used bats",
        query="rookie bat game-used",
        filters_json=json.dumps({"sport": "MLB"}),
    ))
    db.session.add(SavedSearch(
        user_id=kevin.id,
        name="Photo-matched jerseys",
        query="photo match jersey",
        filters_json=json.dumps({"sport": "NBA"}),
    ))


def _seed_comments(users_by_handle, items_by_id, events_by_id):
    now = datetime.utcnow()
    for item_id, handle, body, days_ago in ITEM_COMMENTS:
        user = users_by_handle[handle]
        db.session.add(Comment(
            user_id=user.id,
            target_type="item",
            target_id=item_id,
            body=body,
            created_at=now - timedelta(days=days_ago),
        ))
        item = items_by_id.get(item_id)
        if item:
            item.comment_count = (item.comment_count or 0) + 1

    for event_id, handle, body, days_ago in EVENT_COMMENTS:
        user = users_by_handle[handle]
        db.session.add(Comment(
            user_id=user.id,
            target_type="event",
            target_id=event_id,
            body=body,
            created_at=now - timedelta(days=days_ago),
        ))
        event = events_by_id.get(event_id)
        if event:
            event.comment_count = (event.comment_count or 0) + 1


def _sync_engagement_counts(items_by_id, events_by_id):
    for item in items_by_id.values():
        item.like_count = Like.query.filter_by(target_type="item", target_id=item.id).count()
        item.comment_count = Comment.query.filter_by(target_type="item", target_id=item.id).count()
    for event in events_by_id.values():
        event.like_count = Like.query.filter_by(target_type="event", target_id=event.id).count()
        event.comment_count = Comment.query.filter_by(target_type="event", target_id=event.id).count()


def _seed_likes(users_by_handle, items_by_id, events_by_id):
    like_plan = [
        ("kevin", "item", "maya-judge-bat"),
        ("kevin", "item", "rcho-mahomes-jersey"),
        ("maya", "item", "carroll-bat-2023"),
        ("maya", "item", "wemby-jersey"),
        ("theo", "item", "carroll-bat-2023"),
        ("theo", "item", "ohtani-ball"),
        ("camille", "item", "carroll-bat-2023"),
        ("rcho", "item", "mahomes-cleats"),
        ("kevin", "event", "seed-feed-002"),
        ("maya", "event", "seed-feed-003"),
        ("camille", "event", "seed-feed-008"),
    ]
    for handle, target_type, target_id in like_plan:
        db.session.add(Like(
            user_id=users_by_handle[handle].id,
            target_type=target_type,
            target_id=target_id,
        ))


def _seed_notifications(users_by_handle, events_by_id):
    kevin = users_by_handle["kevin"]
    now = datetime.utcnow()
    notes = [
        ("follow.added", "Maya Okafor added a new item", "Corbin Carroll photo-matched jersey hit her collection.", 0.5, False),
        ("follow.sold", "Maya Okafor sold an item", "Ohtani walk-off signed bat closed at $11,800.", 0.4, False),
        ("follow.listed", "Someone you follow listed an item", "Anthony Edwards signed rookie jersey — asking $4,600.", 1.0, True),
        ("index.mover", "Wembanyama index up 7.2%", "A player on your watchlist moved this week.", 0.3, True),
        ("comp.new", "3 new comps for players you follow", "Carroll · Edwards · Witt Jr.", 0.45, True),
    ]
    for kind, title, body, days_ago, read in notes:
        db.session.add(Notification(
            user_id=kevin.id,
            kind=kind,
            title=title,
            body=body,
            read_at=now - timedelta(days=days_ago - 0.1) if read else None,
            created_at=now - timedelta(days=days_ago),
            payload_json=json.dumps({"eventId": "seed-feed-002"}),
        ))
