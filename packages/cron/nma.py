import requests

base_url = "https://api.kartverket.no/kommuneinfo/v1"
headers = {
    "Content-Type": "application/json",
}


def get_mapped_counties():
    response = requests.get(base_url + "/fylker", headers=headers)
    result = response.json()
    counties = {}
    for county in result:
        counties[county["fylkesnummer"]] = county["fylkesnavn"]

    return counties


def get_mapped_municipalities():
    response = requests.get(base_url + "/kommuner", headers=headers)
    result = response.json()
    municipalities = {}
    for municipality in result:
        municipalities[municipality["kommunenummer"]] = municipality["kommunenavn"]

    return municipalities
