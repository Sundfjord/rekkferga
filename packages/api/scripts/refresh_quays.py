#!/usr/bin/env python3
"""Refresh the committed ferry-quay snapshot from Vegvesen NVDB.

Fetches the full quay list from ferry.atlas.vegvesen.no and writes it verbatim to
``packages/api/data/quays.json``. The raw payload is stored so that the git diff of
each refresh is meaningful; ``quays.py`` is responsible for projecting it for clients.

The endpoint requires an ``X-System-ID`` request header (any non-empty value) and
serves the vendor media type ``application/vnd.svv.v1+json`` — do NOT send
``Accept: application/json`` or it answers 406.

On any non-200 response the existing snapshot is left untouched, so a Vegvesen
outage can never corrupt the committed data. Run by hand or via the scheduled
GitHub Actions workflow (.github/workflows/refresh-quays.yml).

It also writes ``data/quay_departures.json``: each quay's average number of departures
per day over the coming week, from EnTur. It feeds the popularity part of the home-page
quay suggestions (``suggestQuays`` in shared/utils). An EnTur failure leaves that file
untouched too.
"""

import json
import os
import sys
from datetime import datetime, timezone

import requests

QUAYS_URL = "https://ferry.atlas.vegvesen.no/quays"
SYSTEM_ID = os.environ.get("VEGVESEN_SYSTEM_ID", "rekkferga")
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "quays.json")
DEPARTURES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "quay_departures.json")

ENTUR_URL = "https://api.entur.io/journey-planner/v3/graphql"
ENTUR_HEADERS = {"ET-Client-Name": "rekkferga_app"}
WEEK_SECONDS = 7 * 24 * 3600
BATCH = 25
DEPARTURES_QUERY = """
query ($ids: [String], $start: DateTime, $range: Int) {
  stopPlaces(ids: $ids) {
    id
    estimatedCalls(startTime: $start, timeRange: $range, numberOfDepartures: 2000) { aimedDepartureTime }
  }
}
"""


def fetch_quays() -> dict:
    resp = requests.get(QUAYS_URL, headers={"X-System-ID": SYSTEM_ID}, timeout=30)
    resp.raise_for_status()
    return resp.json()


def fetch_daily_departures(quay_ids: list[str]) -> dict[str, float]:
    """Average departures per day over the next 7 days (a full week evens out weekday and
    weekend timetables), keyed by quay id. Raises on any EnTur error."""
    start = datetime.now(timezone.utc).replace(hour=3, minute=0, second=0, microsecond=0).isoformat()
    daily: dict[str, float] = {}
    for i in range(0, len(quay_ids), BATCH):
        variables = {"ids": quay_ids[i : i + BATCH], "start": start, "range": WEEK_SECONDS}
        resp = requests.post(
            ENTUR_URL, json={"query": DEPARTURES_QUERY, "variables": variables}, headers=ENTUR_HEADERS, timeout=60
        )
        resp.raise_for_status()
        body = resp.json()
        if body.get("errors"):
            raise RuntimeError(body["errors"])
        for stop in body["data"]["stopPlaces"]:
            if stop:
                daily[stop["id"]] = round(len(stop["estimatedCalls"]) / 7, 1)
    return daily


def write_json(path: str, data) -> None:
    out_path = os.path.abspath(path)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2, sort_keys=True)
        fh.write("\n")


def main() -> int:
    try:
        data = fetch_quays()
    except Exception as exc:  # noqa: BLE001 - script entrypoint, report and bail
        print(f"refresh_quays: fetch failed, leaving snapshot untouched: {exc}", file=sys.stderr)
        return 1

    quays = data.get("quays")
    if not isinstance(quays, list) or not quays:
        print("refresh_quays: response had no quays, leaving snapshot untouched", file=sys.stderr)
        return 1

    write_json(DATA_PATH, data)
    print(f"refresh_quays: wrote {len(quays)} quays to {os.path.abspath(DATA_PATH)}")

    try:
        daily = fetch_daily_departures([q["id"] for q in quays if q.get("id")])
    except Exception as exc:  # noqa: BLE001
        print(f"refresh_quays: EnTur departures failed, leaving {DEPARTURES_PATH} untouched: {exc}", file=sys.stderr)
        return 0
    write_json(DEPARTURES_PATH, daily)
    print(f"refresh_quays: wrote daily departures for {len(daily)} quays")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
