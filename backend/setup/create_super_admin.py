#!/usr/bin/env python3
"""
Fleet Management System - Production Setup
Super Admin Creation Script

This script creates the first super admin user and organization.
It should be run once during initial setup.
"""

import os
import sys
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import bcrypt


def hash_password(password: str) -> str:
    """Hash password using bcrypt directly."""
    # Encode to bytes and hash
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def get_env_or_exit(var_name: str) -> str:
    """Get environment variable or exit with error."""
    value = os.getenv(var_name)
    if not value:
        print(f"❌ Error: {var_name} environment variable not set")
        sys.exit(1)
    return value


def create_super_admin():
    """Create super admin user and first organization."""
    
    print("🚀 Fleet Management - Super Admin Setup")
    print("=" * 60)
    
    # Get configuration from environment
    db_url = get_env_or_exit("DATABASE_URL")
    admin_email = get_env_or_exit("SUPER_ADMIN_EMAIL")
    admin_password = get_env_or_exit("SUPER_ADMIN_PASSWORD")
    org_name = get_env_or_exit("FIRST_ORG_NAME")
    
    print(f"📧 Email: {admin_email}")
    print(f"🏢 Organization: {org_name}")
    print()
    
    try:
        # Create database connection
        print("🔌 Connecting to database...")
        engine = create_engine(db_url)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Check if super admin already exists
        existing_admin = session.execute(
            text("SELECT id FROM users WHERE email = :email AND is_super_admin = true"),
            {"email": admin_email}
        ).first()
        
        if existing_admin:
            print(f"⚠️  Super Admin with email {admin_email} already exists!")
            print("✅ Skipping creation...")
            session.close()
            return
        
        # Create organization (id is auto-incremented)
        now = datetime.utcnow()
        
        print("🏢 Creating organization...")
        
        # Create organization and get its ID
        org_result = session.execute(
            text("""
                INSERT INTO organizations (name, created_at, updated_at)
                VALUES (:name, :created_at, :updated_at)
                RETURNING id
            """),
            {
                "name": org_name,
                "created_at": now,
                "updated_at": now
            }
        )
        org_id = org_result.scalar()
        
        print(f"✅ Organization created: {org_name} (ID: {org_id})")
        
        # Hash password using bcrypt
        print("🔐 Hashing password...")
        password_hash = hash_password(admin_password)
        
        print("👤 Creating Super Admin user...")
        
        # Create super admin user
        user_result = session.execute(
            text("""
                INSERT INTO users (org_id, name, email, password_hash, is_active, is_super_admin, created_at, updated_at)
                VALUES (:org_id, :name, :email, :password_hash, true, true, :created_at, :updated_at)
                RETURNING id
            """),
            {
                "org_id": org_id,
                "name": "Super Admin",
                "email": admin_email,
                "password_hash": password_hash,
                "created_at": now,
                "updated_at": now
            }
        )
        
        user_id = user_result.scalar()
        
        # Commit transaction
        session.commit()
        
        print("=" * 60)
        print("✅ Super Admin Setup Complete!")
        print("=" * 60)
        print(f"User ID:      {user_id}")
        print(f"Email:        {admin_email}")
        print(f"Organization: {org_name} ({org_id})")
        print()
        print("🎉 You can now login to the system!")
        print()
        
    except Exception as e:
        if 'session' in locals():
            session.rollback()
        print(f"❌ Error creating Super Admin: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    finally:
        if 'session' in locals():
            session.close()


def verify_super_admin():
    """Verify super admin was created successfully."""
    
    db_url = get_env_or_exit("DATABASE_URL")
    admin_email = get_env_or_exit("SUPER_ADMIN_EMAIL")
    
    try:
        engine = create_engine(db_url)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        result = session.execute(
            text("""
                SELECT u.id, u.email, u.is_super_admin, o.name as org_name
                FROM users u
                JOIN organizations o ON u.org_id = o.id
                WHERE u.email = :email AND u.is_super_admin = true
            """),
            {"email": admin_email}
        ).first()
        
        if result:
            print("✅ Verification successful!")
            print(f"   User ID: {result[0]}")
            print(f"   Email: {result[1]}")
            print(f"   Super Admin: {result[2]}")
            print(f"   Organization: {result[3]}")
            return True
        else:
            print("❌ Verification failed - user not found")
            return False
            
    except Exception as e:
        print(f"❌ Verification error: {str(e)}")
        return False
    finally:
        if 'session' in locals():
            session.close()


def main():
    """Main entry point."""
    
    # Check required environment variables
    required_vars = [
        "DATABASE_URL",
        "SUPER_ADMIN_EMAIL",
        "SUPER_ADMIN_PASSWORD",
        "FIRST_ORG_NAME"
    ]
    
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print()
        print("Please set these variables and try again.")
        sys.exit(1)
    
    # Create super admin
    create_super_admin()
    
    # Verify creation
    print()
    print("🔍 Verifying Super Admin creation...")
    verify_super_admin()


if __name__ == "__main__":
    main()
