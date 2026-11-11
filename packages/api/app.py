import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv
from util import is_valid_nsr_id, cache
from journey_planner import (
    get_journey_with_ferries,
    get_departures_from_entur,
    serialise_journey,
    health_check,
)
from here_routing import get_drive_seconds
from departures_domain import evaluate_ferry_departures, evaluate_quay_departures
from geocoder import search_locations
from quays import get_all_quays, get_quay

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)


@app.get("/")
def home():
    return "Running"


@app.get("/health")
def health():
    try:
        entur_ok = health_check()
        return {"status": "ok", "entur": entur_ok}
    except Exception:
        logger.exception("Health check failed")
        return {"status": "degraded"}, 503


@app.get("/quays")
def get_quays():
    # Static dataset loaded from the committed Vegvesen snapshot; long cache.
    return cache(get_all_quays(), 86400)


@app.get("/journey")
def get_journey():
    from_coords = request.args.get("from")
    to_coords = request.args.get("to")

    if not from_coords or not to_coords:
        return {"error": "from and to coordinates are required"}, 400

    try:
        # Quay-centric: /journey now only locates the first ferry quay for destination
        # search, so we skip HERE enrichment and the destination-centric hydration.
        journey_patterns = get_journey_with_ferries(from_coords, to_coords)
        if not journey_patterns:
            return cache([], 60)
        serialised = [serialise_journey(p) for p in journey_patterns]

        # Prefer patterns that contain a ferry leg, then shorter total duration.
        def _sort_key(j):
            has_ferry = any(leg.get("mode") == "water" for leg in j.get("legs", []))
            return (0 if has_ferry else 1, j.get("totalDurationSeconds", float("inf")))

        serialised.sort(key=_sort_key)
        return cache(serialised, 300)
    except Exception:
        logger.exception("Error in get_journey")
        return {"error": "Internal server error"}, 500


@app.get("/quay/route")
def get_quay_route():
    """Traffic-aware drive time from the user's position to a quay."""
    from_coords = request.args.get("from")
    quay_id = request.args.get("quayId")

    if not from_coords:
        return {"error": "from coordinates are required"}, 400
    if not quay_id or not is_valid_nsr_id(quay_id):
        return {"error": "Valid quayId is required"}, 400

    quay = get_quay(quay_id)
    if not quay:
        return {"error": "Unknown quay"}, 404

    try:
        from_lat, from_lng = (float(x) for x in from_coords.split(","))
    except (ValueError, TypeError):
        return {"error": "Invalid from coordinates"}, 400

    try:
        seconds = get_drive_seconds((from_lat, from_lng), (quay["latitude"], quay["longitude"]))
        if seconds is None:
            return {"error": "Routing unavailable"}, 502
        return cache({"durationSeconds": seconds, "quay": quay}, 300)
    except Exception:
        logger.exception("Error in get_quay_route")
        return {"error": "Internal server error"}, 500


@app.get("/quay/departures")
def get_quay_departures():
    quay_id = request.args.get("quayId")
    to_quay_id = request.args.get("toQuayId")
    arrival_time = request.args.get("arrivalTime")
    mode = request.args.get("mode")
    try:
        limit = min(max(int(request.args.get("limit", 4)), 1), 12)
    except ValueError:
        limit = 4

    if not quay_id or not is_valid_nsr_id(quay_id):
        return {"error": "Valid quayId is required"}, 400

    try:
        # Quay-centric path: no toQuayId → all departures from the quay, labeled by
        # destination across its related crossings.
        if not to_quay_id:
            return evaluate_quay_departures(quay_id, arrival_time, limit)

        # Legacy single-destination path (used by the destination-centric journey flow).
        if not is_valid_nsr_id(to_quay_id):
            return {"error": "Valid toQuayId is required"}, 400
        if mode == "refresh":
            if not arrival_time:
                return {"error": "arrivalTime is required in refresh mode"}, 400
            return evaluate_ferry_departures(quay_id, to_quay_id, arrival_time)

        route = {"expectedEndTime": arrival_time} if arrival_time else None
        return get_departures_from_entur({"id": quay_id}, route, to_quay_id)
    except Exception:
        logger.exception("Error in get_quay_departures")
        return {"error": "Internal server error"}, 500


MAX_NEXT_QUAYS = 20  # matches MAX_FAVORITES in shared/utils/favorites.ts


def _parse_coords(raw: str | None) -> tuple[float, float] | None:
    try:
        lat, lng = (float(x) for x in (raw or "").split(","))
        return lat, lng
    except (ValueError, TypeError):
        return None


def _next_departure(quay_id: str, origin: tuple[float, float] | None) -> dict:
    """The next departure the user can make from one quay (or simply the next one,
    without a position), plus the drive time it was computed with."""
    quay = get_quay(quay_id)
    drive = None
    if origin and quay:
        drive = get_drive_seconds(origin, (quay["latitude"], quay["longitude"]))
    arrival = None
    if drive is not None:
        arrival = (datetime.now(timezone.utc) + timedelta(seconds=drive)).isoformat().replace("+00:00", "Z")
    try:
        departure = evaluate_quay_departures(quay_id, arrival)["selectedDeparture"]
    except Exception:
        logger.exception("next departure failed for %s", quay_id)
        departure = None
    return {"quayId": quay_id, "driveSeconds": drive, "departure": departure}


@app.get("/quays/next")
def get_quays_next():
    """Batch: next reachable departure for several quays (the user's favourites) in one call."""
    ids = [i for i in (request.args.get("ids") or "").split(",") if i]
    ids = [i for i in dict.fromkeys(ids) if is_valid_nsr_id(i) and get_quay(i)][:MAX_NEXT_QUAYS]
    if not ids:
        return cache([], 60)
    origin = _parse_coords(request.args.get("from"))
    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(lambda qid: _next_departure(qid, origin), ids))
    return cache(results, 60)


@app.get("/search")
def get_search_results():
    query = request.args.get("query")
    try:
        size = min(max(int(request.args.get("size", 10)), 1), 30)
    except ValueError:
        size = 10
    focus = None
    try:
        lat, lon = request.args.get("lat"), request.args.get("lon")
        if lat and lon:
            focus = (float(lat), float(lon))
    except ValueError:
        pass
    return cache(search_locations(query, size, focus), 300)
