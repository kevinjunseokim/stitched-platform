from .auth import auth_bp
from .collection import collection_bp
from .comps import comps_bp
from .feed import feed_bp
from .follows import follows_bp
from .health import health_bp
from .items import items_bp
from .market import market_bp
from .notifications import notifications_bp
from .players import players_bp
from .profile import profile_bp
from .search import search_bp
from .social import social_bp
from .stats import stats_bp
from .uploads import uploads_bp
from .watchlist import watchlist_bp

__all__ = [
    "auth_bp",
    "collection_bp",
    "comps_bp",
    "feed_bp",
    "follows_bp",
    "health_bp",
    "items_bp",
    "market_bp",
    "notifications_bp",
    "players_bp",
    "profile_bp",
    "search_bp",
    "social_bp",
    "stats_bp",
    "uploads_bp",
    "watchlist_bp",
]
