import azure.functions as func
import requests
import time
import json
import os
import logging
from azure.cosmos import CosmosClient, exceptions
from dotenv import load_dotenv
from nma import get_mapped_counties, get_mapped_municipalities

load_dotenv()

app = func.FunctionApp()


@app.schedule(
    schedule="0 0 0 * * 1", arg_name="myTimer", run_on_startup=True, use_monitor=False
)
def fergoCron(myTimer: func.TimerRequest) -> None:
    CONN_STR = os.environ["COSMOS_CONNECTION_STRING"]
    client = CosmosClient.from_connection_string(conn_str=CONN_STR)
    database = client.get_database_client("fergo-db")
    container = database.get_container_client("quays")

    start = time.time()
    logging.info("Started importing quays.")

    url = "https://ferry.atlas.vegvesen.no/quays"
    headers = {"X-System-ID": "fergo-cron"}  # Add required header
    response = requests.get(url, headers=headers)
    print(f"Response status: {response.status_code}")

    if response.status_code != 200:
        logging.error(
            f"Failed to fetch quays data: {response.status_code} - {response.text}"
        )
        return

    print(
        f"Response content: {response.text[:500]}..."
    )  # Print first 500 chars for debugging
    response_json = json.loads(response.text)

    # The API returns a nested structure with metadata and quays array
    if "quays" in response_json:
        quays_data = response_json["quays"]
        print(f"Found {len(quays_data)} quays in response")
    else:
        logging.error("No 'quays' array found in response")
        return

    try:
        results = container.read_all_items()
    except exceptions.CosmosHttpResponseError:
        print("HTTP Response Error from Cosmos")
        logging.error(
            "Finished importing quays. Failed to fetch existing quays from CosmosDB.\n"
        )
    current_quays = [item for item in results]

    # If fetched number of quays is the same as in DB, do nothing
    if len(current_quays) == len(quays_data):
        logging.info("Finished importing quays. No changes performed.\n")
        return

    # Response from ferry.atlas.vegvesen.no does not contain county or municipality names, so we need to map them
    counties = get_mapped_counties()
    municipalities = get_mapped_municipalities()
    print(f"Found {len(counties)} counties and {len(municipalities)} municipalities")

    # Delete items in the CosmosDB quays container
    for item in container.query_items(
        query="SELECT * FROM quays d", enable_cross_partition_query=True
    ):
        try:
            container.delete_item(item, partition_key=item["id"])
        except exceptions.CosmosResourceNotFoundError:
            logging.error("Finished importing quays. Failed to find CosmosDB resource.")
            return

    # Format and insert new data into CosmosDB quays container
    for quay in quays_data:
        # Create and append row for this quay
        container.upsert_item(
            {
                "id": quay["id"],
                "name": quay["name"],
                "municipality": (
                    municipalities[str(quay["location"]["municipalities"][0]["code"])]
                    if str(quay["location"]["municipalities"][0]["code"])
                    in municipalities
                    else ""
                ),
                "region": (
                    counties[str(quay["location"]["counties"][0]["code"])]
                    if str(quay["location"]["counties"][0]["code"]) in counties
                    else ""
                ),
                "latitude": quay["location"]["geometry"]["coordinates"][1],
                "longitude": quay["location"]["geometry"]["coordinates"][0],
                "relatedQuayIds": quay["relatedQuayIds"],
            }
        )

    # Log
    end = time.time()
    logging.info(
        f"Finished importing {len(quays_data)} quays in {'{:.2f}'.format(end - start)}s.\n"
    )
