"""
Script to initialize default permissions for demo users
"""
import sys
sys.path.append('/app')
from app.core.database import SessionLocal
from app.models import User, Organization
from app.services.permission_service import PermissionService
from app.models.permissions import Permission

def init_demo_permissions():
    db = SessionLocal()
    
    try:
        # Get demo organization
        org = db.query(Organization).filter(Organization.slug == "demo").first()
        if not org:
            print("Demo organization not found")
            return
        
        print(f"🏢 Found organization: {org.name}")
        
        # Get all users in demo org
        users = db.query(User).filter(User.org_id == org.id).all()
        
        admin_user = None
        for user in users:
            if user.org_role == "admin":
                admin_user = user
                break
        
        if not admin_user:
            print("❌ No admin user found")
            return
        
        print(f"👨‍💼 Using admin user: {admin_user.name} (ID: {admin_user.id})")
        
        # Initialize permissions for each user
        for user in users:
            print(f"\n👤 Processing user: {user.name} (Role: {user.org_role})")
            
            # Grant default permissions based on role
            PermissionService.grant_default_permissions(
                db=db,
                user=user,
                granted_by_user_id=admin_user.id
            )
            
            # Get and display permissions
            permissions = PermissionService.get_user_permissions(user)
            print(f"   ✅ Granted {len(permissions)} permissions")
            
            # Show first few permissions
            for i, perm in enumerate(permissions[:3]):
                perm_desc = Permission.get_all_permissions().get(perm, perm)
                print(f"   • {perm} ({perm_desc})")
            
            if len(permissions) > 3:
                print(f"   • ... and {len(permissions) - 3} more")
        
        print(f"\n🎉 Successfully initialized permissions for {len(users)} users!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_demo_permissions()