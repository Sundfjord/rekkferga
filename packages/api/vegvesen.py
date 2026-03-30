import requests
import urllib.parse
import threading
from cachetools import TTLCache, cached
from datetime import datetime
from util import format_datetime_for_api

VEGVESEN_API_URL = "https://ferry.atlas.vegvesen.no"
KARTVERKET_API_URL = "https://api.kartverket.no/kommuneinfo/v1"

headers = {
    "X-System-ID": "rekkferga",
}

_counties_cache = TTLCache(maxsize=1, ttl=86400)
_counties_lock = threading.Lock()

_municipalities_cache = TTLCache(maxsize=1, ttl=86400)
_municipalities_lock = threading.Lock()

_vegvesen_quays_cache = TTLCache(maxsize=1, ttl=3600)
_vegvesen_quays_lock = threading.Lock()


@cached(cache=_counties_cache, lock=_counties_lock)
def _get_counties():
    response = requests.get(
        f"{KARTVERKET_API_URL}/fylker",
        headers={"Content-Type": "application/json"},
    )
    return {c["fylkesnummer"]: c["fylkesnavn"] for c in response.json()}


@cached(cache=_municipalities_cache, lock=_municipalities_lock)
def _get_municipalities():
    response = requests.get(
        f"{KARTVERKET_API_URL}/kommuner",
        headers={"Content-Type": "application/json"},
    )
    return {m["kommunenummer"]: m["kommunenavn"] for m in response.json()}


@cached(cache=_vegvesen_quays_cache, lock=_vegvesen_quays_lock)
def get_vegvesen_quay_list():
    """
    Fetch all ferry quays from Vegvesen, enriched with Kartverket municipality/region names.
    Returns a dict keyed by NSR ID. Cached for 1 hour.
    """
    response = requests.get(f"{VEGVESEN_API_URL}/quays", headers=headers)
    if not response.ok:
        return {}

    quays_data = response.json().get("quays", [])
    counties = _get_counties()
    municipalities = _get_municipalities()

    result = {}
    for quay in quays_data:
        try:
            location = quay.get("location", {})
            coords = location.get("geometry", {}).get("coordinates", [0, 0])
            muni_list = location.get("municipalities", [])
            county_list = location.get("counties", [])
            municipality = municipalities.get(str(muni_list[0]["code"]), "") if muni_list else ""
            region = counties.get(str(county_list[0]["code"]), "") if county_list else ""
            result[quay["id"]] = {
                "id": quay["id"],
                "name": quay["name"],
                "municipality": municipality,
                "region": region,
                "latitude": coords[1],
                "longitude": coords[0],
                "relatedQuayIds": quay.get("relatedQuayIds", []),
            }
        except (KeyError, IndexError):
            continue

    return result


def get_vegvesen_quay(nsr_id):
    """Look up a single quay by NSR ID from the cached Vegvesen list."""
    return get_vegvesen_quay_list().get(nsr_id)


def get_departures_from_vegvesen(quay, route=None):
    """
    Get departures from a quay to its related quays using the Vegvesen API.

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
    print(start_time)
    departures = get_departures_by_destination_quay(quay, start_time)
    return process_departures(departures, route)


def get_departures_by_destination_quay(quay, from_datetime, size=10):
    """
    Get departures an NSR ID and its related quays using the Vegvesen Ferry API.

    Args:
        quay: Starting NSR ID
        from_datetime: Start datetime (ISO string or datetime object)
        size: Number of departures to return

    Returns:
        List of departure objects
    """
    # URL encode the datetime parameter to ensure + character is preserved
    encoded_datetime = urllib.parse.quote(str(from_datetime))

    vegvesen_departures = {}
    for destination_quay_id in quay.get("relatedQuayIds", []):
        try:
            url = f"{VEGVESEN_API_URL}/departures?from={quay['id']}&to={destination_quay_id}&fromDateTime={encoded_datetime}&size={size}"
            response = requests.get(url, headers=headers)

            if not response.ok:
                result = []
            else:
                json_response = response.json()
                result = (
                    json_response["departures"] if "departures" in json_response else []
                )
            vegvesen_departures[destination_quay_id] = result
        except Exception as e:
            print(f"Error calling Vegvesen API for {destination_quay_id}: {e}")
            result = []
        finally:
            vegvesen_departures[destination_quay_id] = result

    return vegvesen_departures


def process_departures(departure_list, route=None):
    """
    Process Vegvesen departure data and return standardized departure objects.

    Args:
        departure_list: Raw departure data from Vegvesen API
        route: Route information for determining relevant departures

    Returns:
        Dictionary of departures grouped by destination with relevant marking
    """
    departures_by_destination = {}

    for quayId, departures in departure_list.items():
        # Track first reachable departure per destination
        first_reachable_departures = {}

        for i, departure in enumerate(departures):
            legs = departure["legs"][0]
            destination = legs["toQuay"]["name"]

            if destination:
                # Check if this is the first reachable departure for this destination
                is_first_reachable = False
                if (
                    route
                    and route.get("expectedEndTime")
                    and departure.get("scheduledDepartureTime")
                ):
                    if destination not in first_reachable_departures and departure.get(
                        "scheduledDepartureTime"
                    ) > route.get("expectedEndTime"):
                        first_reachable_departures[destination] = departure.get(
                            "scheduledDepartureTime"
                        )
                        is_first_reachable = True
                    elif destination in first_reachable_departures:
                        # Check if this departure is the first reachable one
                        is_first_reachable = (
                            departure.get("scheduledDepartureTime")
                            == first_reachable_departures[destination]
                        )

                # Build journey array efficiently
                journey = []

                # Add starting quay
                journey.append(
                    {
                        "time": legs["fromQuay"]["scheduledDepartureTime"],
                        "realtime": False,
                        "stopPlaceName": legs["fromQuay"]["name"],
                    }
                )

                # Add intermediate stops
                journey.extend(
                    [
                        {
                            "time": stop["scheduledDepartureTime"],
                            "realtime": False,
                            "stopPlaceName": stop["name"],
                        }
                        for stop in legs.get("intermediateStops", [])
                    ]
                )

                # Add destination quay
                journey.append(
                    {
                        "time": legs["toQuay"]["scheduledDepartureTime"],
                        "realtime": False,
                        "stopPlaceName": legs["toQuay"]["name"],
                    }
                )

                # Initialize destination array if needed and add departure
                if destination not in departures_by_destination:
                    departures_by_destination[destination] = []

                departures_by_destination[destination].append(
                    {
                        "expectedDepartureTime": departure["scheduledDepartureTime"],
                        "realtime": False,
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
