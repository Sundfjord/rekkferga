"""In-memory ferry-quay dataset, loaded from the committed Vegvesen snapshot.

``data/quays.json`` is the raw NVDB payload (see scripts/refresh_quays.py). This module
loads it once at import and exposes lookups + a client-facing projection. Each quay ``id``
is an EnTur NSR stop-place id, so the same id flows straight into the EnTur departure
queries with no mapping.
"""

import json
import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "quays.json")

# Norwegian county codes (2024 fylke numbering) → display name. Used for a human-readable
# subName, since the raw NVDB payload leaves county/municipality names blank.
_COUNTY_NAMES: dict[int, str] = {
    11: "Rogaland",
    15: "Møre og Romsdal",
    18: "Nordland",
    31: "Østfold",
    32: "Akershus",
    33: "Buskerud",
    34: "Innlandet",
    39: "Vestfold",
    40: "Telemark",
    42: "Agder",
    46: "Vestland",
    50: "Trøndelag",
    55: "Troms",
    56: "Finnmark",
}


def _project(quay: dict[str, Any]) -> dict[str, Any]:
    """Map a raw NVDB quay to the client shape (Quay in shared/types)."""
    location = quay.get("location") or {}
    coords = (location.get("geometry") or {}).get("coordinates") or [None, None]
    lng, lat = (coords + [None, None])[:2]

    counties = location.get("counties") or []
    county_code = counties[0].get("code") if counties else None
    roads = location.get("roads") or []
    road_number = roads[0].get("number") if roads else None

    sub_parts = [p for p in (_COUNTY_NAMES.get(county_code), road_number) if p]

    return {
        "id": quay.get("id"),
        "name": quay.get("name"),
        "latitude": lat,
        "longitude": lng,
        "relatedQuayIds": quay.get("relatedQuayIds") or [],
        "subName": " · ".join(sub_parts) or None,
    }


def _load() -> dict[str, dict[str, Any]]:
    try:
        with open(_DATA_PATH, encoding="utf-8") as fh:
            raw = json.load(fh)
    except (OSError, ValueError):
        logger.exception("Failed to load quay snapshot at %s", _DATA_PATH)
        return {}

    by_id: dict[str, dict[str, Any]] = {}
    for quay in raw.get("quays", []):
        projected = _project(quay)
        if projected["id"] and projected["latitude"] is not None:
            by_id[projected["id"]] = projected
    return by_id


_QUAYS_BY_ID: dict[str, dict[str, Any]] = _load()


def get_all_quays() -> list[dict[str, Any]]:
    return list(_QUAYS_BY_ID.values())


def get_quay(quay_id: str | None) -> dict[str, Any] | None:
    if not quay_id:
        return None
    return _QUAYS_BY_ID.get(quay_id)


def related_quay_ids(quay_id: str | None) -> list[str]:
    quay = get_quay(quay_id)
    return quay["relatedQuayIds"] if quay else []


def quay_name(quay_id: str | None) -> str | None:
    quay = get_quay(quay_id)
    return quay["name"] if quay else None
