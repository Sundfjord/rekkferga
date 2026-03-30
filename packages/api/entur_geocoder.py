import requests
import threading
from cachetools import TTLCache, cached

GEOCODER_URL = "https://api.entur.io/geocoder/v1"
headers = {"ET-Client-Name": "miles-fergo_app"}

_search_cache = TTLCache(maxsize=100, ttl=120)
_search_lock = threading.Lock()


@cached(cache=_search_cache, lock=_search_lock)
def search_ferry_stops(query):
    """
    Search for ferry stops by name using the EnTur Geocoder API.
    Returns list of quay result dicts shaped identically to search results.
    Cached for 120 seconds.
    """
    try:
        response = requests.get(
            f"{GEOCODER_URL}/autocomplete",
            params={"text": query, "categories": "ferryStop", "lang": "en"},
            headers=headers,
        )
        if not response.ok:
            return []
        features = response.json().get("features", [])
        results = []
        for feature in features:
            props = feature.get("properties", {})
            coords = feature.get("geometry", {}).get("coordinates", [0, 0])
            nsr_id = props.get("id", "")
            if not nsr_id.startswith("NSR:StopPlace:"):
                continue
            locality = props.get("locality", "")
            county = props.get("county", "")
            sub_name = ", ".join(filter(None, [locality, county]))
            results.append({
                "id": nsr_id,
                "name": props.get("name", ""),
                "sub_name": sub_name,
                "latitude": coords[1],
                "longitude": coords[0],
                "type": "quay",
            })
        return results
    except Exception as e:
        print(f"Error in search_ferry_stops: {str(e)}")
        return []
