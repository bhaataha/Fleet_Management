"""
Create initial admin user

Run with:
docker-compose exec backend python scripts/create_admin.py
"""
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import User, UserRoleModel, Organization, UserRole
import sys

def create_admin(email: str, password: str, org_name: str = "Demo Organization"):
    db = SessionLocal()
    try:
        # Check if user exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"❌ User with email {email} already exists")
            return

        # Get or create organization
        org = db.query(Organization).filter(Organization.name == org_name).first()
        if not org:
            org = Organization(name=org_name, timezone="Asia/Jerusalem")
            db.add(org)
            db.flush()
            print(f"✅ Created organization: {org_name}")

        # Create user
        user = User(
            org_id=org.id,
            name="Admin User",
            email=email,
            password_hash=get_password_hash(password),
            is_active=True
        )
        db.add(user)
        db.flush()

        # Create admin role
        role = UserRoleModel(
            org_id=org.id,
            user_id=user.id,
            role=UserRole.ADMIN
        )
        db.add(role)
        db.commit()

        print(f"✅ Created admin user:")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"   Organization: {org_name}")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_admin.py <email> <password> [org_name]")
        sys.exit(1)

    email = sys.argv[1]
    password = sys.argv[2]
    org_name = sys.argv[3] if len(sys.argv) > 3 else "Demo Organization"

    create_admin(email, password, org_name)
