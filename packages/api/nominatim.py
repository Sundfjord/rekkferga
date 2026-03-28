import requests


def get_locations_nominatim(query: str | None, size: int = 5):
    """Primary geocoding using Nominatim (better Norwegian coverage)"""
    if not query:
        return []

    try:
        url = f"https://nominatim.openstreetmap.org/search"
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
            headers={
                "User-Agent": "FergoApp/1.0 (https://github.com/your-repo; your-email@example.com)"
            },
        )

        if response.status_code == 200:
            data = response.json()

            print(f"Nominatim response: {data}")

            if data:  # If we got results from Nominatim
                results = []
                names = []
                for item in data:
                    type = item.get("type", "")
                    name = ""
                    sub_name = ""
                    house_number = item.get("address", {}).get("house_number", "")
                    road = item.get("address", {}).get("road", "")
                    municipality = item.get("address", {}).get("municipality", "")
                    county = item.get("address", {}).get("county", "")

                    if type == "house":
                        name = f"{road} {house_number}" if house_number else road
                    else:
                        name = item.get("name", "")
                    # elif type in ["town", "administrative", "island", "hamlet"]:

                    if not municipality:
                        sub_name = f"{county}"
                    elif not county:
                        sub_name = f"{municipality}"
                    else:
                        sub_name = f"{municipality}, {county}"

                    # Check if name and sub_name together already exist in results
                    if f"{name} {sub_name}" in names:
                        continue

                    results.append(
                        {
                            "id": item.get("place_id", ""),
                            "name": name,
                            "sub_name": sub_name,
                            "latitude": float(item.get("lat", 0)),
                            "longitude": float(item.get("lon", 0)),
                            "type": "location",
                        }
                    )
                    names.append(f"{name} {sub_name}")
                return results

    except Exception as e:
        print(f"Nominatim error: {e}")
        return []

    return []
