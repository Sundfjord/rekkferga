import azure.functions as func
import requests
import psycopg2
import psycopg2.extras
import time
import json
import os
import logging
from dotenv import load_dotenv
from nma import get_mapped_counties, get_mapped_municipalities

load_dotenv()

app = func.FunctionApp()


@app.schedule(
    schedule="0 0 0 * * 1", arg_name="myTimer", run_on_startup=True, use_monitor=False
)
def fergoCron(myTimer: func.TimerRequest) -> None:
    DATABASE_URL = os.environ["DATABASE_URL"]
    conn = psycopg2.connect(DATABASE_URL)

    start = time.time()
    logging.info("Started importing quays.")

    url = "https://ferry.atlas.vegvesen.no/quays"
    headers = {"X-System-ID": "fergo-cron"}
    response = requests.get(url, headers=headers)
    print(f"Response status: {response.status_code}")

    if response.status_code != 200:
        logging.error(
            f"Failed to fetch quays data: {response.status_code} - {response.text}"
        )
        conn.close()
        return

    print(f"Response content: {response.text[:500]}...")
    response_json = json.loads(response.text)

    if "quays" in response_json:
        quays_data = response_json["quays"]
        print(f"Found {len(quays_data)} quays in response")
    else:
        logging.error("No 'quays' array found in response")
        conn.close()
        return

    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM quays")
        current_count = cur.fetchone()[0]

    if current_count == len(quays_data):
        logging.info("Finished importing quays. No changes performed.\n")
        conn.close()
        return

    counties = get_mapped_counties()
    municipalities = get_mapped_municipalities()
    print(f"Found {len(counties)} counties and {len(municipalities)} municipalities")

    rows = []
    for quay in quays_data:
        rows.append((
            quay["id"],
            quay["name"],
            municipalities.get(str(quay["location"]["municipalities"][0]["code"]), ""),
            counties.get(str(quay["location"]["counties"][0]["code"]), ""),
            quay["location"]["geometry"]["coordinates"][1],
            quay["location"]["geometry"]["coordinates"][0],
            quay["relatedQuayIds"],
        ))

    with conn.cursor() as cur:
        cur.execute("TRUNCATE TABLE quays")
        psycopg2.extras.execute_values(
            cur,
            "INSERT INTO quays (id, name, municipality, region, latitude, longitude, related_quay_ids) VALUES %s",
            rows,
        )
    conn.commit()
    conn.close()

    end = time.time()
    logging.info(
        f"Finished importing {len(quays_data)} quays in {'{:.2f}'.format(end - start)}s.\n"
    )
