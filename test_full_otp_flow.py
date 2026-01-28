#!/usr/bin/env python3
import requests
import json
import time

# Step 1: Send OTP
print("Step 1: Sending OTP...")
url1 = 'https://truckflow.site/api/phone-auth/send-otp'
response1 = requests.post(url1, json={'phone': '0507771111'}, verify=False)
print(f'  Status: {response1.status_code}')
if response1.status_code != 200:
    print(f'  Error: {response1.text[:200]}')
    exit(1)

# Wait a bit
time.sleep(1)

# Step 2: Get OTP from database
print("\nStep 2: Getting OTP from database...")
import subprocess
result = subprocess.run([
    'ssh', 'root@64.176.173.36',
    'docker exec fleet_db psql -U fleet_user -d fleet_management -c "SELECT otp_code FROM phone_otps WHERE phone = \'0507771111\' ORDER BY created_at DESC LIMIT 1;"'
], capture_output=True, text=True)
otp_code = result.stdout.split('\n')[2].strip()
print(f'  OTP Code: {otp_code}')

# Step 3: Verify OTP
print(f"\nStep 3: Verifying OTP '{otp_code}'...")
url2 = 'https://truckflow.site/api/phone-auth/verify-otp'
response2 = requests.post(url2, json={'phone': '0507771111', 'otp_code': otp_code}, verify=False)
print(f'  Status: {response2.status_code}')

if response2.status_code == 200:
    data = response2.json()
    print(f'  ✓ Login successful!')
    print(f'    Access Token: {data.get("access_token", "")[:80]}...')
    print(f'    User: {data["user"]["name"]} (ID {data["user"]["id"]})')
    print(f'    Org: {data["user"]["org_name"]}')
else:
    print(f'  ✗ Error: {response2.json().get("detail", response2.text[:200])}')
