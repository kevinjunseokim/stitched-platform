"""Shared pytest fixtures for the Stitched backend.

Strategy:
- Build a single Flask app per test session against an isolated temp SQLite
  file. The catalog (players/comps/notable_sales/market_ticker/index_points)
  is seeded once.
- Before every test, truncate the user-data tables so each test starts from a
  clean slate without paying for re-seeding the catalog.
- Provide factory fixtures (`register_user`, `auth_client`) that hide the
  HTTP/JWT boilerplate so individual tests stay focused on behavior.
"""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

import pytest

# Test environment must be in place before `backend.app` is imported so that
# `create_app()` picks up the temp database URL and predictable secret.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

_tempdir = tempfile.TemporaryDirectory()
_db_path = Path(_tempdir.name) / "stitched-test.sqlite"
os.environ.setdefault("DATABASE_URL", f"sqlite:///{_db_path}")
os.environ.setdefault("SECRET_KEY", "stitched-test-secret")
os.environ.setdefault("AUTO_CONFIRM_EMAIL", "true")
os.environ.setdefault("CORS_ORIGINS", "http://localhost")
os.environ.setdefault("ENVIRONMENT", "development")

from app import create_app  # noqa: E402  (env vars must be set first)
from initialization.database import db as _db  # noqa: E402
from models import (  # noqa: E402
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


# Tables that hold per-user state. Truncated between tests so each test gets
# a clean slate without re-seeding the read-only catalog.
USER_DATA_MODELS = (
    Notification,
    ActivityEvent,
    Comment,
    Like,
    SavedSearch,
    WatchlistEntry,
    Follow,
    Item,
    User,
)


@pytest.fixture(scope="session")
def app():
    """Session-wide Flask app bound to the isolated SQLite database."""
    flask_app = create_app("development")
    flask_app.config.update(TESTING=True)
    yield flask_app


@pytest.fixture(scope="session", autouse=True)
def _initialise_session(app):
    """Make sure the test DB is initialised and seeded once for the session."""
    yield


@pytest.fixture(autouse=True)
def _reset_user_tables(app):
    """Wipe per-test rows after every test so cases stay isolated."""
    yield
    with app.app_context():
        for model in USER_DATA_MODELS:
            _db.session.query(model).delete()
        _db.session.commit()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db(app):
    """Access SQLAlchemy session inside the app context."""
    with app.app_context():
        yield _db


_FIXTURE_DISPLAY_NAMES = (
    "Jordan Ellis",
    "Sofia Martinez",
    "Marcus Chen",
    "Elena Vasquez",
    "Derek Holloway",
    "Priya Nair",
)


def _fixture_display_name() -> str:
    idx = getattr(_fixture_display_name, "counter", 0) % len(_FIXTURE_DISPLAY_NAMES)
    _fixture_display_name.counter = idx + 1
    return _FIXTURE_DISPLAY_NAMES[idx]


def _unique_email(prefix: str = "user") -> str:
    """Email helper used by the user factory.

    Tests sometimes register multiple users; combine the prefix with the
    object id of a counter to keep things deterministic but unique per call.
    """
    _unique_email.counter = getattr(_unique_email, "counter", 0) + 1
    return f"{prefix}{_unique_email.counter}@stitched.test"


@pytest.fixture
def register_user(client):
    """Factory: register a new user and return the parsed response JSON.

    Uses ``AUTO_CONFIRM_EMAIL=true`` so the response always includes
    ``access_token`` and ``user``. Override anything in ``payload`` to
    customise individual fields (handle, displayName, etc.).
    """

    def _register(**overrides):
        payload = {
            "email": overrides.pop("email", _unique_email()),
            "password": overrides.pop("password", "supersecret"),
            "displayName": overrides.pop("displayName", _fixture_display_name()),
        }
        payload.update(overrides)
        response = client.post("/api/register", json=payload)
        assert response.status_code == 201, response.get_json()
        return response.get_json()

    return _register


class AuthClient:
    """Thin wrapper around the Flask test client that injects a bearer token."""

    def __init__(self, client, token: str, user: dict):
        self._client = client
        self.token = token
        self.user = user
        self.user_id = user["id"]
        self.handle = user.get("handle")

    def _headers(self, extra=None):
        headers = {"Authorization": f"Bearer {self.token}"}
        if extra:
            headers.update(extra)
        return headers

    def get(self, path, **kwargs):
        kwargs.setdefault("headers", {}).update(self._headers())
        return self._client.get(path, **kwargs)

    def post(self, path, json=None, **kwargs):
        kwargs.setdefault("headers", {}).update(self._headers())
        return self._client.post(path, json=json, **kwargs)

    def patch(self, path, json=None, **kwargs):
        kwargs.setdefault("headers", {}).update(self._headers())
        return self._client.patch(path, json=json, **kwargs)

    def delete(self, path, **kwargs):
        kwargs.setdefault("headers", {}).update(self._headers())
        return self._client.delete(path, **kwargs)


@pytest.fixture
def auth_client(client, register_user):
    """Factory: registers a user and returns an ``AuthClient`` for it."""

    def _factory(**overrides):
        data = register_user(**overrides)
        return AuthClient(client, data["access_token"], data["user"])

    return _factory


# A canonical "well-formed" item payload used across item/feed/social tests.
ITEM_PAYLOAD = {
    "title": "Mike Trout 2018 Game-Used Bat",
    "sport": "MLB",
    "player": "corbin-carroll",
    "team": "Arizona Diamondbacks",
    "type": "Bat",
    "season": "2023",
    "gameDate": "2023-09-14",
    "usage": "GAME-USED",
    "event": "vs LAD",
    "stats": "1-for-4, HR",
    "rookie": True,
    "postseason": False,
    "auth": "MLB Authentication",
    "cert": "MLB-CC-0428-9B",
    "provenance": "Direct from clubhouse",
    "price": 1800,
    "priceDate": "2023-10-02",
    "source": "MLB Auctions",
    "lot": "LOT-228",
    "notes": "Photo-matched.",
    "visibility": "public",
    "forSale": False,
    "share": True,
    "images": [],
}


@pytest.fixture
def item_payload():
    """Return a fresh copy of the canonical item payload."""
    return dict(ITEM_PAYLOAD)
