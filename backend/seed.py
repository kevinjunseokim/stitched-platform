#!/usr/bin/env python3
"""Seed Stitched with realistic catalog and demo platform data.

Usage (from the backend directory):
  python seed.py              # catalog (if empty) + demo users/items/social
  python seed.py --fresh      # wipe demo data and reseed
  python seed.py --catalog    # refresh catalog tables only (comps, players, etc.)
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_ROOT))

from app import create_app
from seed_data.catalog import seed_catalog
from seed_data.demo import (
    DEMO_EMAIL_SUFFIX,
    DEMO_PASSWORD,
    clear_demo_data,
    purge_milestone_events,
    purge_synthetic_users,
    repair_demo_catalog,
    seed_demo_platform,
)
from services.feed_service import sync_item_feed_events


def main():
    parser = argparse.ArgumentParser(description="Seed Stitched database with realistic data.")
    parser.add_argument(
        "--fresh",
        action="store_true",
        help="Delete existing demo users/items/social data and reseed.",
    )
    parser.add_argument(
        "--catalog",
        action="store_true",
        help="Force-refresh catalog tables (players, comps, index points, ticker).",
    )
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        if args.catalog:
            print("Refreshing catalog data…")
            seed_catalog(force=True)
            print("Catalog refreshed.")

        if args.fresh:
            removed = clear_demo_data()
            print(f"Cleared {removed} demo user(s).")

        seed_catalog(force=False)
        purged = purge_synthetic_users()
        if purged:
            print(f"Removed {purged} synthetic test account(s) and placeholder items.")
        removed_milestones = purge_milestone_events()
        if removed_milestones:
            print(f"Removed {removed_milestones} portfolio milestone feed post(s).")
        seeded = seed_demo_platform()
        repaired = repair_demo_catalog()
        if repaired:
            print(f"Updated {repaired} demo item(s) to public feed visibility.")
        backfilled = sync_item_feed_events()
        if backfilled:
            print(f"Backfilled {backfilled} item feed event(s).")

        if seeded:
            print("\nDemo platform seeded successfully.\n")
            print("Demo accounts (password for all):")
            print(f"  Password: {DEMO_PASSWORD}\n")
            for handle in ("kevin", "maya", "rcho", "theo", "camille"):
                print(f"  {handle}{DEMO_EMAIL_SUFFIX}  @{handle}")
            print("\nSign in as kevin@stitched.demo to see a full feed, collection, and social graph.")
        elif args.fresh:
            print("Demo data reseeded.")
        else:
            print("Catalog checked. Demo data already present — use --fresh to rebuild.")


if __name__ == "__main__":
    main()
