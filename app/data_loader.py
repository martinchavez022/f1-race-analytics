
import os
import requests
import pandas as pd

from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("BASE_API_URL")

def fetch_data(endpoint, params=None):
    """
    This functions fetch data from the API.
    And return as a Dataframe.

    Args:
        endpoint (str): API endpoint
        params (dict): Optional query parameters for the api.
    """
    if params is None: 
        params = {}
    url = f"{BASE_URL}{endpoint}"
    full_url = requests.Request('GET', url, params=params).prepare().url
    response = requests.get(full_url)
    response.raise_for_status()
    return pd.DataFrame(response.json())


