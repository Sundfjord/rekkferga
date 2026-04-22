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
from here_routing import enrich_journey
from journey_domain import hydrate_destination_journey
from departures_domain import evaluate_ferry_departures
from nominatim import get_locations_nominatim

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


@app.get("/journey")
def get_journey():
    from_coords = request.args.get("from")
    to_coords = request.args.get("to")

    if not from_coords or not to_coords:
        return {"error": "from and to coordinates are required"}, 400

    try:
        journey_patterns = get_journey_with_ferries(from_coords, to_coords)
        if not journey_patterns:
            return cache([], 60)
        journey_patterns.sort(key=lambda x: x["duration"])
        enriched = [enrich_journey(serialise_journey(p)) for p in journey_patterns]
        hydrated = [hydrate_destination_journey(j) for j in enriched]
        return cache(hydrated, 300)
    except Exception:
        logger.exception("Error in get_journey")
        return {"error": "Internal server error"}, 500


@app.get("/quay/departures")
def get_quay_departures():
    quay_id = request.args.get("quayId")
    to_quay_id = request.args.get("toQuayId")
    arrival_time = request.args.get("arrivalTime")
    mode = request.args.get("mode")

    if not quay_id or not is_valid_nsr_id(quay_id):
        return {"error": "Valid quayId is required"}, 400
    if not to_quay_id or not is_valid_nsr_id(to_quay_id):
        return {"error": "Valid toQuayId is required"}, 400
    if mode == "refresh" and not arrival_time:
        return {"error": "arrivalTime is required in refresh mode"}, 400

    route = {"expectedEndTime": arrival_time} if arrival_time else None
    quay = {"id": quay_id}

    try:
        if mode == "refresh":
            patch = evaluate_ferry_departures(quay_id, to_quay_id, arrival_time or "")
            return patch["departures"]

        departures = get_departures_from_entur(quay, route, to_quay_id)
        return departures
    except Exception:
        logger.exception("Error in get_quay_departures")
        return {"error": "Internal server error"}, 500


@app.get("/search")
def get_search_results():
    query = request.args.get("query")
    size = int(request.args.get("size", 30))
    return get_locations_nominatim(query, size) or []
