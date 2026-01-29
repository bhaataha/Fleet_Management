#!/usr/bin/env python3
"""Reset admin password"""
import os
import sys
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models import User
from app.core.security import get_password_hash

# Connect to DB
db = SessionLocal()

# Find super admin
admin = db.query(User).filter(User.is_super_admin == True).first()

if admin:
    # Set new password
    new_password = "AdminPass@2026"
    admin.password_hash = get_password_hash(new_password)
    db.commit()
    print(f"✅ Password reset for {admin.email}")
    print(f"Email: {admin.email}")
    print(f"Password: {new_password}")
else:
    print("❌ No super admin found")

db.close()
