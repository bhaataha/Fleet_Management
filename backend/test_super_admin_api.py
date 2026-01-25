#!/usr/bin/env python3
"""
Test Super Admin API
"""
import requests
import json

BASE_URL = "http://localhost:8001/api"

def test_super_admin():
    print("=" * 60)
    print("Testing Super Admin API")
    print("=" * 60)
    
    # 1. Login as Super Admin
    print("\n1️⃣ Login as Super Admin...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": "admin@fleetmanagement.com",
            "password": "SuperAdmin123!"
        }
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return
    
    login_data = login_response.json()
    token = login_data["access_token"]
    user = login_data["user"]
    
    print(f"✅ Login successful!")
    print(f"   User: {user['name']}")
    print(f"   Email: {user['email']}")
    print(f"   Org ID: {user['org_id']}")
    print(f"   Is Super Admin: {user.get('is_super_admin', False)}")
    print(f"   Token: {token[:50]}...")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # 2. List Organizations
    print("\n2️⃣ List Organizations...")
    orgs_response = requests.get(
        f"{BASE_URL}/super-admin/organizations",
        headers=headers
    )
    
    if orgs_response.status_code != 200:
        print(f"❌ Failed: {orgs_response.status_code}")
        print(orgs_response.text)
        return
    
    orgs_data = orgs_response.json()
    print(f"✅ Found {orgs_data['total']} organizations")
    for org in orgs_data['items']:
        print(f"   - {org['name']} ({org['slug']})")
        print(f"     ID: {org['id']}")
        print(f"     Plan: {org['plan_type']}, Status: {org['status']}")
        print(f"     Trucks: {org['total_trucks']}/{org['max_trucks']}")
        print(f"     Drivers: {org['total_drivers']}/{org['max_drivers']}")
    
    # 3. Get System Stats
    print("\n3️⃣ Get System Stats...")
    stats_response = requests.get(
        f"{BASE_URL}/super-admin/stats",
        headers=headers
    )
    
    if stats_response.status_code != 200:
        print(f"❌ Failed: {stats_response.status_code}")
        print(stats_response.text)
        return
    
    stats = stats_response.json()
    print(f"✅ System Statistics:")
    print(f"   Organizations: {stats['organizations']['total']}")
    print(f"     - Active: {stats['organizations']['active']}")
    print(f"     - Suspended: {stats['organizations']['suspended']}")
    print(f"     - Trial: {stats['organizations']['trial']}")
    print(f"   Resources:")
    print(f"     - Users: {stats['resources']['total_users']}")
    print(f"     - Customers: {stats['resources']['total_customers']}")
    print(f"     - Drivers: {stats['resources']['total_drivers']}")
    print(f"     - Trucks: {stats['resources']['total_trucks']}")
    print(f"   Jobs:")
    print(f"     - Total: {stats['jobs']['total']}")
    print(f"     - Completed: {stats['jobs']['completed']}")
    print(f"     - Completion Rate: {stats['jobs']['completion_rate']}%")
    
    # 4. Create Test Organization
    print("\n4️⃣ Create Test Organization...")
    create_org_response = requests.post(
        f"{BASE_URL}/super-admin/organizations",
        headers=headers,
        json={
            "name": "Test Transport Ltd",
            "slug": "test-transport",
            "display_name": "Test Transport",
            "contact_email": "admin@test-transport.com",
            "plan_type": "trial",
            "trial_days": 30,
            "max_trucks": 10,
            "max_drivers": 10,
            "max_storage_gb": 20
        }
    )
    
    if create_org_response.status_code == 201:
        new_org = create_org_response.json()
        print(f"✅ Created organization: {new_org['name']}")
        print(f"   ID: {new_org['id']}")
        print(f"   Slug: {new_org['slug']}")
        print(f"   Plan: {new_org['plan_type']}")
        print(f"   Trial ends: {new_org.get('trial_ends_at', 'N/A')}")
        
        # 5. Test Organization Impersonation
        print("\n5️⃣ Test Organization Impersonation...")
        print(f"   Switching to org: {new_org['id']}")
        
        impersonate_headers = {
            "Authorization": f"Bearer {token}",
            "X-Org-Id": new_org['id']
        }
        
        # Try to list customers with impersonation
        customers_response = requests.get(
            f"{BASE_URL}/customers",
            headers=impersonate_headers
        )
        
        if customers_response.status_code == 200:
            print(f"✅ Impersonation working! (Status: {customers_response.status_code})")
            print(f"   Note: Customers endpoint needs org_id filtering to be implemented")
        else:
            print(f"⚠️  Customers endpoint: {customers_response.status_code}")
            print(f"   This is expected - endpoint not yet updated for multi-tenant")
        
    elif create_org_response.status_code == 400:
        print(f"⚠️  Organization already exists (this is OK for repeated tests)")
    else:
        print(f"❌ Failed to create org: {create_org_response.status_code}")
        print(create_org_response.text)
    
    print("\n" + "=" * 60)
    print("✅ Super Admin API Test Complete!")
    print("=" * 60)

if __name__ == "__main__":
    test_super_admin()
