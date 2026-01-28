import requests
import json

url = "https://truckflow.site/api/phone-auth/login-with-password"
payload = {
    "phone": "0507771111",
    "password": "Admin@2026"
}

try:
    response = requests.post(url, json=payload, verify=False)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
