from urllib.request import urlopen
import json
import pandas as pd


response = urlopen('https://api.openf1.org/v1/drivers?driver_number=1&session_key=9158')
data = json.loads(response.read().decode('utf-8'))

df = pd.DataFrame(data)
print(df)

