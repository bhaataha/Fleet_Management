import requests

login = requests.post(
    'https://truckflow.site/api/phone-auth/login-with-password',
    json={'phone': '0500000000', 'password': 'Admin@2026!', 'org_slug': 'default-org'},
    verify=False,
    timeout=10
)
print('login', login.status_code)
if login.status_code != 200:
    print(login.text)
    raise SystemExit(1)

token = login.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

org = requests.get('https://truckflow.site/api/super-admin/organizations/1', headers=headers, verify=False, timeout=10)
print('org', org.status_code)
print(org.text[:200])

unread = requests.get('https://truckflow.site/api/alerts/unread-count', headers=headers, verify=False, timeout=10)
print('unread', unread.status_code)
print(unread.text[:200])
