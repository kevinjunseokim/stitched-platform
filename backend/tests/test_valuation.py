"""Direct unit tests for `services.valuation_service`."""
import pytest

from initialization.database import db
from models import Comp, Item, Player, User
from services.valuation_service import (
    HIGH_CONFIDENCE,
    LOW_CONFIDENCE,
    MEDIUM_CONFIDENCE,
    compute_estimate,
    revalue_item,
)

TEST_PLAYER_ID = "novel-player"


@pytest.fixture(autouse=True)
def _cleanup_test_comps(app):
    yield
    with app.app_context():
        Comp.query.filter_by(player_id=TEST_PLAYER_ID).delete()
        Player.query.filter_by(id=TEST_PLAYER_ID).delete()
        db.session.commit()


@pytest.fixture
def user(app):
    with app.app_context():
        u = User(
            email="valuation@test.io",
            password_hash="x",
            first_name="Val",
            last_name="Uation",
            handle="valuser",
            email_confirmed=True,
        )
        db.session.add(u)
        db.session.commit()
        yield u


def _seed_player(app, index=1500.0):
    with app.app_context():
        if not Player.query.get(TEST_PLAYER_ID):
            db.session.add(Player(
                id=TEST_PLAYER_ID,
                name="Novel Player",
                team="Test Club",
                sport="MLB",
                initials="NP",
                color="#000000",
                current_index=index,
            ))
            db.session.commit()


def _make_item(app, user, **overrides):
    payload = {
        "title": "Test item",
        "sport": "MLB",
        "player_id": TEST_PLAYER_ID,
        "item_type": "Bat",
        "acquisition_price_cents": 100_00,
    }
    payload.update(overrides)
    with app.app_context():
        item = Item(user_id=user.id, **payload)
        db.session.add(item)
        db.session.commit()
        return Item.query.get(item.id)


def _add_comp(app, **overrides):
    defaults = {
        "id": overrides.get("id", f"vc-{db.session.query(Comp).count() + 1}"),
        "player_id": TEST_PLAYER_ID,
        "title": "Synthetic comp",
        "source": "Test",
        "sale_date": "2025-01-01",
        "price_cents": 1000_00,
        "buyers_premium": 0.20,
        "item_type": "Bat",
        "auth": "Test/DNA",
        "confidence": 90,
        "used_in_valuation": True,
    }
    defaults.update(overrides)
    with app.app_context():
        comp = Comp(**defaults)
        db.session.add(comp)
        db.session.commit()
        return comp


class TestIndexValuation:
    def test_anchor_uses_player_index_and_type(self, app, user):
        _seed_player(app, index=2000.0)
        item = _make_item(app, user, item_type="Bat", usage_type="Issued")
        with app.app_context():
            result = compute_estimate(item)
        # Bat base $2000 at index 1000 -> $4000 at index 2000, issued 0.92x
        assert result["indexMidCents"] == int(200_000 * 2.0 * 0.92)

    def test_postseason_and_photo_match_stack(self, app, user):
        _seed_player(app, index=1000.0)
        base_item = _make_item(
            app,
            user,
            postseason=False,
            usage_type="Game-used",
            authentication_source="MLB Authentication",
        )
        premium_item = _make_item(
            app,
            user,
            postseason=True,
            usage_type="Photo-matched",
            authentication_source="MeiGray",
        )
        with app.app_context():
            base = compute_estimate(base_item)
            premium = compute_estimate(premium_item)
        assert premium["indexMidCents"] > base["indexMidCents"]

    def test_no_player_falls_back_to_acquisition_multiple(self, app, user):
        item = _make_item(app, user, player_id="missing-player", acquisition_price_cents=1000_00)
        with app.app_context():
            result = revalue_item(item)
        assert result["confidence"] == LOW_CONFIDENCE
        assert result["mid"] == 1180
        assert result["low"] < result["mid"] < result["high"]

    def test_no_anchor_and_no_acquisition_returns_none(self, app, user):
        item = _make_item(app, user, player_id="missing-player", acquisition_price_cents=None)
        with app.app_context():
            result = compute_estimate(item)
        assert result["midCents"] is None
        assert result["confidence"] == LOW_CONFIDENCE


class TestCompBlending:
    def test_ignores_outlier_comps_not_used_in_valuation(self, app, user):
        _seed_player(app)
        _add_comp(app, id="vu-1", price_cents=500_00, used_in_valuation=True)
        _add_comp(app, id="vu-2", price_cents=1500_00, used_in_valuation=True)
        _add_comp(app, id="vu-3", price_cents=1000_00, used_in_valuation=True)
        _add_comp(app, id="vu-4", price_cents=99_99_99_00, used_in_valuation=False)

        item = _make_item(app, user, item_type="Bat")
        with app.app_context():
            result = compute_estimate(item)
        assert result["compMidCents"] == 1000_00
        assert result["midCents"] is not None
        assert result["highCents"] < 100_000_00

    def test_type_specific_comps_take_priority(self, app, user):
        _seed_player(app)
        _add_comp(app, id="ty-1", price_cents=300_00, item_type="Bat", used_in_valuation=True)
        _add_comp(app, id="ty-2", price_cents=500_00, item_type="Bat", used_in_valuation=True)
        _add_comp(app, id="ty-3", price_cents=99_999_00, item_type="Jersey", used_in_valuation=True)

        item = _make_item(app, user, item_type="Bat")
        with app.app_context():
            result = compute_estimate(item)
        assert result["compMidCents"] == 400_00

    def test_high_confidence_requires_strong_comps_and_player(self, app, user):
        _seed_player(app)
        for i in range(3):
            _add_comp(app, id=f"hc-{i}", price_cents=1000_00, confidence=95, used_in_valuation=True)
        item = _make_item(app, user, item_type="Bat")
        with app.app_context():
            result = compute_estimate(item)
        assert result["confidence"] == HIGH_CONFIDENCE

    def test_medium_confidence_with_comps_only(self, app, user):
        orphan = "orphan-player"
        _add_comp(app, id="mc-1", player_id=orphan, price_cents=1000_00, confidence=85, used_in_valuation=True)
        _add_comp(app, id="mc-2", player_id=orphan, price_cents=1000_00, confidence=80, used_in_valuation=True)
        item = _make_item(app, user, player_id=orphan, item_type="Bat", acquisition_price_cents=None)
        with app.app_context():
            result = compute_estimate(item)
        assert result["confidence"] == MEDIUM_CONFIDENCE

    def test_revalue_persists_estimate_columns(self, app, user):
        _seed_player(app)
        item = _make_item(app, user, rookie=True, usage_type="Game-used")
        with app.app_context():
            row = Item.query.get(item.id)
            payload = revalue_item(row)
            db.session.commit()
            refreshed = Item.query.get(item.id)
        assert round(refreshed.estimate_mid_cents / 100) == payload["mid"]
        assert payload["factors"]
