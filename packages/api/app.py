import logging
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv
from util import is_valid_nsr_id, cache
from journey_planner import get_journey_with_ferries, serialise_journey
from here_routing import get_drive_seconds
from departures_domain import evaluate_quay_departures
from geocoder import search_locations
from quays import get_all_quays, get_quay

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Which websites may call this API from a browser. Production allows only the web app's
# domain; local development (FLASK_ENV=development, as in packages/api/.env) allows any origin
# so localhost, LAN and Tailscale testing keep working. CORS_ORIGINS (comma-separated)
# overrides both, e.g. to add a Cloudflare Pages preview URL.
PRODUCTION_ORIGINS = ["https://rekkferga.no", "https://www.rekkferga.no"]


def _cors_origins() -> list[str] | str:
    override = os.environ.get("CORS_ORIGINS")
    if override:
        return [o.strip() for o in override.split(",") if o.strip()]
    if os.environ.get("FLASK_ENV") == "development" or os.environ.get("FLASK_DEBUG") == "1":
        return "*"
    return PRODUCTION_ORIGINS


CORS(app, origins=_cors_origins())


def _parse_coords(raw: str | None) -> tuple[float, float] | None:
    try:
        lat, lng = (float(x) for x in (raw or "").split(","))
        return lat, lng
    except (ValueError, TypeError):
        return None


@app.get("/")
def home():
    return "Running"


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

    origin = _parse_coords(from_coords)
    if not origin:
        return {"error": "Valid from coordinates are required"}, 400
    if not quay_id or not is_valid_nsr_id(quay_id):
        return {"error": "Valid quayId is required"}, 400

    quay = get_quay(quay_id)
    if not quay:
        return {"error": "Unknown quay"}, 404

    try:
        seconds = get_drive_seconds(origin, (quay["latitude"], quay["longitude"]))
        if seconds is None:
            return {"error": "Routing unavailable"}, 502
        # Short cache: drive time is traffic-aware and shared with /quays/next (also 60 s).
        return cache({"durationSeconds": seconds}, 60)
    except Exception:
        logger.exception("Error in get_quay_route")
        return {"error": "Internal server error"}, 500


@app.get("/quay/departures")
def get_quay_departures():
    """All upcoming departures from a quay, each labeled with its end destination (and the
    stops it calls at on the way); margins when `arrivalTime` is given."""
    quay_id = request.args.get("quayId")
    arrival_time = request.args.get("arrivalTime")
    try:
        limit = min(max(int(request.args.get("limit", 4)), 1), 12)
    except ValueError:
        limit = 4

    if not quay_id or not is_valid_nsr_id(quay_id):
        return {"error": "Valid quayId is required"}, 400

    try:
        return evaluate_quay_departures(quay_id, arrival_time, limit)
    except Exception:
        logger.exception("Error in get_quay_departures")
        return {"error": "Internal server error"}, 500


MAX_NEXT_QUAYS = 20  # matches MAX_FAVORITES in shared/utils/favorites.ts


def _next_departures(quay_id: str, origin: tuple[float, float] | None) -> dict:
    """The next few departures from one quay, plus the drive time to it. Clients recompute
    margins live and pick the first they can still make, so several are returned."""
    quay = get_quay(quay_id)
    drive = None
    if origin and quay:
        drive = get_drive_seconds(origin, (quay["latitude"], quay["longitude"]))
    arrival = None
    if drive is not None:
        arrival = (datetime.now(timezone.utc) + timedelta(seconds=drive)).isoformat().replace("+00:00", "Z")
    try:
        departures = evaluate_quay_departures(quay_id, arrival)["departures"]
    except Exception:
        logger.exception("next departures failed for %s", quay_id)
        departures = []
    return {"quayId": quay_id, "driveSeconds": drive, "departures": departures}


@app.get("/quays/next")
def get_quays_next():
    """Batch: next departures + drive time for several quays (the user's favourites) in one call."""
    ids = [i for i in (request.args.get("ids") or "").split(",") if i]
    ids = [i for i in dict.fromkeys(ids) if is_valid_nsr_id(i) and get_quay(i)][:MAX_NEXT_QUAYS]
    if not ids:
        return cache([], 60)
    origin = _parse_coords(request.args.get("from"))
    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(lambda qid: _next_departures(qid, origin), ids))
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
