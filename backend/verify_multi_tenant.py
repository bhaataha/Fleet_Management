#!/usr/bin/env python3
"""
Quick verification script for Multi-Tenant setup
"""

from app.core.database import SessionLocal
from app.models import Organization, User, Customer, Site, Material, Truck, Driver
from sqlalchemy import inspect

def check_multi_tenant_setup():
    print("🔍 Checking Multi-Tenant Setup...\n")
    
    db = SessionLocal()
    
    try:
        # 1. Check organizations table
        print("1️⃣ Checking Organizations Table:")
        orgs = db.query(Organization).all()
        print(f"   Total organizations: {len(orgs)}")
        for org in orgs:
            print(f"   - {org.name} (ID: {org.id})")
            print(f"     Plan: {org.plan_type}, Status: {org.status}")
            print(f"     Limits: {org.max_trucks} trucks, {org.max_drivers} drivers")
        print()
        
        # 2. Check org_id columns
        print("2️⃣ Checking org_id columns in tables:")
        models = [User, Customer, Site, Material, Truck, Driver]
        for model in models:
            inspector = inspect(model)
            columns = [c.name for c in inspector.columns]
            has_org_id = 'org_id' in columns
            status = "✅" if has_org_id else "❌"
            print(f"   {status} {model.__tablename__}: {'Has org_id' if has_org_id else 'Missing org_id'}")
        print()
        
        # 3. Check relationships
        print("3️⃣ Checking relationships:")
        try:
            org = db.query(Organization).first()
            if org:
                print(f"   Organization '{org.name}' has relationships:")
                print(f"   - Users: {hasattr(org, 'users')}")
                print(f"   - Customers: {hasattr(org, 'customers')}")
                print(f"   - Sites: {hasattr(org, 'sites')}")
                print(f"   - Drivers: {hasattr(org, 'drivers')}")
                print(f"   - Trucks: {hasattr(org, 'trucks')}")
                print(f"   - Materials: {hasattr(org, 'materials')}")
        except Exception as e:
            print(f"   ❌ Error checking relationships: {e}")
        print()
        
        # 4. Count records
        print("4️⃣ Counting records:")
        print(f"   Organizations: {db.query(Organization).count()}")
        print(f"   Users: {db.query(User).count()}")
        print(f"   Customers: {db.query(Customer).count()}")
        print(f"   Sites: {db.query(Site).count()}")
        print(f"   Materials: {db.query(Material).count()}")
        print(f"   Trucks: {db.query(Truck).count()}")
        print(f"   Drivers: {db.query(Driver).count()}")
        print()
        
        # 5. Check user fields
        print("5️⃣ Checking User model:")
        user_inspector = inspect(User)
        user_columns = [c.name for c in user_inspector.columns]
        print(f"   Has org_id: {'org_id' in user_columns}")
        print(f"   Has is_super_admin: {'is_super_admin' in user_columns}")
        print(f"   Has org_role: {'org_role' in user_columns}")
        print()
        
        print("✅ Multi-Tenant setup verification complete!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_multi_tenant_setup()
