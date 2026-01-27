#!/usr/bin/env python3
"""
Verify that all drivers are properly linked to users
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import Driver, User

def verify_driver_user_links():
    """Check that all drivers have associated users"""
    db: Session = SessionLocal()
    try:
        print("\n" + "="*60)
        print("Verify Driver-User Links")
        print("="*60 + "\n")
        
        # Get all drivers
        all_drivers = db.query(Driver).all()
        total = len(all_drivers)
        print(f"Total drivers: {total}\n")
        
        # Check each driver
        issues = []
        for driver in all_drivers:
            if not driver.user_id:
                issues.append({
                    'driver_id': driver.id,
                    'name': driver.name,
                    'phone': driver.phone,
                    'issue': 'No user_id'
                })
            else:
                user = db.query(User).filter(User.id == driver.user_id).first()
                if not user:
                    issues.append({
                        'driver_id': driver.id,
                        'name': driver.name,
                        'phone': driver.phone,
                        'user_id': driver.user_id,
                        'issue': 'User not found'
                    })
        
        # Report results
        if not issues:
            print("✅ All drivers are properly linked to users!")
            print(f"   {total} drivers verified")
        else:
            print(f"⚠️  Found {len(issues)} issue(s):\n")
            for issue in issues:
                print(f"Driver #{issue['driver_id']} - {issue['name']}")
                print(f"  Phone: {issue.get('phone', 'N/A')}")
                print(f"  Issue: {issue['issue']}")
                if 'user_id' in issue:
                    print(f"  Missing user_id: {issue['user_id']}")
                print()
        
        print("="*60)
        return len(issues) == 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = verify_driver_user_links()
    sys.exit(0 if success else 1)
