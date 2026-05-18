import pytest
from flask import Flask

from config import ProductionConfig


def test_production_config_requires_secret_key(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite:////tmp/stitched-prod.sqlite")
    monkeypatch.setenv("CORS_ORIGINS", "https://stitched.example")
    monkeypatch.delenv("SECRET_KEY", raising=False)

    app = Flask(__name__)
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        ProductionConfig.init_app(app)
