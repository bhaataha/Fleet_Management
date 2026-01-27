"""
Admin User Management Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from app.core.database import get_db
from app.models import User, UserPermission
from app.models.permissions import PermissionModel
from app.core.tenant import get_org_id, get_user_id, require_super_admin, is_super_admin
from app.core.security import get_password_hash
from app.services.permission_service import PermissionService
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime

router = APIRouter(prefix="/admin/users", tags=["Admin - User Management"])

# Pydantic Models
class UserPermissionResponse(BaseModel):
    permission_id: int
    permission_name: str
    permission_description: str
    granted: bool
    
    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None  # Optional for drivers
    phone: Optional[str]
    org_role: str
    is_active: bool
    created_at: datetime
    permissions: List[UserPermissionResponse] = []
    
    class Config:
        from_attributes = True

class UserCreateRequest(BaseModel):
    name: str
    email: Optional[EmailStr] = None  # Optional - drivers use phone login
    phone: str
    password: str
    org_role: str = "driver"  # admin, dispatcher, accounting, driver

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    org_role: Optional[str] = None
    is_active: Optional[bool] = None

class UserPermissionUpdateRequest(BaseModel):
    user_id: int
    permission_ids: List[int]  # List of permission IDs to grant

class PasswordResetRequest(BaseModel):
    new_password: str

def require_admin_access(request: Request, db: Session = Depends(get_db)):
    """
    Dependency to ensure only admins can access user management
    """
    user_id = get_user_id(request)
    org_id = get_org_id(request)
    
    user = db.query(User).filter(
        User.id == user_id,
        User.org_id == org_id
    ).first()
    
    if not user or user.org_role not in ["admin", "owner"] or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required for user management"
        )
    
    return user

@router.get("", response_model=List[UserResponse])
async def list_organization_users(
    request: Request,
    include_inactive: bool = False,
    admin_user: User = Depends(require_admin_access),
    db: Session = Depends(get_db)
):
    """
    List all users in the organization
    """
    org_id = get_org_id(request)
    
    query = db.query(User).options(
        joinedload(User.permissions)
    ).filter(User.org_id == org_id)
    
    if not include_inactive:
        query = query.filter(User.is_active == True)
    
    users = query.order_by(User.created_at.desc()).all()
    
    # Build response with permissions
    user_responses = []
    for user in users:
        # Get all permissions for the organization
        all_permissions = db.query(PermissionModel).all()
        user_permission_names = {up.permission_name for up in user.permissions if up.granted}
        
        permissions_response = []
        for perm in all_permissions:
            permissions_response.append(UserPermissionResponse(
                permission_id=perm.id,
                permission_name=perm.name,
                permission_description=perm.description,
                granted=perm.name in user_permission_names
            ))
        
        user_responses.append(UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            phone=user.phone,
            org_role=user.org_role,
            is_active=user.is_active,
            created_at=user.created_at,
            permissions=permissions_response
        ))
    
    return user_responses

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: Request,
    user_data: UserCreateRequest,
    admin_user: User = Depends(require_admin_access),
    db: Session = Depends(get_db)
):
    """
    Create a new user in the organization
    """
    org_id = get_org_id(request)
    
    # Normalize phone number
    normalized_phone = user_data.phone.replace('-', '').replace(' ', '')
    if not normalized_phone.startswith('0'):
        normalized_phone = '0' + normalized_phone
    
    # Generate email if not provided (for drivers)
    if not user_data.email:
        # Use phone number as email: 0501234567@drivers.local
        user_data.email = f"{normalized_phone}@drivers.local"
    
    # Check for existing user
    conditions = [User.org_id == org_id]
    
    # Check phone (always required)
    conditions.append(User.phone == normalized_phone)
    
    # Check email only if it's a real email (not auto-generated)
    if user_data.email and not user_data.email.endswith('@drivers.local'):
        conditions.append(User.email == user_data.email)
    
    existing_user = db.query(User).filter(
        and_(
            User.org_id == org_id,
            or_(*conditions[1:])  # Skip org_id from OR conditions
        )
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this phone or email already exists"
        )
    
    # Create user
    user = User(
        org_id=org_id,
        name=user_data.name,
        email=user_data.email,
        phone=normalized_phone,
        password_hash=get_password_hash(user_data.password),
        org_role=user_data.org_role,
        is_active=True,
        is_super_admin=False
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Set default permissions based on role
    PermissionService.set_default_permissions(db, user.id, user_data.org_role)
    
    # Return user with permissions
    all_permissions = db.query(PermissionModel).all()
    user_permissions = db.query(UserPermission).filter(
        UserPermission.user_id == user.id
    ).all()
    user_permission_names = {up.permission_name for up in user_permissions if up.granted}
    
    permissions_response = []
    for perm in all_permissions:
        permissions_response.append(UserPermissionResponse(
            permission_id=perm.id,
            permission_name=perm.name,
            permission_description=perm.description,
            granted=perm.name in user_permission_names
        ))
    
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        org_role=user.org_role,
        is_active=user.is_active,
        created_at=user.created_at,
        permissions=permissions_response
    )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    request: Request,
    admin_user: User = Depends(require_admin_access),
    db: Session = Depends(get_db)
):
    """
    Get specific user details
    """
    org_id = get_org_id(request)
    
    user = db.query(User).filter(
        User.id == user_id,
        User.org_id == org_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get permissions
    all_permissions = db.query(PermissionModel).all()
    user_permissions = db.query(UserPermission).filter(
        UserPermission.user_id == user_id
    ).all()
    user_permission_names = {up.permission_name for up in user_permissions if up.granted}
    
    permissions_response = []
    for perm in all_permissions:
        permissions_response.append(UserPermissionResponse(
            permission_id=perm.id,
            permission_name=perm.name,
            permission_description=perm.description,
            granted=perm.name in user_permission_names
        ))
    
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        org_role=user.org_role,
        is_active=user.is_active,
        created_at=user.created_at,
        permissions=permissions_response
    )

@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    request: Request,
    user_data: UserUpdateRequest,
    admin_user: User = Depends(require_admin_access),
    db: Session = Depends(get_db)
):
    """
    Update user information
    """
    org_id = get_org_id(request)
    
    user = db.query(User).filter(
        User.id == user_id,
        User.org_id == org_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deactivating themselves
    if user_id == admin_user.id and user_data.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    # Update fields
    update_data = user_data.dict(exclude_unset=True)
    
    # Handle phone normalization
    if "phone" in update_data and update_data["phone"]:
        normalized_phone = update_data["phone"].replace('-', '').replace(' ', '')
        if not normalized_phone.startswith('0'):
            normalized_phone = '0' + normalized_phone
        update_data["phone"] = normalized_phone
        
        # Check for conflicts
        existing = db.query(User).filter(
            User.phone == normalized_phone,
            User.org_id == org_id,
            User.id != user_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already exists"
            )
    
    # Check email conflicts
    if "email" in update_data:
        existing = db.query(User).filter(
            User.email == update_data["email"],
            User.org_id == org_id,
            User.id != user_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
    
    for key, value in update_data.items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    
    # Return updated user with permissions
    all_permissions = db.query(PermissionModel).all()
    user_permissions = db.query(UserPermission).filter(
        UserPermission.user_id == user_id
    ).all()
    user_permission_names = {up.permission_name for up in user_permissions if up.granted}
    
    permissions_response = []
    for perm in all_permissions:
        permissions_response.append(UserPermissionResponse(
            permission_id=perm.id,
            permission_name=perm.name,
            permission_description=perm.description,
            granted=perm.name in user_permission_names
        ))
    
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        org_role=user.org_role,
        is_active=user.is_active,
        created_at=user.created_at,
        permissions=permissions_response
    )

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    request: Request,
    admin_user: User = Depends(require_admin_access),
    db: Session = Depends(get_db)
):
    """
    Delete a user (soft delete - deactivate)
    """
    org_id = get_org_id(request)
    
    user = db.query(User).filter(
        User.id == user_id,
        User.org_id == org_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deleting themselves
    if user_id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Soft delete - deactivate user
    user.is_active = False
    db.commit()
    
    return {"message": "User deactivated successfully"}

@router.post("/{user_id}/permissions")
async def update_user_permissions(
    user_id: int,
    request: Request,
    permissions_data: UserPermissionUpdateRequest,
    admin_user: User = Depends(require_admin_access),
    db: Session = Depends(get_db)
):
    """
    Update user permissions
    """
    org_id = get_org_id(request)
    
    user = db.query(User).filter(
        User.id == user_id,
        User.org_id == org_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Remove existing permissions
    db.query(UserPermission).filter(
        UserPermission.user_id == user_id
    ).delete()
    
    # Add new permissions
    for permission_id in permissions_data.permission_ids:
        # Verify permission exists
        permission = db.query(PermissionModel).filter(
            PermissionModel.id == permission_id
        ).first()
        
        if permission:
            user_permission = UserPermission(
                user_id=user_id,
                org_id=org_id,
                permission_name=permission.name,
                granted=True,
                granted_by=admin_user.id
            )
            db.add(user_permission)
    
    db.commit()
    
    return {"message": f"Permissions updated for user {user.name}"}

@router.post("/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    request: Request,
    password_data: PasswordResetRequest,
    admin_user: User = Depends(require_admin_access),
    db: Session = Depends(get_db)
):
    """
    Reset user password
    """
    org_id = get_org_id(request)
    
    user = db.query(User).filter(
        User.id == user_id,
        User.org_id == org_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": f"Password reset successfully for user {user.name}"}

@router.get("/{user_id}/permissions", response_model=List[UserPermissionResponse])
async def get_user_permissions(
    user_id: int,
    request: Request,
    admin_user: User = Depends(require_admin_access),
    db: Session = Depends(get_db)
):
    """
    Get all permissions for a user
    """
    org_id = get_org_id(request)
    
    user = db.query(User).filter(
        User.id == user_id,
        User.org_id == org_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get all permissions and user's granted permissions
    all_permissions = db.query(PermissionModel).all()
    user_permissions = db.query(UserPermission).filter(
        UserPermission.user_id == user_id,
        UserPermission.granted == True
    ).all()
    user_permission_names = {up.permission_name for up in user_permissions}
    
    permissions_response = []
    for perm in all_permissions:
        permissions_response.append(UserPermissionResponse(
            permission_id=perm.id,
            permission_name=perm.name,
            permission_description=perm.description,
            granted=perm.name in user_permission_names
        ))
    
    return permissions_response
