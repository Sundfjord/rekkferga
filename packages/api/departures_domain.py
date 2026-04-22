from typing import Any

from journey_planner import get_departures_from_entur


def select_departure(departures: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not departures:
        return None
    reachable = next(
        (
            dep
            for dep in departures
            if dep.get("marginMinutes") is not None and dep.get("marginMinutes") >= 0
        ),
        None,
    )
    return reachable or departures[0]


def evaluate_ferry_departures(
    from_quay_id: str | None, to_quay_id: str | None, arrival_time_iso: str
) -> dict[str, Any]:
    if not from_quay_id or not to_quay_id:
        return {
            "departures": [],
            "selectedDeparture": None,
        }

    departures = get_departures_from_entur(
        {"id": from_quay_id},
        {"expectedEndTime": arrival_time_iso},
        to_quay_id,
    )
    selected_departure = select_departure(departures)

    return {
        "departures": departures,
        "selectedDeparture": selected_departure,
    }
