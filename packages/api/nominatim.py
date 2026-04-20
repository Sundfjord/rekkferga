import logging
import requests

logger = logging.getLogger(__name__)


def get_locations_nominatim(query: str | None, size: int = 5):
    """Primary geocoding using Nominatim (better Norwegian coverage)"""
    if not query:
        return []

    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": f"{query}, Norway",
            "format": "json",
            "limit": size,
            "addressdetails": 1,
            "countrycodes": "no",
        }

        response = requests.get(
            url,
            params=params,
            headers={"User-Agent": "Rekkferga/1.0 (https://rekkferga.com)"},
        )

        if response.status_code != 200:
            return []

        data = response.json()
        if not data:
            return []

        results = []
        names = []
        for item in data:
            type = item.get("type", "")
            house_number = item.get("address", {}).get("house_number", "")
            road = item.get("address", {}).get("road", "")
            municipality = item.get("address", {}).get("municipality", "")
            county = item.get("address", {}).get("county", "")

            if type == "house":
                name = f"{road} {house_number}" if house_number else road
            else:
                name = item.get("name", "")

            if not municipality:
                sub_name = county
            elif not county:
                sub_name = municipality
            else:
                sub_name = f"{municipality}, {county}"

            if f"{name} {sub_name}" in names:
                continue

            results.append(
                {
                    "id": item.get("place_id", ""),
                    "name": name,
                    "subName": sub_name,
                    "latitude": float(item.get("lat", 0)),
                    "longitude": float(item.get("lon", 0)),
                }
            )
            names.append(f"{name} {sub_name}")

        return results

    except Exception:
        logger.exception("Nominatim error")
        return []
