from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv
from util import is_valid_nsr_id, cache
from journey_planner import (
    get_route_to_nsr_id,
    get_journey_with_ferries,
    get_departures_from_entur,
    get_nearest_ferry_stops,
)
from nominatim import get_locations_nominatim
from ors import get_locations_ors
from vegvesen import (
    get_departures_from_vegvesen,
    get_vegvesen_quay_list,
    get_vegvesen_quay,
)
from entur_geocoder import search_ferry_stops

load_dotenv()

app = Flask(__name__)
CORS(app)


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
        journey_patterns = get_journey_with_ferries(from_coords, to_coords)
        journey_patterns.sort(key=lambda x: x["duration"])
        nsr_ids = set()
        if len(journey_patterns) > 0:
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
                return get_quays_from_nsr_ids(list(nsr_ids))
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

    quay_data = get_vegvesen_quay(request.args.get("quayId"))
    if not quay_data:
        return {"error": "Quay not found"}, 404

    route = get_route_to_nsr_id(user_position_coords, quay_data["id"])

    departures_by_destination = get_departures_from_entur(quay_data, route)
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

    results = list(search_ferry_stops(query))

    nominatim_results = get_locations_nominatim(query, size)
    if nominatim_results:
        results.extend(nominatim_results)
        return results

    ors_results = get_locations_ors(query, size)
    if ors_results:
        results.extend(ors_results)
        return results

    return results


def get_quays():
    return list(get_vegvesen_quay_list().values())


def get_quays_from_nsr_ids(nsr_ids):
    valid_ids = [nsr_id for nsr_id in nsr_ids if is_valid_nsr_id(nsr_id)]
    if not valid_ids:
        return []
    quay_list = get_vegvesen_quay_list()
    return [quay_list[nsr_id] for nsr_id in valid_ids if nsr_id in quay_list]


def get_quays_by_distance(args):
    user_lat, user_lng = args.get("coords").split(",")
    limit = int(args.getlist("limit")[0]) if "limit" in args else 10
    offset = int(args.getlist("offset")[0]) if "offset" in args else 0

    stops = get_nearest_ferry_stops(float(user_lat), float(user_lng), offset + limit)

    quay_list = get_vegvesen_quay_list()
    result = []
    for stop in stops:
        vegvesen_quay = quay_list.get(stop["id"])
        result.append({
            **stop,
            "municipality": vegvesen_quay["municipality"] if vegvesen_quay else None,
            "region": vegvesen_quay["region"] if vegvesen_quay else None,
            "relatedQuayIds": vegvesen_quay["relatedQuayIds"] if vegvesen_quay else [],
        })

    return result[offset:offset + limit]
