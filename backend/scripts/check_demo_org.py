"""
Test Super Admin API - Check if DEMO org is visible
"""
import sys
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models import Organization, User
from app.core.security import create_access_token_for_user

db = SessionLocal()
try:
    # Get Super Admin user
    super_admin = db.query(User).filter(User.is_super_admin == True).first()
    if not super_admin:
        print("❌ No Super Admin found!")
        exit(1)
    
    print(f"✅ Super Admin: {super_admin.name} ({super_admin.email})")
    
    # Create token
    token = create_access_token_for_user(super_admin)
    print(f"\n🔑 Token created (first 50 chars): {token[:50]}...")
    
    # List all organizations
    orgs = db.query(Organization).all()
    print(f"\n📊 Total Organizations in DB: {len(orgs)}")
    
    for org in orgs:
        print(f"\n  🏢 {org.name}")
        print(f"     Slug: {org.slug}")
        print(f"     ID: {org.id}")
        print(f"     Status: {org.status}")
        print(f"     Plan: {org.plan_type}")
    
    # Check DEMO org specifically
    demo_org = db.query(Organization).filter(Organization.slug == "demo").first()
    if demo_org:
        print("\n✅ DEMO Organization found in database!")
        print(f"   Name: {demo_org.name}")
        print(f"   ID: {demo_org.id}")
        print(f"   Status: {demo_org.status}")
        
        # Count entities
        from app.models import Customer, Site, Job, Truck, Driver
        customers_count = db.query(Customer).filter(Customer.org_id == demo_org.id).count()
        sites_count = db.query(Site).filter(Site.org_id == demo_org.id).count()
        jobs_count = db.query(Job).filter(Job.org_id == demo_org.id).count()
        trucks_count = db.query(Truck).filter(Truck.org_id == demo_org.id).count()
        drivers_count = db.query(Driver).filter(Driver.org_id == demo_org.id).count()
        
        print(f"\n   📊 DEMO Org Stats:")
        print(f"      Customers: {customers_count}")
        print(f"      Sites: {sites_count}")
        print(f"      Jobs: {jobs_count}")
        print(f"      Trucks: {trucks_count}")
        print(f"      Drivers: {drivers_count}")
    else:
        print("\n❌ DEMO Organization NOT found in database!")
    
    print("\n" + "="*60)
    print("💡 To login as Super Admin in the frontend:")
    print("   Email: admin@fleetmanagement.com")
    print("   Check your create_super_admin script for password")
    print("="*60)

finally:
    db.close()
