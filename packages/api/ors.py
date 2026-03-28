# All route calculation functions (ORS/OSRM) have been removed as requested.
# Only geocoding functions are kept if still used elsewhere in the project.

import requests
import os

base_url = "https://api.openrouteservice.org"
api_key = os.getenv("ORS_API_KEY")


def get_trip_to_nsr_id(location_coords, quay_coords):
    user_lat, user_lng = location_coords.split(",")
    quay_lat, quay_lng = quay_coords.split(",")
    url = f"{base_url}/v2/directions/driving-car?api_key={api_key}&start={user_lat},{user_lng}&end={quay_lat},{quay_lng}"
    response = requests.get(url)
    return response.json()


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
    except Exception as e:
        print(f"ORS fallback error: {e}")
        return []
