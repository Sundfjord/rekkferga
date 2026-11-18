import logging
import requests
from datetime import datetime

logger = logging.getLogger(__name__)

base_url = "https://api.entur.io/journey-planner/v3/graphql"
headers = {"Content-Type": "application/json", "ET-Client-Name": "rekkferga_app"}
# Never wait on EnTur indefinitely: a hung call would tie up a gunicorn worker thread.
TIMEOUT_SECONDS = 10


def query_journey_planner(query, variables=None):
    try:
        response = requests.post(
            base_url,
            json={"query": query, "variables": variables or {}},
            headers=headers,
            timeout=TIMEOUT_SECONDS,
        )
        return response.json()
    except Exception as e:
        logger.exception("Error in query_journey_planner")
        return {"errors": [{"message": str(e)}]}


def get_departures_from_nsr_id(nsr_id, start_time=None, number_of_departures=4):
    query = """
        query ($ids: [String], $startTime: DateTime, $numberOfDepartures: Int) {
            stopPlaces(ids: $ids) {
                id,
                estimatedCalls(numberOfDepartures: $numberOfDepartures, startTime: $startTime) {
                    realtime
                    aimedDepartureTime
                    expectedDepartureTime
                    serviceJourney {
                        estimatedCalls {
                            quay {
                                stopPlace {
                                    id
                                    name
                                }
                            }
                        }
                        passingTimes {
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
    variables = {
        "ids": [nsr_id],
        "startTime": start_time,
        "numberOfDepartures": number_of_departures,
    }
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

    wait_duration = 0
    previous_end = None
    for leg in pattern.get("legs", []):
        start_time = leg.get("expectedStartTime")
        if previous_end and start_time:
            margin = compute_margin_minutes(start_time, previous_end)
            if margin and margin > 0:
                wait_duration += margin * 60
        previous_end = leg.get("expectedEndTime") or previous_end

    travel_duration = sum((leg.get("duration") or 0) for leg in pattern.get("legs", []))
    total_duration = travel_duration + wait_duration

    return {
        "expectedStartTime": pattern.get("expectedStartTime"),
        "expectedEndTime": pattern.get("expectedEndTime"),
        "duration": total_duration,
        "travelDurationSeconds": travel_duration,
        "waitDurationSeconds": wait_duration,
        "totalDurationSeconds": total_duration,
        "distance": pattern.get("distance"),
        "legs": legs,
    }


def compute_margin_minutes(departure_time_str, arrival_time_str):
    """
    Signed margin in minutes: positive = arrives before departure (buffer), negative = will miss.
    """
    try:
        dep = datetime.fromisoformat(departure_time_str.replace("Z", "+00:00"))
        arr = datetime.fromisoformat(arrival_time_str.replace("Z", "+00:00"))
        return int((dep - arr).total_seconds() / 60)
    except (ValueError, AttributeError):
        return None
