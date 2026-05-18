import os
import uuid
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

from utils.auth import jwt_required


uploads_bp = Blueprint("uploads", __name__)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}
MAX_BYTES = 10 * 1024 * 1024


def upload_directory():
    path = Path(current_app.root_path) / "data" / "uploads"
    path.mkdir(parents=True, exist_ok=True)
    return path


def allowed_file(filename):
    if "." not in filename:
        return False
    return filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@uploads_bp.route("/uploads", methods=["POST"])
@jwt_required
def upload_files():
    files = request.files.getlist("files")
    if not files:
        return jsonify({"error": "No files provided"}), 400

    urls = []
    errors = []
    for uploaded in files:
        if not uploaded or not uploaded.filename:
            continue

        filename = uploaded.filename
        if not allowed_file(filename):
            errors.append(f"{filename}: unsupported file type")
            continue

        uploaded.seek(0, os.SEEK_END)
        size = uploaded.tell()
        uploaded.seek(0)
        if size > MAX_BYTES:
            errors.append(f"{filename}: file exceeds 10MB limit")
            continue

        extension = filename.rsplit(".", 1)[1].lower()
        stored_name = f"{uuid.uuid4().hex}.{extension}"
        uploaded.save(upload_directory() / stored_name)
        urls.append(f"/api/uploads/{stored_name}")

    if not urls:
        message = errors[0] if len(errors) == 1 else "No valid images uploaded"
        if len(errors) > 1:
            message = "; ".join(errors)
        return jsonify({"error": message, "errors": errors}), 400

    return jsonify({"urls": urls, "errors": errors}), 201


@uploads_bp.route("/uploads/<filename>", methods=["GET"])
def serve_upload(filename):
    safe_name = secure_filename(filename)
    if not safe_name or safe_name != filename:
        return jsonify({"error": "Invalid filename"}), 400

    directory = upload_directory()
    if not (directory / safe_name).is_file():
        return jsonify({"error": "File not found"}), 404

    return send_from_directory(directory, safe_name)
