import logging
from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv
from util import is_valid_nsr_id
from journey_planner import (
    get_journey_with_ferries,
    get_departures_from_entur,
)
from nominatim import get_locations_nominatim
from ors import get_locations_ors

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
            return []
        journey_patterns.sort(key=lambda x: x["duration"])
        return journey_patterns
    except Exception as e:
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
    except Exception as e:
        logger.exception("Error in get_quay_departures")
        return {"error": "Internal server error"}, 500


@app.get("/search")
def get_search_results():
    query = request.args.get("query")
    size = int(request.args.get("size", 30))

    nominatim_results = get_locations_nominatim(query, size)
    if nominatim_results:
        return nominatim_results

    ors_results = get_locations_ors(query, size)
    if ors_results:
        return ors_results

    return []
