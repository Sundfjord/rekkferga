import os
import logging
import requests
from datetime import datetime

logger = logging.getLogger(__name__)

_HERE_BASE = "https://router.hereapi.com/v8/routes"


def get_drive_seconds(
    from_coords: tuple, to_coords: tuple, departure_time: datetime | None = None
) -> int | None:
    """Traffic-aware car travel time in seconds via HERE Routing v8 (summary only, no
    geometry). None if HERE is unconfigured, unavailable, or returns no usable route."""
    api_key = os.environ.get("HERE_API_KEY")
    if not api_key:
        logger.warning("HERE_API_KEY not set — skipping HERE routing")
        return None

    params = {
        "apiKey": api_key,
        "origin": f"{from_coords[0]},{from_coords[1]}",
        "destination": f"{to_coords[0]},{to_coords[1]}",
        "transportMode": "car",
        "return": "travelSummary",
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
        sections = route.get("sections", [])
        duration = sum(s.get("travelSummary", {}).get("duration", 0) for s in sections)
        if duration > 0:
            return duration

    logger.warning("HERE returned no usable routes for %s → %s", from_coords, to_coords)
    return None
