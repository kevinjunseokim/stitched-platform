from flask import Blueprint, g, jsonify, request

from services.follow_service import FollowService
from utils.auth import jwt_required
from utils.payload import str_field


follows_bp = Blueprint("follows", __name__)


@follows_bp.route("/follows", methods=["POST"])
@jwt_required
def create_follow():
    data = request.get_json() or {}
    result, error, status = FollowService.create_follow(
        g.current_user,
        str_field(data, "targetType", lower=True),
        str_field(data, "targetId"),
    )
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@follows_bp.route("/follows/<target_type>/<target_id>", methods=["DELETE"])
@jwt_required
def delete_follow(target_type, target_id):
    result, error, status = FollowService.delete_follow(
        g.current_user.id,
        target_type,
        target_id,
    )
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@follows_bp.route("/me/follows", methods=["GET"])
@jwt_required
def my_follows():
    result, error, status = FollowService.list_my_follows(
        g.current_user.id,
        request.args.get("type"),
    )
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@follows_bp.route("/users/<handle>/followers", methods=["GET"])
def user_followers(handle):
    result, error, status = FollowService.list_user_followers(handle)
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@follows_bp.route("/users/<handle>/following", methods=["GET"])
def user_following(handle):
    result, error, status = FollowService.list_user_following(handle)
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status
