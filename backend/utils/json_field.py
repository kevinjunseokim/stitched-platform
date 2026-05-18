import json


def parse_payload(value, fallback=None):
    fallback = {} if fallback is None else fallback
    try:
        parsed = json.loads(value or "{}")
    except json.JSONDecodeError:
        return fallback
    return parsed if isinstance(parsed, dict) else fallback
