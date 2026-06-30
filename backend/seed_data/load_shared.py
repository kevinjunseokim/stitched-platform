"""Load JSON fixtures from the repo-level ``shared/`` directory."""

import json
from functools import lru_cache
from pathlib import Path

SHARED_ROOT = Path(__file__).resolve().parents[2] / "shared"


@lru_cache(maxsize=None)
def load_shared_json(name: str) -> dict:
    path = SHARED_ROOT / name
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)
