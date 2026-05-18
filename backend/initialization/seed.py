"""Idempotent catalog seeding on app startup.

Demo users, items, feed, and social data are seeded via `python seed.py`.
"""
from seed_data.catalog import seed_catalog
from services.feed_service import sync_item_feed_events


def seed_all():
    """Run catalog seeders. Each skips if data already exists."""
    seed_catalog(force=False)
    sync_item_feed_events()
