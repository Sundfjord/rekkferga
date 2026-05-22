from typing import Any

from journey_planner import (
    get_departures_from_entur,
    get_departures_from_nsr_id,
    _compute_margin_minutes,
    _extract_via_names,
)
from quays import related_quay_ids, quay_name
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


def _call_id(call: dict[str, Any]) -> str | None:
    return ((call.get("quay") or {}).get("stopPlace") or {}).get("id")


def _call_name(call: dict[str, Any]) -> str | None:
    return ((call.get("quay") or {}).get("stopPlace") or {}).get("name")


def _resolve_destination(
    sequence: list[dict[str, Any]], from_quay_id: str, related: set[str]
) -> tuple[str | None, str | None]:
    """Pick the destination quay a departure serves: the first downstream call that is a
    related (connected) quay, falling back to the service journey's terminal stop."""
    from_index = next(
        (i for i, c in enumerate(sequence) if _call_id(c) == from_quay_id), -1
    )
    downstream = sequence[from_index + 1 :] if from_index >= 0 else sequence
    if not downstream:
        return None, None
    for call in downstream:
        if _call_id(call) in related:
            return _call_id(call), _call_name(call)
    terminal = downstream[-1]
    return _call_id(terminal), _call_name(terminal)


def _build_labeled_departures(
    raw_stop_places: list[dict[str, Any]],
    from_quay_id: str,
    related: set[str],
    arrival_time_iso: str | None,
) -> list[dict[str, Any]]:
    """Turn raw EnTur stop-place data into departures labeled with the destination quay
    they serve. Used for the quay-centric view where a quay may have several crossings."""
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

        dest_id, dest_name = _resolve_destination(sequence, from_quay_id, related)
        if not dest_id:
            continue

        dep_time = departure.get("expectedDepartureTime")
        margin = (
            _compute_margin_minutes(dep_time, arrival_time_iso)
            if arrival_time_iso
            else None
        )
        departures.append(
            {
                "expectedDepartureTime": dep_time,
                "realtime": departure.get("realtime", False),
                "marginMinutes": margin,
                "destinationQuayId": dest_id,
                "destinationName": quay_name(dest_id) or dest_name,
                "viaNames": _extract_via_names(passing_times, from_quay_id, dest_id),
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

    related = set(related_quay_ids(from_quay_id))
    start_time = (
        format_datetime_for_api(arrival_time_iso, subtract_minutes=5)
        if arrival_time_iso
        else format_datetime_for_api(None)
    )
    raw = get_departures_from_nsr_id(
        from_quay_id, start_time, number_of_departures=max(limit * 3, 12)
    )
    labeled = _build_labeled_departures(raw, from_quay_id, related, arrival_time_iso)

    visible = [
        d
        for d in labeled
        if d["marginMinutes"] is None or d["marginMinutes"] >= _VISIBILITY_THRESHOLD_MINUTES
    ]
    visible.sort(key=lambda d: d["expectedDepartureTime"] or "")
    visible = visible[:limit]

    selected = select_departure(visible)
    return {"departures": visible, "selectedDeparture": selected}
