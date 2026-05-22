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
"""

import json
import os
import sys

import requests

QUAYS_URL = "https://ferry.atlas.vegvesen.no/quays"
SYSTEM_ID = os.environ.get("VEGVESEN_SYSTEM_ID", "rekkferga")
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "quays.json")


def fetch_quays() -> dict:
    resp = requests.get(QUAYS_URL, headers={"X-System-ID": SYSTEM_ID}, timeout=30)
    resp.raise_for_status()
    return resp.json()


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

    out_path = os.path.abspath(DATA_PATH)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2, sort_keys=True)
        fh.write("\n")

    print(f"refresh_quays: wrote {len(quays)} quays to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
