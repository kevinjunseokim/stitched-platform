from flask import Blueprint, g, jsonify, request

from services.auth_service import AuthService
from utils.auth import jwt_required


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    response, error, status = AuthService.register(data)
    if error:
        return jsonify({"error": error}), status
    return jsonify(response), status


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    response, error, status = AuthService.login(data)
    if error:
        return jsonify({"error": error}), status
    return jsonify(response), status


@auth_bp.route("/current-user", methods=["GET"])
@jwt_required
def get_current_user():
    return jsonify({"message": "User data retrieved", "user": g.current_user.to_dict()}), 200


@auth_bp.route("/refresh", methods=["POST"])
def refresh_token():
    from utils.jwt_utils import generate_access_token, get_user_from_token

    data = request.get_json() or {}
    refresh_token_value = data.get("refresh_token")
    if not refresh_token_value:
        return jsonify({"error": "Refresh token is required"}), 400

    user = get_user_from_token(refresh_token_value, token_type="refresh")
    if not user:
        return jsonify({"error": "Invalid or expired refresh token"}), 401

    return jsonify({"access_token": generate_access_token(user.id)}), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logged out successfully"}), 200


@auth_bp.route("/confirm-email", methods=["POST", "GET"])
def confirm_email():
    if request.method == "GET":
        token = request.args.get("token", "")
    else:
        data = request.get_json() or {}
        token = data.get("token", "")

    response, error, status = AuthService.confirm_email(token)
    if error:
        return jsonify({"error": error}), status
    return jsonify(response), status


@auth_bp.route("/resend-confirmation", methods=["POST"])
def resend_confirmation():
    data = request.get_json() or {}
    response, error, status = AuthService.resend_confirmation(data.get("email"))
    if error:
        return jsonify({"error": error}), status
    return jsonify(response), status


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    response, error, status = AuthService.forgot_password(data.get("email"))
    if error:
        return jsonify({"error": error}), status
    return jsonify(response), status


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    response, error, status = AuthService.reset_password(
        data.get("token"),
        data.get("password"),
    )
    if error:
        return jsonify({"error": error}), status
    return jsonify(response), status
