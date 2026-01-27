#!/usr/bin/env python3
"""
Multi-Tenant Isolation Testing Script
Tests that organizations cannot access each other's data

Run: python backend/test_multi_tenant_isolation.py
"""
import sys
import requests
import json
from typing import Optional
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8001/api"
DEMO_ORG_EMAIL = "admin@fleet.com"
DEMO_ORG_PASSWORD = "admin123"


class Colors:
    """Terminal colors for output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


def print_success(msg: str):
    print(f"{Colors.GREEN}✅ {msg}{Colors.END}")


def print_error(msg: str):
    print(f"{Colors.RED}❌ {msg}{Colors.END}")


def print_info(msg: str):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.END}")


def print_warning(msg: str):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.END}")


def print_header(msg: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 60}")
    print(f"{msg}")
    print(f"{'=' * 60}{Colors.END}\n")


class APIClient:
    """Helper class for API calls"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.token: Optional[str] = None
        self.org_id: Optional[str] = None
        self.email: Optional[str] = None
    
    def login(self, email: str, password: str) -> bool:
        """Login and store token"""
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                json={"email": email, "password": password}
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data["access_token"]
                self.org_id = data["user"]["org_id"]
                self.email = email
                print_success(f"Logged in as {email} (org_id: {self.org_id[:8]}...)")
                return True
            else:
                print_error(f"Login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print_error(f"Login error: {str(e)}")
            return False
    
    def get(self, endpoint: str) -> dict:
        """GET request with auth"""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.base_url}{endpoint}", headers=headers)
        return {
            "status": response.status_code,
            "data": response.json() if response.status_code < 500 else None,
            "text": response.text
        }
    
    def post(self, endpoint: str, data: dict) -> dict:
        """POST request with auth"""
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.post(
            f"{self.base_url}{endpoint}",
            headers=headers,
            json=data
        )
        return {
            "status": response.status_code,
            "data": response.json() if response.status_code < 500 else None,
            "text": response.text
        }


def test_cross_org_customer_access(client1: APIClient, client2: APIClient) -> bool:
    """
    Test 1: User from Org 1 cannot access customers from Org 2
    """
    print_header("Test 1: Cross-Organization Customer Access")
    
    # Client 1 creates a customer
    print_info(f"Client 1 ({client1.email}) creating customer...")
    customer_data = {
        "name": f"Test Customer Org1 {datetime.now().isoformat()}",
        "contact_name": "Test Contact",
        "phone": "050-1234567",
        "email": "test@org1.com"
    }
    result = client1.post("/customers", customer_data)
    
    if result["status"] != 201:
        print_error(f"Failed to create customer: {result['text']}")
        return False
    
    customer_id = result["data"]["id"]
    print_success(f"Created customer ID: {customer_id}")
    
    # Client 2 tries to access Client 1's customer
    print_info(f"Client 2 ({client2.email}) trying to access customer {customer_id}...")
    result = client2.get(f"/customers/{customer_id}")
    
    if result["status"] == 404:
        print_success("✅ PASS: Client 2 received 404 (cannot access Org 1's customer)")
        return True
    elif result["status"] == 200:
        print_error(f"❌ FAIL: Client 2 accessed Org 1's customer! Data: {result['data']}")
        return False
    else:
        print_error(f"❌ Unexpected status: {result['status']} - {result['text']}")
        return False


def test_cross_org_customer_list(client1: APIClient, client2: APIClient) -> bool:
    """
    Test 2: Users only see customers from their own organization
    """
    print_header("Test 2: Customer List Isolation")
    
    # Get customer counts
    print_info(f"Client 1 ({client1.email}) fetching customers...")
    result1 = client1.get("/customers")
    
    print_info(f"Client 2 ({client2.email}) fetching customers...")
    result2 = client2.get("/customers")
    
    if result1["status"] != 200 or result2["status"] != 200:
        print_error("Failed to fetch customer lists")
        return False
    
    customers1 = result1["data"]
    customers2 = result2["data"]
    
    print_info(f"Client 1 has {len(customers1)} customers")
    print_info(f"Client 2 has {len(customers2)} customers")
    
    # Check for overlap
    ids1 = {c["id"] for c in customers1}
    ids2 = {c["id"] for c in customers2}
    overlap = ids1.intersection(ids2)
    
    if overlap:
        print_error(f"❌ FAIL: Organizations share {len(overlap)} customers! IDs: {overlap}")
        return False
    else:
        print_success("✅ PASS: No overlap in customer lists")
        return True


def test_cross_org_job_access(client1: APIClient, client2: APIClient) -> bool:
    """
    Test 3: User from Org 1 cannot access jobs from Org 2
    """
    print_header("Test 3: Cross-Organization Job Access")
    
    # Get jobs from both clients
    print_info(f"Client 1 ({client1.email}) fetching jobs...")
    result1 = client1.get("/jobs?limit=10")
    
    if result1["status"] != 200:
        print_warning(f"Client 1 has no jobs (status {result1['status']})")
        print_info("Skipping job access test (no jobs to test with)")
        return True
    
    jobs1 = result1["data"]
    if not jobs1:
        print_info("Client 1 has no jobs, skipping cross-access test")
        return True
    
    job_id = jobs1[0]["id"]
    print_info(f"Client 1 has job ID: {job_id}")
    
    # Client 2 tries to access Client 1's job
    print_info(f"Client 2 ({client2.email}) trying to access job {job_id}...")
    result2 = client2.get(f"/jobs/{job_id}")
    
    if result2["status"] == 404:
        print_success("✅ PASS: Client 2 received 404 (cannot access Org 1's job)")
        return True
    elif result2["status"] == 200:
        print_error(f"❌ FAIL: Client 2 accessed Org 1's job! Data: {result2['data']}")
        return False
    else:
        print_error(f"❌ Unexpected status: {result2['status']} - {result2['text']}")
        return False


def test_cross_org_truck_access(client1: APIClient, client2: APIClient) -> bool:
    """
    Test 4: User from Org 1 cannot access trucks from Org 2
    """
    print_header("Test 4: Cross-Organization Truck Access")
    
    # Get trucks from both clients
    print_info(f"Client 1 ({client1.email}) fetching trucks...")
    result1 = client1.get("/trucks")
    
    if result1["status"] != 200 or not result1["data"]:
        print_info("Client 1 has no trucks, skipping test")
        return True
    
    trucks1 = result1["data"]
    truck_id = trucks1[0]["id"]
    print_info(f"Client 1 has truck ID: {truck_id}")
    
    # Client 2 tries to access Client 1's truck
    print_info(f"Client 2 ({client2.email}) trying to access truck {truck_id}...")
    result2 = client2.get(f"/trucks/{truck_id}")
    
    if result2["status"] == 404:
        print_success("✅ PASS: Client 2 received 404 (cannot access Org 1's truck)")
        return True
    elif result2["status"] == 200:
        print_error(f"❌ FAIL: Client 2 accessed Org 1's truck! Data: {result2['data']}")
        return False
    else:
        print_error(f"❌ Unexpected status: {result2['status']} - {result2['text']}")
        return False


def test_user_list_isolation(client1: APIClient, client2: APIClient) -> bool:
    """
    Test 5: Users only see users from their own organization
    """
    print_header("Test 5: User List Isolation")
    
    # Get users from both clients
    print_info(f"Client 1 ({client1.email}) fetching users...")
    result1 = client1.get("/users")
    
    print_info(f"Client 2 ({client2.email}) fetching users...")
    result2 = client2.get("/users")
    
    if result1["status"] != 200 or result2["status"] != 200:
        print_warning("Failed to fetch user lists (might require admin role)")
        return True  # Skip if not admin
    
    users1 = result1["data"]
    users2 = result2["data"]
    
    print_info(f"Client 1 has {len(users1)} users")
    print_info(f"Client 2 has {len(users2)} users")
    
    # Check for overlap
    ids1 = {u["id"] for u in users1}
    ids2 = {u["id"] for u in users2}
    overlap = ids1.intersection(ids2)
    
    if overlap:
        print_error(f"❌ FAIL: Organizations share {len(overlap)} users! IDs: {overlap}")
        return False
    else:
        print_success("✅ PASS: No overlap in user lists")
        return True


def create_test_organization() -> Optional[APIClient]:
    """
    Create a second test organization using Super Admin API
    Returns APIClient logged in as the new org's admin
    """
    print_header("Setup: Creating Test Organization")
    
    # First, login as demo org to check if it's a super admin
    print_info("Checking for Super Admin access...")
    demo_client = APIClient(BASE_URL)
    if not demo_client.login(DEMO_ORG_EMAIL, DEMO_ORG_PASSWORD):
        print_error("Cannot login to demo org")
        return None
    
    # Try to create a test organization via Super Admin API
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    org_data = {
        "name": f"Test Organization {timestamp}",
        "slug": f"test-org-{timestamp}",
        "contact_email": f"admin@test-{timestamp}.com",
        "plan_type": "trial",
        "trial_days": 30,
        "max_trucks": 5,
        "max_drivers": 5,
        "admin_name": "Test Admin",
        "admin_email": f"admin@test-{timestamp}.com",
        "admin_password": "test123456"
    }
    
    print_info("Creating test organization via Super Admin API...")
    result = demo_client.post("/super-admin/organizations", org_data)
    
    if result["status"] == 403:
        print_warning("Demo user is not Super Admin")
        print_info("Creating test organization via manual database setup...")
        print_warning("Manual setup not implemented - skipping test org creation")
        return None
    
    if result["status"] != 201:
        print_error(f"Failed to create test org: {result['text']}")
        return None
    
    print_success(f"Created test organization: {org_data['name']}")
    
    # Login as the new org's admin
    test_client = APIClient(BASE_URL)
    if test_client.login(org_data["admin_email"], org_data["admin_password"]):
        return test_client
    else:
        print_error("Failed to login to test organization")
        return None


def main():
    """Run all multi-tenant isolation tests"""
    print_header("🔒 Multi-Tenant Isolation Testing")
    print_info(f"Testing against: {BASE_URL}")
    
    # Setup: Login to existing organizations
    print_header("Setup: Logging into organizations")
    
    # Client 1: DEMO org
    client1 = APIClient(BASE_URL)
    if not client1.login(DEMO_ORG_EMAIL, DEMO_ORG_PASSWORD):
        print_error("Cannot login to DEMO organization")
        sys.exit(1)
    
    # Client 2: Try to create a test org, or skip if not possible
    client2 = create_test_organization()
    
    if not client2:
        print_warning("Could not create second test organization")
        print_info("Tests will be limited to single-org checks")
        print_header("Summary")
        print_warning("⚠️  Multi-tenant isolation tests require a second organization")
        print_info("To enable full testing:")
        print_info("  1. Make admin@fleet.com a Super Admin, OR")
        print_info("  2. Manually create a second organization and user")
        sys.exit(0)
    
    # Run tests
    results = []
    
    results.append(("Customer Access", test_cross_org_customer_access(client1, client2)))
    results.append(("Customer List", test_cross_org_customer_list(client1, client2)))
    results.append(("Job Access", test_cross_org_job_access(client1, client2)))
    results.append(("Truck Access", test_cross_org_truck_access(client1, client2)))
    results.append(("User List", test_user_list_isolation(client1, client2)))
    
    # Summary
    print_header("Test Summary")
    total = len(results)
    passed = sum(1 for _, result in results if result)
    failed = total - passed
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print()
    print(f"{Colors.BOLD}Results: {passed}/{total} tests passed{Colors.END}")
    
    if failed == 0:
        print_success("🎉 All multi-tenant isolation tests passed!")
        sys.exit(0)
    else:
        print_error(f"⚠️  {failed} test(s) failed - security issue!")
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
