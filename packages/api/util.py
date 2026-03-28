from flask import Response
from datetime import datetime, timedelta
import time
import re
import json


def log(text):
    f = open(f"./logs/{datetime.now().date()}.log", "a+")
    f.write(f"{time.strftime('%H:%M:%S')}: {text}\n")
    f.close()


def strip_meta(row):
    stripped = {}
    for prop in row:
        if prop[:1] == "_":
            continue
        stripped[prop] = row[prop]

    return stripped


def is_valid_nsr_id(input):
    pattern = r"NSR:StopPlace:\d+\b(?![a-zA-Z])"
    return bool(re.search(pattern, input))


def cache(data, seconds):
    rsp = Response(json.dumps(data))
    rsp.headers.add("Content-Type", "application/json")
    rsp.headers.add("Cache-Control", f"public,max-age={seconds}")
    return rsp


def format_datetime_for_api(datetime_input, subtract_minutes=0):
    """
    Simple datetime formatting for API compatibility.
    Works for both EnTur and Vegvesen APIs.

    Args:
        datetime_input: ISO datetime string or datetime object
        subtract_minutes: Minutes to subtract (default 0)

    Returns:
        ISO datetime string in format: "2025-09-04T00:00:00+01:00"
    """
    if datetime_input is None:
        dt = datetime.now()
    elif isinstance(datetime_input, str):
        try:
            dt = datetime.fromisoformat(datetime_input.replace("Z", "+00:00"))
        except ValueError:
            dt = datetime.now()
    else:
        dt = datetime_input

    # Ensure timezone info (assume local if none)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.now().astimezone().tzinfo)

    # Subtract minutes if specified
    if subtract_minutes > 0:
        dt = dt - timedelta(minutes=subtract_minutes)

    return dt.isoformat()
