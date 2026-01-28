#!/usr/bin/env python3
import requests
import json

url = 'https://truckflow.site/api/phone-auth/verify-otp'
payload = {
    'phone': '0507771111',
    'otp_code': '951220'
}

response = requests.post(url, json=payload, verify=False)
print(f'Status: {response.status_code}')
try:
    data = response.json()
    print(f'Access Token received: {len(data.get("access_token", ""))} chars')
    print(f'User ID: {data["user"]["id"]}')
    print(f'User Name: {data["user"]["name"]}')
    print(f'Org ID: {data["user"]["org_id"]}')
except Exception as e:
    print(f'Error: {str(e)}')
    print(f'Text: {response.text[:500]}')
