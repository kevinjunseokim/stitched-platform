import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    def load_dotenv(_path):
        return False


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "stitched-dev-secret")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False

    @staticmethod
    def init_app(app):
        pass


class DevelopmentConfig(Config):
    DEBUG = True
    AUTO_CONFIRM_EMAIL = os.getenv("AUTO_CONFIRM_EMAIL", "true").lower() == "true"
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{Path(__file__).resolve().parents[1] / 'data' / 'stitched.sqlite'}",
    )
    CORS_ORIGINS = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if o.strip()
    ]


class ProductionConfig(Config):
    DEBUG = False
    AUTO_CONFIRM_EMAIL = os.getenv("AUTO_CONFIRM_EMAIL", "false").lower() == "true"
    # Filled in init_app — required env vars are validated there.
    SQLALCHEMY_DATABASE_URI = None
    CORS_ORIGINS = []

    @staticmethod
    def init_app(app):
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise RuntimeError("DATABASE_URL must be set in production")

        secret_key = os.getenv("SECRET_KEY")
        if not secret_key:
            raise RuntimeError("SECRET_KEY must be set in production")
        if secret_key == "stitched-dev-secret":
            raise RuntimeError("SECRET_KEY must be set to a strong value in production")

        origins = [
            o.strip()
            for o in (os.getenv("CORS_ORIGINS") or "").split(",")
            if o.strip()
        ]
        if not origins:
            raise RuntimeError(
                "CORS_ORIGINS must list at least one allowed origin in production"
            )

        app.config["SQLALCHEMY_DATABASE_URI"] = database_url
        app.config["SECRET_KEY"] = secret_key
        app.config["CORS_ORIGINS"] = origins


config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}


def load_environment_variables():
    root_dir = Path(__file__).resolve().parents[2]
    load_dotenv(root_dir / ".env")
