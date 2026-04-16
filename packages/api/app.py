import logging
from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv
from util import is_valid_nsr_id, cache
from journey_planner import (
    get_journey_with_ferries,
    get_departures_from_entur,
    serialise_journey,
)
from here_routing import enrich_journey
from nominatim import get_locations_nominatim

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)


@app.get("/")
def home():
    return "Running"


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
        return cache([enrich_journey(serialise_journey(p)) for p in journey_patterns], 300)
    except Exception:
        logger.exception("Error in get_journey")
        return {"error": "Internal server error"}, 500


@app.get("/quay/departures")
def get_quay_departures():
    quay_id = request.args.get("quayId")
    arrival_time = request.args.get("arrivalTime")

    if not quay_id or not is_valid_nsr_id(quay_id):
        return {"error": "Valid quayId is required"}, 400

    route = {"expectedEndTime": arrival_time} if arrival_time else None
    quay = {"id": quay_id}

    try:
        departures = get_departures_from_entur(quay, route)
        return departures
    except Exception:
        logger.exception("Error in get_quay_departures")
        return {"error": "Internal server error"}, 500


@app.get("/search")
def get_search_results():
    query = request.args.get("query")
    size = int(request.args.get("size", 30))
    return get_locations_nominatim(query, size) or []
