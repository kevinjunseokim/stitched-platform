import logging
import os
import uuid
from pathlib import Path

from flask import Flask, g, has_request_context, jsonify, request
from flask_cors import CORS
from flask_migrate import Migrate
from werkzeug.exceptions import HTTPException

from config import config, load_environment_variables
from initialization.database import db, initialize_database
from routes import (
    auth_bp,
    collection_bp,
    comps_bp,
    feed_bp,
    follows_bp,
    health_bp,
    items_bp,
    market_bp,
    notifications_bp,
    players_bp,
    profile_bp,
    search_bp,
    social_bp,
    stats_bp,
    uploads_bp,
    watchlist_bp,
)

# Import models so SQLAlchemy can register metadata with Migrate.
from models import (  # noqa: F401
    ActivityEvent,
    Comment,
    Comp,
    Follow,
    Item,
    Like,
    MarketTickerEntry,
    NotableSale,
    Notification,
    Player,
    PlayerIndexPoint,
    SavedSearch,
    User,
    WatchlistEntry,
)

migrate = Migrate()


def _configure_logging(app):
    level = logging.WARNING if not app.debug else logging.INFO

    class RequestIdFilter(logging.Filter):
        def filter(self, record):
            record.request_id = getattr(g, "request_id", "-") if has_request_context() else "-"
            return True

    root = logging.getLogger()
    root.handlers.clear()
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s level=%(levelname)s requestId=%(request_id)s %(message)s"
        )
    )
    handler.addFilter(RequestIdFilter())
    root.addHandler(handler)
    root.setLevel(level)


def configure_cors(app):
    origins = [origin.strip() for origin in app.config["CORS_ORIGINS"] if origin.strip()]
    CORS(
        app,
        supports_credentials=False,
        origins=origins,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=86400,
    )


def register_blueprints(app):
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(items_bp, url_prefix="/api")
    app.register_blueprint(stats_bp, url_prefix="/api")
    app.register_blueprint(players_bp, url_prefix="/api")
    app.register_blueprint(comps_bp, url_prefix="/api")
    app.register_blueprint(market_bp, url_prefix="/api")
    app.register_blueprint(follows_bp, url_prefix="/api")
    app.register_blueprint(social_bp, url_prefix="/api")
    app.register_blueprint(feed_bp, url_prefix="/api")
    app.register_blueprint(watchlist_bp, url_prefix="/api")
    app.register_blueprint(search_bp, url_prefix="/api")
    app.register_blueprint(notifications_bp, url_prefix="/api")
    app.register_blueprint(profile_bp, url_prefix="/api")
    app.register_blueprint(collection_bp, url_prefix="/api")
    app.register_blueprint(uploads_bp, url_prefix="/api")


def create_app(config_name=None):
    load_environment_variables()

    app = Flask(__name__)
    if config_name is None:
        config_name = os.getenv("ENVIRONMENT", "development")

    app.config.from_object(config[config_name])
    app.config["ENVIRONMENT"] = config_name
    app.config.setdefault("MIGRATIONS_DIRECTORY", str(Path(__file__).resolve().parent / "migrations"))
    config[config_name].init_app(app)

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)
    Path(__file__).resolve().parent.joinpath("data").mkdir(parents=True, exist_ok=True)

    _configure_logging(app)

    @app.before_request
    def _assign_request_id():
        g.request_id = uuid.uuid4().hex[:12]

    @app.errorhandler(HTTPException)
    def _http_exception(exc):
        payload = {"error": exc.description or exc.name}
        rid = getattr(g, "request_id", None)
        if rid:
            payload["requestId"] = rid
        return jsonify(payload), exc.code

    @app.errorhandler(Exception)
    def _unhandled_exception(exc):
        if isinstance(exc, HTTPException):
            return _http_exception(exc)
        db.session.rollback()
        rid = getattr(g, "request_id", None)
        logging.getLogger(__name__).exception(
            "unhandled error requestId=%s path=%s",
            rid or "-",
            getattr(request, "path", "-"),
        )
        payload = {"error": "Internal server error"}
        if rid:
            payload["requestId"] = rid
        return jsonify(payload), 500

    configure_cors(app)
    db.init_app(app)
    migrate.init_app(app, db)
    register_blueprints(app)
    initialize_database(app)

    return app


if __name__ == "__main__":
    application = create_app()
    environment = os.getenv("ENVIRONMENT", "development")
    application.run(
        debug=environment == "development",
        port=int(os.getenv("PORT", "5001")),
        use_reloader=False,
    )
