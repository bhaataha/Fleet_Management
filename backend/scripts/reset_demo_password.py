"""
Reset DEMO user password to demo123
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from app.core.security import get_password_hash

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://fleet_user:fleet_password@localhost:5434/fleet_management")

def reset_password():
    engine = create_engine(DATABASE_URL)
    
    new_password = "demo123"
    hashed = get_password_hash(new_password)
    
    with Session(engine) as db:
        result = db.execute(
            text("UPDATE users SET password_hash = :hash WHERE email = 'demo@demo.com' RETURNING id, email"),
            {"hash": hashed}
        )
        db.commit()
        
        user = result.fetchone()
        if user:
            print(f"✅ Password updated for user: {user.email} (ID: {user.id})")
            print(f"   New password: {new_password}")
        else:
            print("❌ User demo@demo.com not found")

if __name__ == "__main__":
    reset_password()
