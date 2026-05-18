from functools import wraps

from flask import g, jsonify, request

from utils.jwt_utils import get_user_from_token


def _bearer_token():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header:
        return None, "Authorization header missing"
    if not auth_header.startswith("Bearer "):
        return None, "Invalid authorization header format"
    return auth_header.split(" ", 1)[1], None


def jwt_required(route_handler):
    @wraps(route_handler)
    def decorated_function(*args, **kwargs):
        token, error = _bearer_token()
        if error:
            return jsonify({"error": error}), 401

        user = get_user_from_token(token, token_type="access")
        if not user:
            return jsonify({"error": "Invalid or expired token"}), 401

        g.current_user = user
        return route_handler(*args, **kwargs)

    return decorated_function


def optional_jwt(route_handler):
    @wraps(route_handler)
    def decorated_function(*args, **kwargs):
        g.current_user = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            g.current_user = get_user_from_token(token, token_type="access")
        return route_handler(*args, **kwargs)

    return decorated_function
