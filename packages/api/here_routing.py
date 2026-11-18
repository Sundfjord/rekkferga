import os
import logging
import requests
from datetime import datetime

logger = logging.getLogger(__name__)

_HERE_BASE = "https://router.hereapi.com/v8/routes"


def get_drive_time(
    from_coords: tuple, to_coords: tuple, departure_time: datetime | None = None
) -> dict | None:
    """Car travel time via HERE Routing v8 (summary only, no geometry):
    `{"seconds": int, "typicalSeconds": int | None}` — `seconds` with live traffic,
    `typicalSeconds` with the traffic usual for this weekday and time (None when HERE has
    no typical figure). None if HERE is unconfigured, unavailable, or returns no usable route."""
    api_key = os.environ.get("HERE_API_KEY")
    if not api_key:
        logger.warning("HERE_API_KEY not set — skipping HERE routing")
        return None

    params = {
        "apiKey": api_key,
        "origin": f"{from_coords[0]},{from_coords[1]}",
        "destination": f"{to_coords[0]},{to_coords[1]}",
        "transportMode": "car",
        "return": "travelSummary,typicalDuration",
        "departureTime": (departure_time or datetime.now()).astimezone().isoformat(),
    }

    try:
        resp = requests.get(_HERE_BASE, params=params, timeout=8)
        resp.raise_for_status()
        routes = resp.json().get("routes", [])
    except Exception:
        logger.exception("HERE API request failed for %s → %s", from_coords, to_coords)
        return None

    for route in routes:
        summaries = [s.get("travelSummary", {}) for s in route.get("sections", [])]
        duration = sum(s.get("duration", 0) for s in summaries)
        if duration > 0:
            # Only a full typical figure is comparable; drop it if any section lacks one.
            typical = (
                sum(s["typicalDuration"] for s in summaries)
                if all("typicalDuration" in s for s in summaries)
                else None
            )
            return {"seconds": duration, "typicalSeconds": typical}

    logger.warning("HERE returned no usable routes for %s → %s", from_coords, to_coords)
    return None
