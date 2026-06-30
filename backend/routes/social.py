from flask import Blueprint, g, jsonify, request

from services.social_service import SocialService
from utils.auth import jwt_required
from utils.payload import str_field


social_bp = Blueprint("social", __name__)


@social_bp.route("/likes", methods=["POST"])
@jwt_required
def create_like():
    data = request.get_json() or {}
    result, error, status = SocialService.create_like(
        g.current_user.id,
        str_field(data, "targetType", lower=True),
        str_field(data, "targetId"),
    )
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@social_bp.route("/likes/<target_type>/<target_id>", methods=["DELETE"])
@jwt_required
def delete_like(target_type, target_id):
    result, error, status = SocialService.delete_like(
        g.current_user.id,
        target_type,
        target_id,
    )
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@social_bp.route("/<target_type>/<target_id>/comments", methods=["GET"])
def list_comments(target_type, target_id):
    result, error, status = SocialService.list_comments(target_type, target_id)
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@social_bp.route("/<target_type>/<target_id>/comments", methods=["POST"])
@jwt_required
def create_comment(target_type, target_id):
    data = request.get_json() or {}
    result, error, status = SocialService.create_comment(
        g.current_user,
        target_type,
        target_id,
        data.get("body"),
    )
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status
