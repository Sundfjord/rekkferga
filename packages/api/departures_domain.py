from typing import Any

from journey_planner import get_departures_from_entur

# Departures with margin below this threshold are excluded from the response.
# See docs/business-rules.md — "Departure visibility window".
_VISIBILITY_THRESHOLD_MINUTES = -5


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

    all_departures = get_departures_from_entur(
        {"id": from_quay_id},
        {"expectedEndTime": arrival_time_iso},
        to_quay_id,
    )

    # Remove departures that are too far past the visibility window.
    # Departures with null margin (no timing data) are kept as-is.
    visible = [
        d for d in all_departures
        if d.get("marginMinutes") is None or d.get("marginMinutes") >= _VISIBILITY_THRESHOLD_MINUTES
    ]

    selected = select_departure(visible)

    # If the selected departure has plenty of margin, only return that one —
    # there is no need to show an alternative yet.
    if selected and (selected.get("marginMinutes") or 0) >= 10:
        visible = [selected]

    return {
        "departures": visible,
        "selectedDeparture": selected,
    }
