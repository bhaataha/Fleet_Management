#!/usr/bin/env python3
"""
Fix Drivers Without Users - Create User for Each Driver Missing user_id
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import Driver, User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def fix_drivers_without_users():
    """Create User for each Driver that doesn't have one"""
    db: Session = SessionLocal()
    
    try:
        # Find all drivers without user_id
        drivers_without_users = db.query(Driver).filter(
            Driver.user_id == None
        ).all()
        
        if not drivers_without_users:
            print("✅ All drivers already have associated users!")
            return
        
        print(f"Found {len(drivers_without_users)} drivers without users")
        print("-" * 60)
        
        for driver in drivers_without_users:
            print(f"\n🔧 Fixing Driver ID {driver.id}: {driver.name}")
            print(f"   Phone: {driver.phone}")
            
            # Check if user with this phone already exists
            existing_user = db.query(User).filter(
                User.phone == driver.phone,
                User.org_id == driver.org_id
            ).first()
            
            if existing_user:
                # Link to existing user
                driver.user_id = existing_user.id
                print(f"   ✅ Linked to existing user {existing_user.id}")
            else:
                # Create new user with default password "driver123"
                password = "driver123"
                password_bytes = password.encode('utf-8')[:72]
                password_safe = password_bytes.decode('utf-8', errors='ignore')
                hashed_password = pwd_context.hash(password_safe)
                
                new_user = User(
                    name=driver.name,
                    phone=driver.phone or f"driver_{driver.id}",
                    email=None,
                    password_hash=hashed_password,
                    org_id=driver.org_id,
                    org_role="driver",
                    is_active=driver.is_active
                )
                db.add(new_user)
                db.flush()
                
                driver.user_id = new_user.id
                print(f"   ✅ Created new user {new_user.id}")
                print(f"   📱 Login: {new_user.phone}")
                print(f"   🔑 Password: driver123 (CHANGE THIS!)")
        
        db.commit()
        
        print("\n" + "=" * 60)
        print(f"✅ Fixed {len(drivers_without_users)} drivers!")
        print("=" * 60)
        print("\n⚠️  IMPORTANT: All new users have password 'driver123'")
        print("   Please reset passwords for security!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Fix Drivers Without Users")
    print("=" * 60)
    fix_drivers_without_users()
