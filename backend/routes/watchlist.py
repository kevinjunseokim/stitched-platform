from flask import Blueprint, g, jsonify, request

from services.watchlist_service import WatchlistService
from utils.auth import jwt_required


watchlist_bp = Blueprint("watchlist", __name__)


@watchlist_bp.route("/watchlist", methods=["GET"])
@jwt_required
def list_watchlist():
    result, error, status = WatchlistService.list_entries(g.current_user.id)
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@watchlist_bp.route("/watchlist", methods=["POST"])
@jwt_required
def create_watchlist_entry():
    result, error, status = WatchlistService.create_entry(
        g.current_user.id,
        request.get_json() or {},
    )
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@watchlist_bp.route("/watchlist/<int:entry_id>", methods=["PATCH"])
@jwt_required
def update_watchlist_entry(entry_id):
    result, error, status = WatchlistService.update_entry(
        g.current_user.id,
        entry_id,
        request.get_json() or {},
    )
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@watchlist_bp.route("/watchlist/<int:entry_id>", methods=["DELETE"])
@jwt_required
def delete_watchlist_entry(entry_id):
    result, error, status = WatchlistService.delete_entry(g.current_user.id, entry_id)
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@watchlist_bp.route("/saved-searches", methods=["GET"])
@jwt_required
def list_saved_searches():
    result, error, status = WatchlistService.list_saved_searches(g.current_user.id)
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@watchlist_bp.route("/saved-searches", methods=["POST"])
@jwt_required
def create_saved_search():
    result, error, status = WatchlistService.create_saved_search(
        g.current_user.id,
        request.get_json() or {},
    )
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@watchlist_bp.route("/saved-searches/<int:saved_id>", methods=["DELETE"])
@jwt_required
def delete_saved_search(saved_id):
    result, error, status = WatchlistService.delete_saved_search(g.current_user.id, saved_id)
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status
