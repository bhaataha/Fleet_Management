from app.models import Organization, User
from app.core.database import SessionLocal

db = SessionLocal()
try:
    org = db.query(Organization).first()
    if org:
        print(f"✅ Organization: {org.name}")
        print(f"   Slug: {org.slug}")
        print(f"   Plan: {org.plan_type}")
        print(f"   Max Trucks: {org.max_trucks}")
        print(f"   Max Drivers: {org.max_drivers}")
    else:
        print("❌ No organization found")
        
    users = db.query(User).count()
    print(f"\n📊 Total users: {users}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
