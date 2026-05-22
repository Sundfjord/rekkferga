import logging
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
from here_routing import get_car_route
from departures_domain import evaluate_ferry_departures, evaluate_quay_departures
from nominatim import get_locations_nominatim
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
    """Single car leg from the user's position to a quay (drive duration + road geometry).
    Quay-centric replacement for the multi-leg /journey on the quay flow."""
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
        result = get_car_route((from_lat, from_lng), (quay["latitude"], quay["longitude"]))
        if not result:
            return {"error": "Routing unavailable"}, 502
        return cache(
            {
                "durationSeconds": result["duration"],
                "geometry": result["geometry"],
                "quay": quay,
            },
            300,
        )
    except Exception:
        logger.exception("Error in get_quay_route")
        return {"error": "Internal server error"}, 500


@app.get("/quay/departures")
def get_quay_departures():
    quay_id = request.args.get("quayId")
    to_quay_id = request.args.get("toQuayId")
    arrival_time = request.args.get("arrivalTime")
    mode = request.args.get("mode")

    if not quay_id or not is_valid_nsr_id(quay_id):
        return {"error": "Valid quayId is required"}, 400

    try:
        # Quay-centric path: no toQuayId → all departures from the quay, labeled by
        # destination across its related crossings.
        if not to_quay_id:
            return evaluate_quay_departures(quay_id, arrival_time)

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


@app.get("/search")
def get_search_results():
    query = request.args.get("query")
    size = int(request.args.get("size", 30))
    return get_locations_nominatim(query, size) or []
