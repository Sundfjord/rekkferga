from datetime import datetime, timedelta
from typing import Any

from departures_domain import evaluate_ferry_departures


def _parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def _recompute_canonical_totals(
    legs: list[dict[str, Any]], start_time: datetime | None
) -> tuple[int, int, int]:
    if not start_time:
        return (
            sum((leg.get("duration") or 0) for leg in legs),
            0,
            sum((leg.get("duration") or 0) for leg in legs),
        )

    cursor = start_time
    travel_seconds = 0
    wait_seconds = 0

    for leg in legs:
        duration = int(leg.get("duration") or 0)
        travel_seconds += duration

        if leg.get("mode") == "water":
            selected_departure = leg.get("selectedDeparture") or {}
            departure_time = _parse_iso(selected_departure.get("expectedDepartureTime"))
            if departure_time and departure_time > cursor:
                wait = int((departure_time - cursor).total_seconds())
                wait_seconds += wait
                cursor = departure_time + timedelta(seconds=duration)
                continue

        # If we don't have a selected departure, preserve schedule gap semantics.
        start_time_for_leg = _parse_iso(leg.get("expectedStartTime"))
        if start_time_for_leg and start_time_for_leg > cursor:
            wait_seconds += int((start_time_for_leg - cursor).total_seconds())
        cursor = cursor + timedelta(seconds=duration)

    return travel_seconds, wait_seconds, travel_seconds + wait_seconds


def _prune_journey_for_client(journey: dict[str, Any]) -> dict[str, Any]:
    allowed_journey_fields = {"expectedEndTime", "duration", "legs"}
    allowed_leg_fields = {
        "mode",
        "duration",
        "distance",
        "fromPlace",
        "toPlace",
        "fromQuayId",
        "toQuayId",
        "departures",
        "geometry",
    }
    allowed_place_fields = {"name", "latitude", "longitude"}

    pruned_legs = []
    for leg in journey.get("legs", []):
        pruned_leg = {k: v for k, v in leg.items() if k in allowed_leg_fields}

        from_place = leg.get("fromPlace") or {}
        to_place = leg.get("toPlace") or {}
        pruned_leg["fromPlace"] = {
            k: v for k, v in from_place.items() if k in allowed_place_fields
        }
        pruned_leg["toPlace"] = {
            k: v for k, v in to_place.items() if k in allowed_place_fields
        }
        pruned_legs.append(pruned_leg)

    pruned = {k: v for k, v in journey.items() if k in allowed_journey_fields}
    pruned["legs"] = pruned_legs
    return pruned


def hydrate_destination_journey(journey: dict[str, Any]) -> dict[str, Any]:
    legs = journey.get("legs", [])
    start_time = _parse_iso(journey.get("expectedStartTime")) or datetime.now().astimezone()
    cursor = start_time

    for leg in legs:
        duration = int(leg.get("duration") or 0)
        if leg.get("mode") != "water":
            cursor += timedelta(seconds=duration)
            continue

        arrival_time_iso = _iso(cursor)
        ferry_data = evaluate_ferry_departures(
            leg.get("fromQuayId"),
            leg.get("toQuayId"),
            arrival_time_iso,
        )
        leg["departures"] = ferry_data["departures"]
        leg["selectedDeparture"] = ferry_data["selectedDeparture"]

        selected_departure_time = _parse_iso(
            (ferry_data["selectedDeparture"] or {}).get("expectedDepartureTime")
        )
        if selected_departure_time and selected_departure_time > cursor:
            cursor = selected_departure_time
        cursor += timedelta(seconds=duration)

    travel_seconds, wait_seconds, total_seconds = _recompute_canonical_totals(
        legs, start_time
    )
    journey["travelDurationSeconds"] = travel_seconds
    journey["waitDurationSeconds"] = wait_seconds
    journey["totalDurationSeconds"] = total_seconds
    journey["duration"] = total_seconds
    journey["expectedEndTime"] = _iso(start_time + timedelta(seconds=total_seconds))
    return _prune_journey_for_client(journey)
