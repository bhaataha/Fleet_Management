"""
Permission Service - Manage user permissions and phone authentication
"""
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.models.permissions import UserPermission, PhoneOTP, Permission
from app.models import User, Organization
from typing import List, Optional, Dict
from uuid import UUID
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


def normalize_phone(phone: str) -> str:
    """
    Normalize phone number by removing dashes, spaces, and other separators
    
    Args:
        phone: Phone number string (e.g. "050-777-1111" or "0507771111")
        
    Returns:
        str: Normalized phone (e.g. "0507771111")
    """
    if not phone:
        return phone
    # Remove dashes, spaces, dots, and parentheses
    normalized = phone.replace("-", "").replace(" ", "").replace(".", "").replace("(", "").replace(")", "")
    return normalized


class PermissionService:
    """Service for managing user permissions"""
    
    @staticmethod
    def has_permission(user: User, permission_name: str) -> bool:
        """
        Check if user has a specific permission
        
        Args:
            user: User instance
            permission_name: Permission to check (e.g., 'jobs.create')
            
        Returns:
            bool: True if user has permission
        """
        # Super admin has all permissions
        if user.is_super_admin:
            return True
        
        # Check user-specific permissions
        for perm in user.permissions:
            if perm.permission_name == permission_name and perm.is_active:
                return True
        
        return False
    
    @staticmethod
    def get_user_permissions(user: User) -> List[str]:
        """
        Get list of all active permissions for user
        
        Args:
            user: User instance
            
        Returns:
            List of permission names
        """
        # Super admin gets all permissions
        if user.is_super_admin:
            return list(Permission.get_all_permissions().keys())
        
        permissions = []
        for perm in user.permissions:
            if perm.is_active:
                permissions.append(perm.permission_name)
        
        return permissions
    
    @staticmethod
    def grant_permission(
        db: Session,
        user_id: int,
        permission_name: str,
        granted_by_user_id: int,
        expires_at: Optional[datetime] = None,
        notes: Optional[str] = None
    ) -> UserPermission:
        """
        Grant permission to user
        
        Args:
            db: Database session
            user_id: User to grant permission to
            permission_name: Permission name
            granted_by_user_id: User granting the permission
            expires_at: Optional expiration date
            notes: Optional notes
            
        Returns:
            UserPermission instance
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        # Check if permission already exists
        existing = db.query(UserPermission).filter(
            UserPermission.user_id == user_id,
            UserPermission.permission_name == permission_name
        ).first()
        
        if existing:
            # Update existing permission
            existing.granted = True
            existing.granted_by = granted_by_user_id
            existing.granted_at = datetime.utcnow()
            existing.expires_at = expires_at
            existing.notes = notes
            db.commit()
            db.refresh(existing)
            logger.info(f"Updated permission {permission_name} for user {user_id}")
            return existing
        else:
            # Create new permission
            permission = UserPermission(
                user_id=user_id,
                org_id=user.org_id,
                permission_name=permission_name,
                granted=True,
                granted_by=granted_by_user_id,
                expires_at=expires_at,
                notes=notes
            )
            db.add(permission)
            db.commit()
            db.refresh(permission)
            logger.info(f"Granted permission {permission_name} to user {user_id}")
            return permission
    
    @staticmethod
    def revoke_permission(
        db: Session,
        user_id: int,
        permission_name: str,
        revoked_by_user_id: int
    ) -> bool:
        """
        Revoke permission from user
        
        Args:
            db: Database session
            user_id: User to revoke permission from
            permission_name: Permission name
            revoked_by_user_id: User revoking the permission
            
        Returns:
            bool: True if permission was revoked
        """
        permission = db.query(UserPermission).filter(
            UserPermission.user_id == user_id,
            UserPermission.permission_name == permission_name
        ).first()
        
        if permission:
            permission.granted = False
            permission.granted_by = revoked_by_user_id  # Track who revoked
            permission.granted_at = datetime.utcnow()   # When revoked
            db.commit()
            logger.info(f"Revoked permission {permission_name} from user {user_id}")
            return True
        
        return False
    
    @staticmethod
    def grant_default_permissions(
        db: Session,
        user: User,
        granted_by_user_id: int
    ):
        """
        Grant default permissions based on user role
        
        Args:
            db: Database session
            user: User instance
            granted_by_user_id: User granting permissions
        """
        default_permissions = Permission.get_default_permissions_for_role(user.org_role)
        
        for permission_name in default_permissions:
            PermissionService.grant_permission(
                db=db,
                user_id=user.id,
                permission_name=permission_name,
                granted_by_user_id=granted_by_user_id,
                notes=f"Default permissions for {user.org_role}"
            )
        
        logger.info(f"Granted {len(default_permissions)} default permissions to user {user.id}")
    
    @staticmethod
    def bulk_update_permissions(
        db: Session,
        user_id: int,
        permissions: List[str],
        granted_by_user_id: int
    ):
        """
        Update all permissions for user (grant specified, revoke others)
        
        Args:
            db: Database session
            user_id: User to update
            permissions: List of permissions to grant
            granted_by_user_id: User making changes
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        # Get all available permissions
        all_permissions = set(Permission.get_all_permissions().keys())
        
        # Revoke permissions not in the list
        for perm_name in all_permissions:
            if perm_name not in permissions:
                PermissionService.revoke_permission(
                    db=db,
                    user_id=user_id,
                    permission_name=perm_name,
                    revoked_by_user_id=granted_by_user_id
                )
        
        # Grant permissions in the list
        for perm_name in permissions:
            if perm_name in all_permissions:
                PermissionService.grant_permission(
                    db=db,
                    user_id=user_id,
                    permission_name=perm_name,
                    granted_by_user_id=granted_by_user_id
                )
        
        logger.info(f"Updated permissions for user {user_id}: {len(permissions)} granted")

    # Phone Authentication Methods
    @staticmethod
    def send_otp(
        db: Session,
        phone: str,
        org_id: UUID,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> PhoneOTP:
        """
        Send OTP to phone number
        
        Args:
            db: Database session
            phone: Phone number (will be normalized)
            org_id: Organization ID
            user_agent: User agent string
            ip_address: IP address
            
        Returns:
            PhoneOTP instance
        """
        # Normalize phone number for consistent storage
        normalized_phone = normalize_phone(phone)
        
        # Clean up old OTPs for this phone (check both formats)
        db.query(PhoneOTP).filter(
            PhoneOTP.phone.in_([phone, normalized_phone]),
            PhoneOTP.expires_at < func.now()
        ).delete()
        
        # Generate new OTP
        otp_code = PhoneOTP.generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=5)  # 5 minutes
        
        otp = PhoneOTP(
            phone=normalized_phone,  # Store normalized phone
            org_id=org_id,
            otp_code=otp_code,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address
        )
        
        db.add(otp)
        db.commit()
        db.refresh(otp)
        
        # TODO: Send SMS here (integration with SMS provider)
        logger.info(f"Generated OTP {otp_code} for phone {normalized_phone} (original: {phone})")
        print(f"🔐 OTP for {phone}: {otp_code} (expires in 5 minutes)")
        
        return otp
    
    @staticmethod
    def verify_otp(
        db: Session,
        phone: str,
        otp_code: str,
        org_id: UUID
    ) -> bool:
        """
        Verify OTP code
        Supports both normalized and formatted phone numbers
        
        Args:
            db: Database session
            phone: Phone number (with or without formatting)
            otp_code: OTP code to verify
            org_id: Organization ID
            
        Returns:
            bool: True if OTP is valid
        """
        # Normalize phone for search
        normalized_phone = normalize_phone(phone)
        
        # Search for OTP with both original and normalized phone
        otp = db.query(PhoneOTP).filter(
            PhoneOTP.phone.in_([phone, normalized_phone]),
            PhoneOTP.org_id == org_id,
            PhoneOTP.otp_code == otp_code,
            PhoneOTP.used == False,
            PhoneOTP.expires_at > func.now()
        ).first()
        
        if not otp:
            return False
        
        if not otp.is_valid:
            return False
        
        # Mark as used
        otp.use()
        db.commit()
        
        logger.info(f"OTP verified successfully for phone {phone}")
        return True
    
    @staticmethod
    def find_user_by_phone(db: Session, phone: str, org_id: UUID) -> Optional[User]:
        """
        Find user by phone number in organization
        Supports both normalized (0507771111) and formatted (050-777-1111) phone numbers
        
        Args:
            db: Database session
            phone: Phone number (with or without formatting)
            org_id: Organization ID
            
        Returns:
            User instance or None
        """
        # Normalize the search phone
        normalized_phone = normalize_phone(phone)
        
        # Try to find user with exact match first (for backwards compatibility)
        user = db.query(User).filter(
            User.phone == phone,
            User.org_id == org_id,
            User.is_active == True
        ).first()
        
        if user:
            return user
        
        # If not found, try normalized search (remove dashes from both search and DB phone)
        from sqlalchemy import func
        user = db.query(User).filter(
            func.replace(func.replace(func.replace(User.phone, '-', ''), ' ', ''), '.', '') == normalized_phone,
            User.org_id == org_id,
            User.is_active == True
        ).first()
        
        if user:
            return user
        
        # Also try to find by driver phone (normalized)
        from app.models import Driver
        driver = db.query(Driver).filter(
            func.replace(func.replace(func.replace(Driver.phone, '-', ''), ' ', ''), '.', '') == normalized_phone,
            Driver.org_id == org_id,
            Driver.is_active == True
        ).first()
        
        if driver and driver.user:
            return driver.user
        
        return None