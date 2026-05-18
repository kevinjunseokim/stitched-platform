"""Initial schema.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-05-18 00:00:00
"""
from alembic import op

from initialization.database import db
import models  # noqa: F401


revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Idempotent so an existing local SQLite DB can be stamped forward without
    # failing on tables created before migrations existed.
    db.metadata.create_all(bind=op.get_bind())


def downgrade():
    db.metadata.drop_all(bind=op.get_bind())
