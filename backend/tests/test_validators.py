"""Unit tests for the validator helpers (`utils.validators`)."""
import pytest

from utils.validators import (
    parse_display_name,
    slugify_handle,
    validate_email,
    validate_handle,
    validate_password,
)


class TestValidateEmail:
    @pytest.mark.parametrize(
        "raw,expected",
        [
            ("Alice@Example.com", "alice@example.com"),
            ("  bob@test.io  ", "bob@test.io"),
        ],
    )
    def test_normalises(self, raw, expected):
        result, error = validate_email(raw)
        assert error is None
        assert result == expected

    @pytest.mark.parametrize("raw", [None, "", "no-at-sign", "spaces in@email.io", "double@@signs.io"])
    def test_rejects_invalid(self, raw):
        result, error = validate_email(raw)
        assert result is None
        assert error


class TestValidatePassword:
    def test_minimum_length(self):
        _, error = validate_password("short")
        assert "8" in error

    def test_required(self):
        _, error = validate_password("")
        assert error == "Password is required"

    def test_accepts_strong_password(self):
        value, error = validate_password("longenough")
        assert error is None
        assert value == "longenough"


class TestParseDisplayName:
    def test_splits_full_name(self):
        first, last, err = parse_display_name("Jane Doe")
        assert (first, last, err) == ("Jane", "Doe", None)

    def test_single_name_uses_collector_fallback(self):
        first, last, err = parse_display_name("Madonna")
        assert err is None
        assert first == "Madonna"
        assert last == "Collector"

    def test_explicit_first_last_wins(self):
        first, last, err = parse_display_name(None, "Alice", "Liddell")
        assert (first, last, err) == ("Alice", "Liddell", None)

    def test_empty_raises_error(self):
        first, last, err = parse_display_name(None)
        assert first is None
        assert last is None
        assert err


class TestHandleHelpers:
    def test_slugify_strips_non_alphanumeric(self):
        assert slugify_handle("Alice O'Hara!") == "aliceohara"

    def test_slugify_caps_at_30(self):
        long = "a" * 50
        assert len(slugify_handle(long)) == 30

    def test_slugify_falls_back_to_collector_for_empty(self):
        assert slugify_handle("") == "collector"

    @pytest.mark.parametrize("handle", ["ok123", "good_handle", "abc"])
    def test_validate_handle_accepts(self, handle):
        value, error = validate_handle(handle)
        assert error is None
        assert value == handle

    @pytest.mark.parametrize("handle", ["no", "with space", "TOO!loud", "x" * 31, "_leading"])
    def test_validate_handle_rejects(self, handle):
        value, error = validate_handle(handle)
        assert value is None
        assert error

    def test_validate_handle_allows_leading_digit(self):
        # The pattern is `[a-z0-9][a-z0-9_]{2,29}` so digits are allowed first.
        value, error = validate_handle("1cool")
        assert error is None
        assert value == "1cool"
