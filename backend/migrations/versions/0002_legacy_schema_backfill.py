"""Backfill legacy schema additions.

Revision ID: 0002_legacy_schema_backfill
Revises: 0001_initial_schema
Create Date: 2026-05-18 00:01:00
"""
import re

from alembic import op
import sqlalchemy as sa


revision = "0002_legacy_schema_backfill"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


LEGACY_COLUMNS = {
    "users": [
        ("handle", sa.String(length=30)),
        ("bio", sa.Text(), "''"),
    ],
    "items": [
        ("images_json", sa.Text(), "'[]'"),
        ("like_count", sa.Integer(), "0"),
        ("comment_count", sa.Integer(), "0"),
        ("sold_at", sa.DateTime()),
        ("sold_price_cents", sa.Integer()),
        ("sold_to", sa.String(length=120)),
    ],
}


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    for table, specs in LEGACY_COLUMNS.items():
        if table not in tables:
            continue
        existing = {column["name"] for column in inspector.get_columns(table)}
        for spec in specs:
            name = spec[0]
            if name in existing:
                continue
            column = sa.Column(name, spec[1], server_default=sa.text(spec[2]) if len(spec) > 2 else None)
            op.add_column(table, column)

    if "users" in tables:
        _backfill_handles(bind)


def downgrade():
    # Keep downgrade conservative for user data; schema drops are unnecessary
    # for production rollback and risk discarding live profile/item metadata.
    pass


def _slugify(value):
    handle = re.sub(r"[^a-z0-9]+", "", (value or "").lower())
    return (handle[:30] or "collector")


def _backfill_handles(bind):
    users = bind.execute(sa.text("SELECT id, email, first_name, handle FROM users")).mappings().all()
    taken = {row["handle"] for row in users if row["handle"]}

    for row in users:
        if row["handle"]:
            continue
        candidates = [_slugify(row["first_name"]), _slugify(row["email"].split("@")[0])]
        handle = None
        for base in candidates:
            candidate = base
            suffix = 1
            while candidate in taken:
                suffix += 1
                trimmed = base[: max(1, 30 - len(str(suffix)))]
                candidate = f"{trimmed}{suffix}"
            if candidate:
                handle = candidate
                break
        if handle is None:
            handle = "collector"
        taken.add(handle)
        bind.execute(
            sa.text("UPDATE users SET handle = :handle WHERE id = :id"),
            {"handle": handle, "id": row["id"]},
        )
