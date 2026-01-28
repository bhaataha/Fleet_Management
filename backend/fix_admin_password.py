#!/usr/bin/env python3
"""
Script to fix admin password hash in database
Run: python fix_admin_password.py
"""
import sys
import os

# Add app to path
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.models import User
from app.core.security import get_password_hash

def fix_password():
    db = SessionLocal()
    try:
        # Find super admin
        admin = db.query(User).filter(User.is_super_admin == True).first()
        
        if not admin:
            print("❌ No super admin found")
            return False
        
        # Generate fresh hash
        password = "Admin@2026"
        new_hash = get_password_hash(password)
        
        print(f"Current password hash: {admin.password_hash[:20]}...")
        print(f"New password hash:     {new_hash[:20]}...")
        
        # Update
        admin.password_hash = new_hash
        db.commit()
        
        print(f"\n✅ Password updated for {admin.email}")
        print(f"Email: {admin.email}")
        print(f"Password: {password}")
        print(f"Hash: {new_hash}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    fix_password()
