from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras
from util import is_valid_nsr_id, cache
from geopy.distance import geodesic
from journey_planner import (
    get_route_to_nsr_id,
    get_journey_with_ferries,
    get_departures_from_entur,
)
from nominatim import get_locations_nominatim
from ors import get_locations_ors
from vegvesen import (
    get_departures_from_vegvesen,
)
import logging
import os
import traceback

load_dotenv()

app = Flask(__name__)
CORS(app)

DATABASE_URL = os.environ.get("DATABASE_URL")


def get_db_conn():
    return psycopg2.connect(DATABASE_URL)


def init_db():
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS quays (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    municipality TEXT,
                    region TEXT,
                    latitude DOUBLE PRECISION NOT NULL,
                    longitude DOUBLE PRECISION NOT NULL,
                    related_quay_ids TEXT[]
                )
            """)
        conn.commit()


try:
    init_db()
except Exception as e:
    logging.error(f"Unable to initialise database:\n{traceback.format_exc()}")


@app.get("/")
def home():
    return "Running"


@app.get("/quays")
def get_quays_by_params():
    query_params = list(request.args.keys())

    if "nsrIds" in query_params:
        nsr_ids = request.args.getlist("nsrIds")
        return get_quays_from_nsr_ids(nsr_ids)

    if "coords" in query_params:
        return get_quays_by_distance(request.args)

    quays = get_quays()
    return cache(quays, 300)


@app.get("/quays/route")
def get_quays_along_route():
    from_coords = request.args.get("from")
    to_coords = request.args.get("to")

    if not from_coords or not to_coords:
        return {"error": "from and to coordinates are required"}, 400

    try:
        # Use EnTur journey planner to find ferry legs and extract stopPlace IDs
        journey_patterns = get_journey_with_ferries(from_coords, to_coords)
        print(journey_patterns)
        # Sort by duration
        journey_patterns.sort(key=lambda x: x["duration"])
        nsr_ids = set()
        if len(journey_patterns) > 0:
            # Only check the fastest/shortest route
            pattern = journey_patterns[0]
            for leg in pattern.get("legs", []):
                if leg.get("mode") == "water" or (
                    leg.get("line") and leg["line"].get("transportMode") == "water"
                ):
                    from_place = leg.get("fromPlace")
                    if (
                        from_place
                        and from_place.get("quay")
                        and from_place["quay"]["stopPlace"].get("id")
                    ):
                        nsr_ids.add(from_place["quay"]["stopPlace"]["id"])
                    else:
                        print(f"No stopPlace found for {from_place}")
            if nsr_ids:
                nsr_ids = list(nsr_ids)
                return get_quays_from_nsr_ids(nsr_ids)
            else:
                return []
        else:
            print("No journey patterns found")
            return []
    except Exception as e:
        print(f"Error in get_quays_along_route: {str(e)}")
        return {"error": "Internal server error"}, 500


@app.get("/quay/details")
def get_quay_details():
    user_position_coords = request.args.get("coords")
    if not user_position_coords or not request.args.get("quayId"):
        return {"error": "coords and quayId are required"}, 400

    # Get base quay data
    quay_data = None
    try:
        with get_db_conn() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    'SELECT id, name, municipality, region, latitude, longitude, related_quay_ids AS "relatedQuayIds" FROM quays WHERE id = %s',
                    (request.args.get("quayId"),),
                )
                row = cur.fetchone()
                if row:
                    quay_data = dict(row)
    except Exception as e:
        print(f"Error fetching quay data: {str(e)}")

    # Route info
    route = get_route_to_nsr_id(user_position_coords, quay_data["id"])

    # Try EnTur first
    departures_by_destination = get_departures_from_entur(quay_data, route)
    # In case of incomplete journey data, use Vegvesen API as fallback
    if not departures_by_destination:
        departures_by_destination = get_departures_from_vegvesen(quay_data, route)

    return {
        "quay": quay_data,
        "route": route,
        "departuresByDestination": departures_by_destination,
    }


@app.get("/search")
def get_search_results():
    query = request.args.get("query")
    size = int(request.args.get("size", 30))

    results = []
    quays = get_quays()
    # Add quays to results if query is in quay name
    for quay in quays:
        if query.strip().lower() in quay["name"].lower():
            quay_result = {
                "id": quay["id"],
                "name": quay["name"],
                "sub_name": f"{quay['municipality']}, {quay['region']}",
                "latitude": quay["latitude"],
                "longitude": quay["longitude"],
                "type": "quay",
            }
            results.append(quay_result)

    # Try Nominatim first
    nominatim_results = get_locations_nominatim(query, size)
    if nominatim_results:
        results.extend(nominatim_results)
        return results

    # Fallback to ORS if Nominatim fails or returns no results
    ors_results = get_locations_ors(query, size)
    if ors_results:
        results.extend(ors_results)
        return results

    return results


def get_quays():
    with get_db_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                'SELECT id, name, municipality, region, latitude, longitude, related_quay_ids AS "relatedQuayIds" FROM quays'
            )
            return [dict(row) for row in cur.fetchall()]


def get_quays_from_nsr_ids(nsr_ids):
    valid_nsr_ids = [nsr_id for nsr_id in nsr_ids if is_valid_nsr_id(nsr_id)]
    if not valid_nsr_ids:
        return []
    with get_db_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                'SELECT id, name, municipality, region, latitude, longitude, related_quay_ids AS "relatedQuayIds" FROM quays WHERE id = ANY(%s)',
                (valid_nsr_ids,),
            )
            return [dict(row) for row in cur.fetchall()]


def get_quays_by_distance(args):
    quays_by_distance = []
    user_lat, user_lng = args.get("coords").split(",")
    for quay in get_quays():
        quay_coords = (quay["latitude"], quay["longitude"])
        distance = geodesic((user_lat, user_lng), quay_coords)
        quay["distance"] = (int)(distance.kilometers)
        quays_by_distance.append((quay, distance))

    quays_by_distance.sort(key=lambda c: c[1])
    limit = int(args.getlist("limit")[0]) if "limit" in args else 10
    offset = int(args.getlist("offset")[0]) if "offset" in args else 0

    return [q[0] for q in quays_by_distance[offset : offset + limit]]
