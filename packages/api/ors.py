import logging
import requests
import os

logger = logging.getLogger(__name__)

base_url = "https://api.openrouteservice.org"
api_key = os.getenv("ORS_API_KEY")


def get_locations_ors(query: str | None, size: int = 5):
    """Fallback to ORS geocoding if Nominatim fails"""
    if not query or not api_key:
        return []

    try:
        url = f"{base_url}/geocode/autocomplete?api_key={api_key}&text={query}&size={size}&boundary.country=NO&lang=no"
        response = requests.get(url)
        if response.status_code != 200:
            return []
        data = response.json()
        if "features" not in data:
            return []
        results = []
        for feature in data["features"]:
            if "properties" in feature and "label" in feature["properties"]:
                label = feature["properties"].get("label", "")
                region = feature["properties"].get("region", "")
                municipality = feature["properties"].get("localadmin", "")
                if not municipality and not region:
                    continue
                if "," in label:
                    name = label.split(",", 1)[0].strip()
                else:
                    name = label
                    sub_name = ""

                if municipality == name.strip():
                    sub_name = f"{region}"
                else:
                    sub_name = f"{municipality}, {region}"

                results.append(
                    {
                        "id": feature.get("id", ""),
                        "name": name,
                        "sub_name": sub_name,
                        "latitude": feature["geometry"]["coordinates"][1],
                        "longitude": feature["geometry"]["coordinates"][0],
                        "type": "location",
                    }
                )
        return results
    except Exception:
        logger.exception("ORS fallback error")
        return []
