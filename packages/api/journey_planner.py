import requests
import json
import threading
from cachetools import TTLCache, cached
from datetime import datetime, timedelta
from util import format_datetime_for_api

base_url = "https://api.entur.io/journey-planner/v3/graphql"
headers = {"Content-Type": "application/json", "ET-Client-Name": "miles-fergo_app"}

_nearest_cache = TTLCache(maxsize=100, ttl=60)
_nearest_lock = threading.Lock()


def query_journey_planner(query, variables={}):
    try:
        response = requests.post(
            base_url, json={"query": query, "variables": variables}, headers=headers
        )
        result = json.loads(response.text)
        return result
    except Exception as e:
        print(f"Error in query_journey_planner: {str(e)}")
        return {"errors": [{"message": str(e)}]}


def get_departures_from_entur(quay, route=None):
    """
    Get departures from a quay using the EnTur API.

    Args:
        quay: Quay object
        route: Route object

    Returns:
        Dictionary of departures grouped by destination
    """

    arrival_time_at_quay = (
        route.get("expectedEndTime") if route else datetime.now().isoformat()
    )
    start_time = format_datetime_for_api(arrival_time_at_quay, subtract_minutes=10)
    departures = get_departures_from_nsr_id(quay["id"], start_time)

    return process_departures(departures, route)


def get_departures_from_nsr_id(nsr_id, start_time=None):
    query = """
        query ($ids: [String], $startTime: DateTime) {
            stopPlaces(ids: $ids) {
                id,
                estimatedCalls(numberOfDepartures: 30, startTime: $startTime) {
                    realtime
                    expectedDepartureTime
                    expectedArrivalTime
                    serviceJourney {
                        estimatedCalls {
                            realtime
                            expectedDepartureTime
                            expectedArrivalTime
                            quay {
                                stopPlace {
                                    name
                                    id
                                }
                            }
                        }
                    }
                }
            }
        }
    """
    variables = {"ids": [nsr_id], "startTime": start_time}
    result = query_journey_planner(query, variables)
    return result["data"]["stopPlaces"]


def get_route_to_nsr_id(user_position_coords, nsr_id, time_mode="now"):
    """
    Get a route to a quay by NSR ID. time_mode can be 'now', 'busy' (next Monday 08:00, default) or 'slow' (today at 23:00).
    """
    user_lng, user_lat = user_position_coords.split(",")
    now = datetime.now()
    if time_mode == "now":
        chosen_time = now
    elif time_mode == "slow":
        chosen_time = now.replace(hour=23, minute=0, second=0, microsecond=0)
    else:
        next_monday = now + timedelta(days=(7 - now.weekday()))
        chosen_time = next_monday.replace(hour=8, minute=0, second=0, microsecond=0)
    chosen_time_iso = chosen_time.isoformat()
    query = """
        query (
            $lat: Float!,
            $lng: Float!,
            $id: String,
            $dateTime: DateTime!
        ) {
            trip(
                from: {coordinates: {latitude: $lat, longitude: $lng}}
                to: {place: $id}
                modes: {accessMode: car, egressMode: car, directMode: car}
                numTripPatterns: 10
                dateTime: $dateTime
            ) {
                tripPatterns {
                    expectedStartTime
                    expectedEndTime
                    duration
                    distance
                    legs {
                        fromPlace {
                            name
                            quay {
                                stopPlace {
                                    id
                                    transportMode
                                    transportSubmode
                                }
                            }
                        }
                        toPlace {
                            name
                            quay { stopPlace { name id } }
                        }
                        mode
                        distance
                        duration
                        expectedStartTime
                        expectedEndTime
                        realtime
                        steps {
                            latitude
                            longitude
                        }
                    }
                }
            }
        }

    """
    variables = {
        "id": nsr_id,
        "lat": float(user_lat),
        "lng": float(user_lng),
        "dateTime": chosen_time_iso,
    }
    result = query_journey_planner(query, variables)
    if "data" not in result or "trip" not in result["data"]:
        return []
    trip_patterns = result["data"]["trip"]["tripPatterns"]
    trip_patterns.sort(key=lambda x: x["duration"])
    return trip_patterns[0] if trip_patterns else None


def get_journey_with_ferries(from_coords, to_coords):
    """Get journey plan that may include ferry legs, always using a fixed busy time to maximize tripPatterns."""
    from_lat, from_lng = from_coords.split(",")
    to_lat, to_lng = to_coords.split(",")

    # Set a fixed busy time (next Monday at 08:00)
    now = datetime.now()
    next_monday = now + timedelta(days=(7 - now.weekday()))
    busy_time = next_monday.replace(hour=8, minute=0, second=0, microsecond=0)
    busy_time_iso = busy_time.isoformat()
    now_iso = now.isoformat()

    query = """
        query (
            $fromLat: Float!,
            $fromLng: Float!,
            $toLat: Float!,
            $toLng: Float!,
            $dateTime: DateTime!
        ) {
            trip(
                from: {coordinates: {latitude: $fromLat, longitude: $fromLng}}
                to: {coordinates: {latitude: $toLat, longitude: $toLng}}
                dateTime: $dateTime
                modes: {directMode: car, accessMode: car, egressMode: car}
                numTripPatterns: 5
            ) {
                tripPatterns {
                    expectedStartTime
                    expectedEndTime
                    duration
                    distance
                    legs {
                        mode
                        fromPlace { name quay { stopPlace { id } } }
                        toPlace { name quay { stopPlace { id } } }
                        line { id transportMode transportSubmode }
                    }
                }
            }
        }
    """
    variables = {
        "fromLat": float(from_lat),
        "fromLng": float(from_lng),
        "toLat": float(to_lat),
        "toLng": float(to_lng),
        "dateTime": now_iso,
    }

    try:
        result = query_journey_planner(query, variables)
        if "errors" in result:
            print(f"GraphQL Errors: {result['errors']}")
            return []
        if "data" not in result:
            print(f"No 'data' key in response: {result}")
            return []
        if "trip" not in result["data"]:
            print(f"No 'trip' key in data: {result['data']}")
            return []
        return result["data"]["trip"]["tripPatterns"]
    except Exception as e:
        print(f"Error in get_journey_with_ferries: {str(e)}")
        print(f"Full response: {result if 'result' in locals() else 'No result'}")
        return []


@cached(cache=_nearest_cache, lock=_nearest_lock)
def get_nearest_ferry_stops(lat, lng, maximum_results=10, maximum_distance=200000):
    """
    Find the nearest ferry stops to the given coordinates using EnTur.
    Returns a list of dicts with id, name, latitude, longitude, distance (km).
    Cached for 60 seconds.
    """
    query = """
        query ($lat: Float!, $lng: Float!, $maximumResults: Int!, $maximumDistance: Float!) {
            nearest(
                latitude: $lat
                longitude: $lng
                maximumDistance: $maximumDistance
                maximumResults: $maximumResults
                filterByPlaceTypes: [stopPlace]
                filterByModes: [water]
            ) {
                edges {
                    node {
                        distance
                        place {
                            ... on StopPlace {
                                id
                                name
                                latitude
                                longitude
                                transportMode
                            }
                        }
                    }
                }
            }
        }
    """
    variables = {
        "lat": lat,
        "lng": lng,
        "maximumResults": maximum_results,
        "maximumDistance": float(maximum_distance),
    }
    result = query_journey_planner(query, variables)
    if "data" not in result or "nearest" not in result["data"]:
        return []
    stops = []
    for edge in result["data"]["nearest"]["edges"]:
        node = edge.get("node", {})
        place = node.get("place", {})
        if not place.get("id"):
            continue
        stops.append({
            "id": place["id"],
            "name": place.get("name", ""),
            "latitude": place.get("latitude", 0),
            "longitude": place.get("longitude", 0),
            "distance": round(node.get("distance", 0) / 1000),
        })
    return stops


def health_check():
    query = """
    query Ping {
        __typename
    }
    """
    result = query_journey_planner(query)
    return result["data"]["__typename"] == "QueryType"


def process_departures(departure_data, route=None):
    """
    Process EnTur departure data and return standardized departure objects.

    Args:
        departure_data: Raw departure data from EnTur API (list of stop places)
        route: Route information for determining relevant departures

    Returns:
        Dictionary of departures grouped by destination with relevant marking
    """
    departures_by_destination = {}

    if (
        not departure_data
        or not isinstance(departure_data, list)
        or len(departure_data) == 0
    ):
        return departures_by_destination

    # Get the first (and only) stop place from the list
    stop_place = departure_data[0]
    estimated_calls = stop_place.get("estimatedCalls", [])

    if not estimated_calls:
        return departures_by_destination

    # Track first reachable departure per destination
    first_reachable_departures = {}
    for i, departure in enumerate(estimated_calls):
        service_journey_calls = departure.get("serviceJourney", {}).get(
            "estimatedCalls", []
        )

        if not service_journey_calls:
            continue

        for n, call in enumerate(service_journey_calls):

            destination = call.get("quay", {}).get("stopPlace", {}).get("name")

            if (
                not destination
                or len(departures_by_destination.get(destination, [])) >= 10
            ):
                continue

            # Check if this is the first reachable departure for this destination
            is_first_reachable = False
            if (
                route
                and route.get("expectedEndTime")
                and departure.get("expectedDepartureTime")
            ):
                if destination not in first_reachable_departures and departure.get(
                    "expectedDepartureTime"
                ) > route.get("expectedEndTime"):
                    first_reachable_departures[destination] = departure.get(
                        "expectedDepartureTime"
                    )
                    is_first_reachable = True
                elif destination in first_reachable_departures:
                    # Check if this departure is the first reachable one
                    is_first_reachable = (
                        departure.get("expectedDepartureTime")
                        == first_reachable_departures[destination]
                    )

            # Starting with the first call, add each stop up to and including the current call to the journey
            journey = [
                {
                    "time": call.get("expectedDepartureTime"),
                    "realtime": call.get("realtime", False),
                    "stopPlaceName": call.get("quay", {})
                    .get("stopPlace", {})
                    .get("name", "Unknown Stop Place"),
                }
                for call in service_journey_calls[: n + 1]
            ]

            if n == 0:
                continue
            # Initialize destination array if needed and add departure
            if destination not in departures_by_destination:
                departures_by_destination[destination] = []

            departures_by_destination[destination].append(
                {
                    "expectedDepartureTime": departure.get("expectedDepartureTime"),
                    "realtime": departure.get("realtime", False),
                    "journey": journey,
                    "relevant": False,
                    "isFirstReachableDeparture": is_first_reachable,
                }
            )

    # Sort departures by expectedDepartureTime
    for destination in departures_by_destination:
        departures_by_destination[destination].sort(
            key=lambda x: x["expectedDepartureTime"]
        )
        # Set the first 4 to relevant
        for i in range(len(departures_by_destination[destination])):
            departures_by_destination[destination][i]["relevant"] = i < 4

    return departures_by_destination
