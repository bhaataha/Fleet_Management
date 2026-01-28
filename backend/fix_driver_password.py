#!/usr/bin/env python3
"""Reset driver password to demo123"""
import sys
sys.path.insert(0, '/app')
from app.core.database import SessionLocal
from app.models import User
from app.core.security import get_password_hash

db = SessionLocal()
try:
    # Find driver by phone
    driver_user = db.query(User).filter(User.phone == '0507771111').first()
    
    if driver_user:
        driver_user.password_hash = get_password_hash('demo123')
        db.commit()
        print(f'✓ Password updated for {driver_user.email}')
        print(f'Phone: 0507771111')
        print(f'Password: demo123')
    else:
        print('Driver user not found')
finally:
    db.close()
