import logging
import requests

from journey_planner import headers as ENTUR_HEADERS
from nominatim import get_locations_nominatim

logger = logging.getLogger(__name__)

AUTOCOMPLETE_URL = "https://api.entur.io/geocoder/v1/autocomplete"
TIMEOUT_SECONDS = 5


def _sub_name(props: dict) -> str:
    locality = props.get("locality") or ""
    county = props.get("county") or ""
    if locality and county and locality != county:
        return f"{locality}, {county}"
    return locality or county


def _from_feature(feature: dict) -> dict | None:
    props = feature.get("properties") or {}
    coords = (feature.get("geometry") or {}).get("coordinates") or []
    if len(coords) < 2 or not props.get("name"):
        return None
    lng, lat = coords[0], coords[1]
    return {
        "id": props.get("id") or f"{lat},{lng}",
        "name": props["name"],
        "subName": _sub_name(props),
        "latitude": float(lat),
        "longitude": float(lng),
    }


def search_locations(
    query: str | None,
    size: int = 10,
    focus: tuple[float, float] | None = None,
) -> list[dict]:
    """Prefix-aware place search for type-ahead (EnTur geocoder, Norway-focused).

    Nominatim is only a fallback when EnTur has no hits: it does whole-word matching
    (so partial input like "ber" returns nothing) and its usage policy disallows
    autocomplete-style traffic."""
    if not query or not query.strip():
        return []

    params: dict = {"text": query.strip(), "size": size, "lang": "no"}
    if focus:
        params["focus.point.lat"], params["focus.point.lon"] = focus

    results: list[dict] = []
    try:
        response = requests.get(
            AUTOCOMPLETE_URL, params=params, headers=ENTUR_HEADERS, timeout=TIMEOUT_SECONDS
        )
        response.raise_for_status()
        seen: set[str] = set()
        for feature in response.json().get("features", []):
            item = _from_feature(feature)
            if not item:
                continue
            key = f"{item['name']}|{item['subName']}"
            if key in seen:
                continue
            seen.add(key)
            results.append(item)
    except Exception:
        logger.exception("EnTur geocoder error")

    return results or get_locations_nominatim(query, size)
