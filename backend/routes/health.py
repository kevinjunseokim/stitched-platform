from flask import Blueprint

health_bp = Blueprint("health", __name__)


@health_bp.route("/health")
def health_check():
    return {"status": "healthy", "service": "backend"}, 200


@health_bp.route("/api/health")
def api_health_check():
    return {"status": "healthy", "service": "backend", "api": "v1"}, 200
