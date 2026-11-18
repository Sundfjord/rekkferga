from typing import Any

from journey_planner import get_departures_from_nsr_id, compute_margin_minutes
from quays import quay_name
from util import format_datetime_for_api

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


def _call_id(call: dict[str, Any]) -> str | None:
    return ((call.get("quay") or {}).get("stopPlace") or {}).get("id")


def _call_name(call: dict[str, Any]) -> str | None:
    return ((call.get("quay") or {}).get("stopPlace") or {}).get("name")


def _resolve_route(
    sequence: list[dict[str, Any]], from_quay_id: str
) -> tuple[dict[str, Any] | None, list[dict[str, Any]]]:
    """Where a departure actually ends (the service journey's terminal stop) and the stops it
    calls at on the way, after `from_quay_id`. E.g. from Gjermundshamn on
    Gjermundshamn → Varaldsøy → Årsnes: terminal Årsnes, via [Varaldsøy]."""
    from_index = next(
        (i for i, c in enumerate(sequence) if _call_id(c) == from_quay_id), -1
    )
    downstream = [c for c in sequence[from_index + 1 :] if _call_id(c)]
    if not downstream:
        return None, []
    return downstream[-1], downstream[:-1]


def _build_labeled_departures(
    raw_stop_places: list[dict[str, Any]],
    from_quay_id: str,
    arrival_time_iso: str | None,
) -> list[dict[str, Any]]:
    """Turn raw EnTur stop-place data into departures labeled with their end destination
    and the stops called at on the way (via). A quay may have several crossings; clients
    filter by crossing using destinationQuayId plus viaQuayIds."""
    if not raw_stop_places:
        return []
    estimated_calls = (raw_stop_places[0] or {}).get("estimatedCalls") or []

    departures: list[dict[str, Any]] = []
    for departure in estimated_calls:
        service_journey = departure.get("serviceJourney") or {}
        passing_times = service_journey.get("passingTimes") or []
        # estimatedCalls reflects realtime; passingTimes is the scheduled fallback.
        sequence = service_journey.get("estimatedCalls") or passing_times
        if not sequence:
            continue

        terminal, via = _resolve_route(sequence, from_quay_id)
        if not terminal:
            continue
        dest_id = _call_id(terminal)

        dep_time = departure.get("expectedDepartureTime")
        margin = (
            compute_margin_minutes(dep_time, arrival_time_iso)
            if arrival_time_iso
            else None
        )
        departures.append(
            {
                "expectedDepartureTime": dep_time,
                # Scheduled time; differs from expectedDepartureTime when realtime data moved it.
                "aimedDepartureTime": departure.get("aimedDepartureTime"),
                "realtime": departure.get("realtime", False),
                "marginMinutes": margin,
                "destinationQuayId": dest_id,
                "destinationName": quay_name(dest_id) or _call_name(terminal),
                "viaQuayIds": [_call_id(c) for c in via],
                "viaNames": [quay_name(_call_id(c)) or _call_name(c) for c in via],
            }
        )

    return departures


def evaluate_quay_departures(
    from_quay_id: str | None, arrival_time_iso: str | None, limit: int = 4
) -> dict[str, Any]:
    """Quay-centric departures: all upcoming departures from a quay, each labeled by the
    destination it serves (across the quay's related crossings). toQuayId is not required."""
    if not from_quay_id:
        return {"departures": [], "selectedDeparture": None}

    start_time = (
        format_datetime_for_api(arrival_time_iso, subtract_minutes=5)
        if arrival_time_iso
        else format_datetime_for_api(None)
    )
    raw = get_departures_from_nsr_id(
        from_quay_id, start_time, number_of_departures=max(limit * 3, 12)
    )
    labeled = _build_labeled_departures(raw, from_quay_id, arrival_time_iso)

    visible = [
        d
        for d in labeled
        if d["marginMinutes"] is None or d["marginMinutes"] >= _VISIBILITY_THRESHOLD_MINUTES
    ]
    visible.sort(key=lambda d: d["expectedDepartureTime"] or "")
    visible = visible[:limit]

    selected = select_departure(visible)
    return {"departures": visible, "selectedDeparture": selected}
