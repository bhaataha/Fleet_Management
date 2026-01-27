#!/usr/bin/env python3
"""
Create test driver for Flutter app testing
Phone: 0501234567
Password: driver123
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import Driver, User, Organization
from app.core.security import get_password_hash

def create_test_driver():
    """Create test driver with user"""
    db: Session = SessionLocal()
    try:
        print("\n" + "="*60)
        print("Create Test Driver")
        print("="*60 + "\n")
        
        # Get first organization
        org = db.query(Organization).first()
        if not org:
            print("❌ No organization found")
            return False
        
        print(f"Organization: {org.name} ({org.id})")
        
        # Check if driver already exists
        existing_driver = db.query(Driver).filter(Driver.phone == "0501234567").first()
        if existing_driver:
            print(f"✅ Test driver already exists (ID: {existing_driver.id})")
            if existing_driver.user_id:
                user = db.query(User).filter(User.id == existing_driver.user_id).first()
                print(f"   User ID: {user.id if user else 'NOT FOUND'}")
                print(f"   Phone: {existing_driver.phone}")
            else:
                print("⚠️  Driver has no user_id, creating...")
                # Create user
                password = "driver123"
                password_bytes = password.encode('utf-8')[:72]
                password = password_bytes.decode('utf-8', errors='ignore')
                hashed = get_password_hash(password)
                
                user = User(
                    name=existing_driver.name,
                    phone=existing_driver.phone,
                    email=None,
                    password_hash=hashed,
                    org_id=org.id,
                    org_role="driver",
                    is_active=True
                )
                db.add(user)
                db.flush()
                existing_driver.user_id = user.id
                db.commit()
                print(f"✅ Created user {user.id} for driver")
            return True
        
        # Create new driver
        print("Creating new test driver...")
        
        # Create user first
        password = "driver123"
        password_bytes = password.encode('utf-8')[:72]
        password = password_bytes.decode('utf-8', errors='ignore')
        hashed = get_password_hash(password)
        
        user = User(
            name="נהג טסט",
            phone="0501234567",
            email=None,
            password_hash=hashed,
            org_id=org.id,
            org_role="driver",
            is_active=True
        )
        db.add(user)
        db.flush()
        
        # Create driver
        driver = Driver(
            org_id=org.id,
            user_id=user.id,
            name="נהג טסט",
            phone="0501234567",
            license_type="C",
            is_active=True
        )
        db.add(driver)
        db.commit()
        db.refresh(driver)
        
        print(f"✅ Created test driver successfully!")
        print(f"   Driver ID: {driver.id}")
        print(f"   User ID: {user.id}")
        print(f"   Phone: {driver.phone}")
        print(f"   Password: driver123")
        print(f"\n   Test login with:")
        print(f"   Phone: 0501234567")
        print(f"   Password: driver123")
        
        print("="*60)
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = create_test_driver()
    sys.exit(0 if success else 1)
