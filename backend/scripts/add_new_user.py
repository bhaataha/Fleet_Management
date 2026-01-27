#!/usr/bin/env python3
"""
Script to add new users to the Fleet Management system
Usage: python add_new_user.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import User
from app.core.security import get_password_hash
from app.services.permission_service import PermissionService
from uuid import UUID

def create_user(
    name: str,
    phone: str,
    email: str,
    password: str,
    org_role: str = "driver",
    org_id: str = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"  # Default org UUID
):
    """
    Create a new user with phone authentication
    
    Args:
        name: Full name in Hebrew/English
        phone: Phone number (e.g., "050-1234567" or "0501234567")
        email: Email address (required but not used for login)
        password: Password (for emergency access)
        org_role: admin, dispatcher, accounting, driver
        org_id: Organization UUID (default Demo Organization)
    """
    db = SessionLocal()
    
    try:
        # Normalize phone number (remove dashes, ensure format)
        normalized_phone = phone.replace('-', '').replace(' ', '')
        if not normalized_phone.startswith('0'):
            normalized_phone = '0' + normalized_phone
        
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.email == email) | (User.phone == normalized_phone)
        ).first()
        
        if existing_user:
            print(f"❌ משתמש כבר קיים עם אימייל או טלפון: {email} / {normalized_phone}")
            return None
        
        # Create user
        user = User(
            org_id=UUID(org_id),
            name=name,
            phone=normalized_phone,
            email=email,
            password_hash=get_password_hash(password),
            org_role=org_role,
            is_active=True,
            is_super_admin=False
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Set default permissions based on role
        PermissionService.set_default_permissions(db, user.id, org_role)
        
        print(f"✅ משתמש חדש נוצר בהצלחה!")
        print(f"   שם: {name}")
        print(f"   טלפון: {normalized_phone}")
        print(f"   תפקיד: {org_role}")
        print(f"   אימייל: {email}")
        print(f"   ID: {user.id}")
        
        return user
        
    except Exception as e:
        db.rollback()
        print(f"❌ שגיאה ביצירת המשתמש: {e}")
        return None
    finally:
        db.close()


def update_user_phone(user_id: int, new_phone: str):
    """
    Update user's phone number
    
    Args:
        user_id: User ID to update
        new_phone: New phone number
    """
    db = SessionLocal()
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"❌ משתמש לא נמצא עם ID: {user_id}")
            return False
        
        # Normalize new phone
        normalized_phone = new_phone.replace('-', '').replace(' ', '')
        if not normalized_phone.startswith('0'):
            normalized_phone = '0' + normalized_phone
        
        # Check if phone already exists
        existing = db.query(User).filter(
            User.phone == normalized_phone,
            User.id != user_id
        ).first()
        
        if existing:
            print(f"❌ מספר הטלפון {normalized_phone} כבר קיים אצל משתמש אחר")
            return False
        
        old_phone = user.phone
        user.phone = normalized_phone
        db.commit()
        
        print(f"✅ מספר הטלפון עודכן בהצלחה!")
        print(f"   משתמש: {user.name}")
        print(f"   טלפון ישן: {old_phone}")
        print(f"   טלפון חדש: {normalized_phone}")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ שגיאה בעדכון הטלפון: {e}")
        return False
    finally:
        db.close()


def list_users():
    """List all users in the system"""
    db = SessionLocal()
    
    try:
        users = db.query(User).order_by(User.id).all()
        
        print("\n📋 רשימת כל המשתמשים במערכת:")
        print("-" * 80)
        print(f"{'ID':<4} {'שם':<20} {'טלפון':<15} {'תפקיד':<12} {'אימייל':<25}")
        print("-" * 80)
        
        for user in users:
            role_hebrew = {
                'admin': 'מנהל',
                'dispatcher': 'סדרן',
                'accounting': 'חשבונות',
                'driver': 'נהג',
                'super_admin': 'מנהל מערכת'
            }.get(user.org_role, user.org_role)
            
            print(f"{user.id:<4} {user.name:<20} {user.phone:<15} {role_hebrew:<12} {user.email:<25}")
        
        print("-" * 80)
        print(f"סה\"כ: {len(users)} משתמשים")
        
    except Exception as e:
        print(f"❌ שגיאה בהצגת המשתמשים: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    print("🚛 Fleet Management - ניהול משתמשים")
    print("=" * 50)
    
    while True:
        print("\nבחר פעולה:")
        print("1. הצג רשימת משתמשים")
        print("2. צור משתמש חדש")
        print("3. עדכן מספר טלפון")
        print("4. יציאה")
        
        choice = input("\nהקש מספר (1-4): ").strip()
        
        if choice == "1":
            list_users()
            
        elif choice == "2":
            print("\n📝 יצירת משתמש חדש:")
            name = input("שם מלא: ").strip()
            phone = input("מספר טלפון (כולל 0): ").strip()
            email = input("אימייל: ").strip()
            password = input("סיסמה: ").strip()
            
            print("\nבחר תפקיד:")
            print("1. מנהל (admin)")
            print("2. סדרן (dispatcher)")
            print("3. הנהלת חשבונות (accounting)")
            print("4. נהג (driver)")
            
            role_choice = input("תפקיד (1-4): ").strip()
            role_map = {
                "1": "admin",
                "2": "dispatcher", 
                "3": "accounting",
                "4": "driver"
            }
            
            org_role = role_map.get(role_choice, "driver")
            
            if name and phone and email and password:
                create_user(name, phone, email, password, org_role)
            else:
                print("❌ יש למלא את כל השדות")
            
        elif choice == "3":
            print("\n📱 עדכון מספר טלפון:")
            list_users()
            try:
                user_id = int(input("\nהזן ID של המשתמש לעדכון: ").strip())
                new_phone = input("מספר טלפון חדש: ").strip()
                
                if new_phone:
                    update_user_phone(user_id, new_phone)
                else:
                    print("❌ יש להזין מספר טלפון")
            except ValueError:
                print("❌ יש להזין מספר תקין")
            
        elif choice == "4":
            print("👋 להתראות!")
            break
            
        else:
            print("❌ בחירה לא תקינה")