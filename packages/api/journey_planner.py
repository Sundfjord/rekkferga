import logging
import requests
import json
from datetime import datetime
from util import format_datetime_for_api

logger = logging.getLogger(__name__)

base_url = "https://api.entur.io/journey-planner/v3/graphql"
headers = {"Content-Type": "application/json", "ET-Client-Name": "rekkferga_app"}


def query_journey_planner(query, variables={}):
    try:
        response = requests.post(
            base_url, json={"query": query, "variables": variables}, headers=headers
        )
        result = json.loads(response.text)
        return result
    except Exception as e:
        logger.exception("Error in query_journey_planner")
        return {"errors": [{"message": str(e)}]}


def get_departures_from_entur(quay, route=None):
    """
    Get departures from a quay using the EnTur API.

    Args:
        quay: Quay object with an 'id' field
        route: Route object with 'expectedEndTime' for margin calculation

    Returns:
        Dictionary of departures grouped by destination
    """
    arrival_time = route.get("expectedEndTime") if route else None
    if arrival_time:
        # Start 15 min before estimated arrival so the user sees the departure
        # just before theirs (negative margin) and several catchable ones after.
        # format_datetime_for_api handles past timestamps gracefully.
        start_time = format_datetime_for_api(arrival_time, subtract_minutes=15)
    else:
        start_time = format_datetime_for_api(None)
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


def get_journey_with_ferries(from_coords, to_coords):
    """Get journey plan that may include ferry legs."""
    from_lat, from_lng = from_coords.split(",")
    to_lat, to_lng = to_coords.split(",")
    now_iso = datetime.now().isoformat()

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
                        expectedStartTime
                        expectedEndTime
                        duration
                        distance
                        fromPlace {
                            name
                            latitude
                            longitude
                            quay { stopPlace { id name } }
                        }
                        toPlace {
                            name
                            latitude
                            longitude
                            quay { stopPlace { id name } }
                        }
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
            logger.error("GraphQL errors: %s", result["errors"])
            return []
        if "data" not in result:
            logger.error("No 'data' key in response: %s", result)
            return []
        if "trip" not in result["data"]:
            logger.error("No 'trip' key in data: %s", result["data"])
            return []
        return result["data"]["trip"]["tripPatterns"]
    except Exception:
        logger.exception("Error in get_journey_with_ferries")
        return []


def serialise_journey(pattern):
    """
    Map a raw EnTur tripPattern dict to the JourneyResult shape expected by frontends.
    Ferry legs get mode='water' with fromQuayId/toQuayId; all others get mode='car'.
    """
    legs = []
    for leg in pattern.get("legs", []):
        mode = leg.get("mode", "")
        line = leg.get("line") or {}
        is_ferry = mode == "water" or line.get("transportMode") == "water"

        from_place_raw = leg.get("fromPlace") or {}
        to_place_raw = leg.get("toPlace") or {}

        from_place = {
            "name": from_place_raw.get("name"),
            "latitude": from_place_raw.get("latitude"),
            "longitude": from_place_raw.get("longitude"),
        }
        to_place = {
            "name": to_place_raw.get("name"),
            "latitude": to_place_raw.get("latitude"),
            "longitude": to_place_raw.get("longitude"),
        }

        base = {
            "expectedStartTime": leg.get("expectedStartTime"),
            "expectedEndTime": leg.get("expectedEndTime"),
            "duration": leg.get("duration"),
            "distance": leg.get("distance"),
            "fromPlace": from_place,
            "toPlace": to_place,
        }

        if is_ferry:
            from_quay_id = (from_place_raw.get("quay") or {}).get("stopPlace", {}).get("id")
            to_quay_id = (to_place_raw.get("quay") or {}).get("stopPlace", {}).get("id")
            legs.append({**base, "mode": "water", "fromQuayId": from_quay_id, "toQuayId": to_quay_id})
        else:
            legs.append({**base, "mode": "car"})

    return {
        "expectedStartTime": pattern.get("expectedStartTime"),
        "expectedEndTime": pattern.get("expectedEndTime"),
        "duration": pattern.get("duration"),
        "distance": pattern.get("distance"),
        "legs": legs,
    }


def _compute_margin_minutes(departure_time_str, arrival_time_str):
    """
    Signed margin in minutes: positive = arrives before departure (buffer), negative = will miss.
    """
    try:
        dep = datetime.fromisoformat(departure_time_str.replace("Z", "+00:00"))
        arr = datetime.fromisoformat(arrival_time_str.replace("Z", "+00:00"))
        return int((dep - arr).total_seconds() / 60)
    except (ValueError, AttributeError):
        return None


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

    stop_place = departure_data[0]
    estimated_calls = stop_place.get("estimatedCalls", [])

    if not estimated_calls:
        return departures_by_destination

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

            is_first_reachable = False
            if (
                route
                and route.get("expectedEndTime")
                and departure.get("expectedDepartureTime")
            ):
                if destination not in first_reachable_departures and departure.get(
                    "expectedDepartureTime"
                ) >= route.get("expectedEndTime"):
                    first_reachable_departures[destination] = departure.get(
                        "expectedDepartureTime"
                    )
                    is_first_reachable = True
                elif destination in first_reachable_departures:
                    is_first_reachable = (
                        departure.get("expectedDepartureTime")
                        == first_reachable_departures[destination]
                    )

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

            if destination not in departures_by_destination:
                departures_by_destination[destination] = []

            arrival_time = route.get("expectedEndTime") if route else None
            margin_minutes = (
                _compute_margin_minutes(departure.get("expectedDepartureTime"), arrival_time)
                if arrival_time
                else None
            )

            departures_by_destination[destination].append(
                {
                    "expectedDepartureTime": departure.get("expectedDepartureTime"),
                    "realtime": departure.get("realtime", False),
                    "journey": journey,
                    "relevant": False,
                    "isFirstReachable": is_first_reachable,
                    "marginMinutes": margin_minutes,
                }
            )

    for destination in departures_by_destination:
        departures_by_destination[destination].sort(
            key=lambda x: x["expectedDepartureTime"]
        )
        for i in range(len(departures_by_destination[destination])):
            departures_by_destination[destination][i]["relevant"] = i < 4

    return departures_by_destination
