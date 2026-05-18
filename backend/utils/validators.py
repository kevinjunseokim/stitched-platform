import re

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
HANDLE_PATTERN = re.compile(r"^[a-z0-9][a-z0-9_]{2,29}$")
MIN_PASSWORD_LENGTH = 8


def validate_email(email):
    normalized = (email or "").strip().lower()
    if not normalized:
        return None, "Email is required"
    if not EMAIL_PATTERN.match(normalized):
        return None, "A valid email is required"
    return normalized, None


def validate_password(password):
    value = password or ""
    if not value:
        return None, "Password is required"
    if len(value) < MIN_PASSWORD_LENGTH:
        return None, f"Password must be at least {MIN_PASSWORD_LENGTH} characters"
    return value, None


def parse_display_name(display_name, first_name="", last_name=""):
    first = (first_name or "").strip()
    last = (last_name or "").strip()
    display = (display_name or "").strip()

    if display and not first and not last:
        parts = display.split()
        first = parts[0]
        last = " ".join(parts[1:]) or "Collector"

    if not first:
        return None, None, "Display name is required"

    if not last:
        last = "Collector"

    return first, last, None


def slugify_handle(value):
    handle = re.sub(r"[^a-z0-9]+", "", (value or "").lower())
    return handle[:30] or "collector"


def validate_handle(handle):
    normalized = (handle or "").strip().lower()
    if not normalized:
        return None, "Handle is required"
    if not HANDLE_PATTERN.match(normalized):
        return None, "Handle must be 3-30 characters and use only letters, numbers, or underscores"
    return normalized, None
