#!/usr/bin/env python3
"""
Create Super Admin User
"""
import sys
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models import User
from app.core.security import get_password_hash
from uuid import UUID

def create_super_admin():
    db = SessionLocal()
    
    try:
        # Default org ID
        default_org_id = UUID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
        
        # Check if super admin already exists
        existing = db.query(User).filter(
            User.email == 'admin@fleetmanagement.com'
        ).first()
        
        if existing:
            print(f"⚠️  Super Admin user already exists: {existing.email}")
            print(f"   User ID: {existing.id}")
            print(f"   Is Super Admin: {existing.is_super_admin}")
            
            # Update to ensure super admin
            if not existing.is_super_admin:
                existing.is_super_admin = True
                existing.org_role = 'super_admin'
                db.commit()
                print("   ✅ Updated to Super Admin")
            
            return existing
        
        # Create super admin user
        super_admin = User(
            org_id=default_org_id,
            email='admin@fleetmanagement.com',
            name='Super Administrator',
            phone='+972501234567',
            password_hash=get_password_hash('SuperAdmin123!'),
            is_active=True,
            is_super_admin=True,
            org_role='super_admin'
        )
        
        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)
        
        print("✅ Super Admin user created successfully!")
        print(f"   Email: {super_admin.email}")
        print(f"   Password: SuperAdmin123!")
        print(f"   User ID: {super_admin.id}")
        print(f"   Org ID: {super_admin.org_id}")
        print(f"   Is Super Admin: {super_admin.is_super_admin}")
        print()
        print("🔑 Login credentials:")
        print(f"   POST /api/v1/auth/login")
        print(f"   {{")
        print(f'     "email": "admin@fleetmanagement.com",')
        print(f'     "password": "SuperAdmin123!"')
        print(f"   }}")
        
        return super_admin
        
    except Exception as e:
        print(f"❌ Error creating super admin: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    create_super_admin()
