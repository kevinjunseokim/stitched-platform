from datetime import datetime, timedelta, timezone
import os

import jwt
from flask import current_app

from models import User


def get_secret_key():
    try:
        return current_app.config.get("SECRET_KEY") or os.getenv("SECRET_KEY", "stitched-dev-secret")
    except RuntimeError:
        return os.getenv("SECRET_KEY", "stitched-dev-secret")


def generate_access_token(user_id):
    return _generate_token(user_id, "access", timedelta(minutes=15))


def generate_refresh_token(user_id):
    return _generate_token(user_id, "refresh", timedelta(days=7))


def verify_token(token, token_type="access"):
    try:
        payload = jwt.decode(token, get_secret_key(), algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

    if payload.get("type") != token_type:
        return None
    return payload


def get_user_from_token(token, token_type="access"):
    payload = verify_token(token, token_type)
    if not payload:
        return None

    user_id = payload.get("user_id")
    if not user_id:
        return None

    return User.query.get(user_id)


def _generate_token(user_id, token_type, expires_in):
    now = datetime.now(timezone.utc)
    payload = {
        "user_id": user_id,
        "type": token_type,
        "exp": now + expires_in,
        "iat": now,
    }
    return jwt.encode(payload, get_secret_key(), algorithm="HS256")
