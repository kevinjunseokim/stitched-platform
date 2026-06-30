from flask import Blueprint, g, jsonify, request

from services.item_service import ItemService
from utils.auth import jwt_required


items_bp = Blueprint("items", __name__)


@items_bp.route("/items/estimate", methods=["POST"])
@jwt_required
def estimate_item():
    result, error, status = ItemService.estimate(g.current_user.id, request.get_json())
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@items_bp.route("/items", methods=["GET"])
@jwt_required
def list_items():
    result, error, status = ItemService.list_for_user(g.current_user.id)
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@items_bp.route("/items", methods=["POST"])
@jwt_required
def create_item():
    result, error, status = ItemService.create(g.current_user.id, request.get_json())
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@items_bp.route("/items/<item_id>", methods=["GET"])
@jwt_required
def get_item(item_id):
    result, error, status = ItemService.get(item_id, g.current_user.id)
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@items_bp.route("/items/<item_id>", methods=["PATCH"])
@jwt_required
def update_item(item_id):
    result, error, status = ItemService.update(
        g.current_user.id,
        item_id,
        request.get_json(),
    )
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@items_bp.route("/items/<item_id>", methods=["DELETE"])
@jwt_required
def delete_item(item_id):
    result, error, status = ItemService.delete(g.current_user.id, item_id)
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@items_bp.route("/items/<item_id>/revalue", methods=["POST"])
@jwt_required
def revalue(item_id):
    result, error, status = ItemService.revalue(g.current_user.id, item_id)
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@items_bp.route("/items/<item_id>/list", methods=["POST"])
@jwt_required
def list_for_sale(item_id):
    result, error, status = ItemService.list_for_sale(
        g.current_user.id,
        item_id,
        request.get_json() or {},
    )
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@items_bp.route("/items/<item_id>/unlist", methods=["POST"])
@jwt_required
def unlist(item_id):
    result, error, status = ItemService.unlist(g.current_user.id, item_id)
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status


@items_bp.route("/items/<item_id>/sell", methods=["POST"])
@jwt_required
def mark_sold(item_id):
    result, error, status = ItemService.mark_sold(
        g.current_user.id,
        item_id,
        request.get_json() or {},
    )
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status
