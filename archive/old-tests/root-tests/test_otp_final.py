#!/usr/bin/env python3
import requests
import subprocess
import time

# Send OTP
print('Step 1: Sending OTP to 0507771111...')
r1 = requests.post('https://truckflow.site/api/phone-auth/send-otp', json={'phone': '0507771111'}, verify=False)
print(f'  Response: {r1.status_code}')

# Get OTP code from database
time.sleep(1)
print('\nStep 2: Retrieving OTP code from database...')
result = subprocess.run([
    'ssh', 'root@64.176.173.36',
    'docker exec fleet_db psql -U fleet_user -d fleet_management -c "SELECT otp_code FROM phone_otps ORDER BY created_at DESC LIMIT 1;"'
], capture_output=True, text=True)
otp = result.stdout.split('\n')[2].strip()
print(f'  OTP Code: {otp}')

# Verify OTP and login
print(f'\nStep 3: Verifying OTP code...')
r2 = requests.post('https://truckflow.site/api/phone-auth/verify-otp', 
                  json={'phone': '0507771111', 'otp_code': otp}, 
                  verify=False)
print(f'  Response: {r2.status_code}')

if r2.status_code == 200:
    data = r2.json()
    print(f'\nSUCCESS - Full OTP Authentication Flow Complete!')
    print(f'  User: {data["user"]["name"]}')
    print(f'  User ID: {data["user"]["id"]}')
    print(f'  Org: {data["user"]["org_name"]}')
    print(f'  Role: {data["user"]["org_role"]}')
    print(f'  Token Length: {len(data["access_token"])} chars')
else:
    print(f'  Error: {r2.json().get("detail", r2.text[:200])}')
