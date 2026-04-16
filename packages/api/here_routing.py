import os
import logging
import requests
import flexpolyline
from datetime import datetime

logger = logging.getLogger(__name__)

_HERE_BASE = "https://router.hereapi.com/v8/routes"


def _decode_polyline(encoded: str) -> list[list[float]]:
    """Decode a HERE Flexible Polyline string to [[lat, lng], ...]."""
    return [[pt[0], pt[1]] for pt in flexpolyline.decode(encoded)]


def get_car_route(from_coords: tuple, to_coords: tuple, departure_time: datetime | None = None) -> dict | None:
    """
    Call HERE Routing API v8 for a car leg.

    Args:
        from_coords: (lat, lng) tuple
        to_coords:   (lat, lng) tuple
        departure_time: datetime for traffic context (defaults to now)

    Returns:
        {
            "duration":     int (seconds, traffic-aware),
            "geometry":     [[lat, lng], ...],
            "alternatives": [{"duration": int, "geometry": [[lat, lng], ...]}, ...]
        }
        or None if HERE is unavailable or the call fails.
    """
    api_key = os.environ.get("HERE_API_KEY")
    if not api_key:
        logger.warning("HERE_API_KEY not set — skipping HERE routing")
        return None

    dep_time = (departure_time or datetime.now()).astimezone()

    params = {
        "apiKey": api_key,
        "origin": f"{from_coords[0]},{from_coords[1]}",
        "destination": f"{to_coords[0]},{to_coords[1]}",
        "transportMode": "car",
        "return": "travelSummary,polyline",
        "departureTime": dep_time.isoformat(),
        "alternatives": 2,
    }

    try:
        resp = requests.get(_HERE_BASE, params=params, timeout=8)
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        logger.exception("HERE API request failed for %s → %s", from_coords, to_coords)
        return None

    routes = []
    for route in data.get("routes", []):
        sections = route.get("sections", [])
        if not sections:
            continue

        # Section-level travelSummary (return=travelSummary), fall back to route-level summary
        total_duration = sum(
            s.get("travelSummary", {}).get("duration", 0) for s in sections
        )
        if total_duration == 0:
            total_duration = route.get("summary", {}).get("duration", 0)
        if total_duration == 0:
            logger.warning("HERE returned 0 duration for %s → %s, skipping route", from_coords, to_coords)
            continue

        coords = []
        for section in sections:
            encoded = section.get("polyline", "")
            if encoded:
                coords.extend(_decode_polyline(encoded))

        if not coords:
            continue

        routes.append({"duration": total_duration, "geometry": coords})

    if not routes:
        logger.warning("HERE returned no usable routes for %s → %s", from_coords, to_coords)
        return None

    return {
        "duration": routes[0]["duration"],
        "geometry": routes[0]["geometry"],
        "alternatives": routes[1:],
    }


def enrich_journey(journey: dict) -> dict:
    """
    Enrich a serialised JourneyResult's car legs with HERE routing data.

    For each car leg, replaces EnTur's static duration with HERE's
    traffic-aware duration and adds road-snapped geometry.
    Adds a top-level trafficDataAvailable flag.

    Safe to call without a HERE_API_KEY — legs are left unchanged and
    trafficDataAvailable is set to False.
    """
    any_success = False

    for leg in journey.get("legs", []):
        if leg.get("mode") != "car":
            continue

        from_place = leg.get("fromPlace", {})
        to_place = leg.get("toPlace", {})

        from_lat = from_place.get("latitude")
        from_lng = from_place.get("longitude")
        to_lat = to_place.get("latitude")
        to_lng = to_place.get("longitude")

        if not all([from_lat, from_lng, to_lat, to_lng]):
            continue

        result = get_car_route((from_lat, from_lng), (to_lat, to_lng))

        if result:
            leg["duration"] = result["duration"]
            leg["geometry"] = result["geometry"]
            if result.get("alternatives"):
                leg["alternatives"] = result["alternatives"]
            any_success = True

    journey["trafficDataAvailable"] = any_success
    return journey
