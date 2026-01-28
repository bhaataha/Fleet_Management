"""
Users Management Endpoints - Multi-Tenant RBAC
endpoints: /api/users
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional, Union
from datetime import datetime
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_password_hash, get_current_user
from app.middleware.tenant import get_current_org_id
from app.models import User, Organization, Driver
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/users", tags=["Users"])


# ============================================================================
# Pydantic Schemas
# ============================================================================

class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    org_role: str = "user"  # user, admin, dispatcher, accounting, driver


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    org_role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    org_id: Union[int, UUID]
    name: str
    email: str
    phone: str
    org_role: str
    is_active: bool
    is_super_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserDetailResponse(UserResponse):
    driver_id: Optional[int] = None
    driver_name: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ============================================================================
# Helper Functions
# ============================================================================

def require_admin_or_owner(current_user: User):
    """Require user to be admin or owner"""
    if current_user.org_role not in ["admin", "owner"] and not current_user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Owner access required"
        )


# ============================================================================
# CRUD Endpoints
# ============================================================================

@router.get("", response_model=List[UserResponse])
async def list_users(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    is_active: Optional[bool] = None,
    role_filter: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all users in organization
    
    Required: Admin/Owner role
    
    Filters:
    - is_active: Filter by active status
    - role_filter: Filter by org_role
    - search: Search by name, email, or phone
    """
    require_admin_or_owner(current_user)
    
    org_id = get_current_org_id(request)
    
    query = db.query(User).filter(User.org_id == org_id)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    if role_filter:
        query = query.filter(User.org_role == role_filter)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.name.ilike(search_term)) |
            (User.email.ilike(search_term)) |
            (User.phone.ilike(search_term))
        )
    
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    
    return users


@router.get("/me", response_model=UserDetailResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's profile
    
    No special permissions required - users can always view their own profile
    """
    # Check if user has driver profile
    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    
    result = UserDetailResponse.from_orm(current_user)
    if driver:
        result.driver_id = driver.id
        result.driver_name = driver.name
    
    return result


@router.get("/{user_id}", response_model=UserDetailResponse)
async def get_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user by ID
    
    Required: Admin/Owner role OR viewing own profile
    """
    org_id = get_current_org_id(request)
    
    # Allow users to view their own profile
    if user_id != current_user.id:
        require_admin_or_owner(current_user)
    
    user = db.query(User).filter(
        User.id == user_id,
        User.org_id == org_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user has driver profile
    driver = db.query(Driver).filter(Driver.user_id == user.id).first()
    
    result = UserDetailResponse.from_orm(user)
    if driver:
        result.driver_id = driver.id
        result.driver_name = driver.name
    
    return result


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: Request,
    data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create new user in organization
    
    Required: Admin/Owner role
    
    Note: Email must be unique across ALL organizations
    """
    require_admin_or_owner(current_user)
    
    org_id = get_current_org_id(request)
    
    # Check if email already exists (globally)
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{data.email}' already exists"
        )
    
    # Validate org_role
    valid_roles = ["user", "admin", "dispatcher", "accounting", "driver", "owner"]
    if data.org_role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    # Create user
    new_user = User(
        org_id=org_id,
        name=data.name,
        email=data.email,
        phone=data.phone,
        password_hash=get_password_hash(data.password),
        org_role=data.org_role,
        is_active=True,
        is_super_admin=False,
        created_at=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    request: Request,
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user
    
    Required: Admin/Owner role OR updating own profile (limited fields)
    
    Users can update their own: name, phone
    Admins can update: name, phone, email, org_role, is_active
    """
    org_id = get_current_org_id(request)
    
    user = db.query(User).filter(
        User.id == user_id,
        User.org_id == org_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check permissions
    is_updating_self = (user_id == current_user.id)
    is_admin = current_user.org_role in ["admin", "owner"] or current_user.is_super_admin
    
    if not is_updating_self and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update other users' profiles"
        )
    
    # Apply updates based on permissions
    update_data = data.dict(exclude_unset=True)
    
    # Users can only update their own name/phone
    if is_updating_self and not is_admin:
        allowed_fields = {"name", "phone"}
        restricted_fields = set(update_data.keys()) - allowed_fields
        if restricted_fields:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cannot update fields: {', '.join(restricted_fields)}"
            )
    
    # Check email uniqueness if changing
    if "email" in update_data and update_data["email"] != user.email:
        existing = db.query(User).filter(User.email == update_data["email"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email '{update_data['email']}' already exists"
            )
    
    # Apply updates
    for key, value in update_data.items():
        setattr(user, key, value)
    
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete user (soft delete - sets is_active=False)
    
    Required: Admin/Owner role
    
    Note: Cannot delete yourself
    """
    require_admin_or_owner(current_user)
    
    org_id = get_current_org_id(request)
    
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(User).filter(
        User.id == user_id,
        User.org_id == org_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Soft delete
    user.is_active = False
    user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return None


# ============================================================================
# Password Management
# ============================================================================

@router.post("/me/change-password", response_model=dict)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change current user's password
    
    Requires current password for verification
    """
    from app.core.security import verify_password
    
    # Verify current password
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(data.new_password)
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "message": "Password changed successfully"
    }


@router.post("/{user_id}/reset-password", response_model=dict)
async def reset_user_password(
    user_id: int,
    new_password: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reset user's password (Admin only)
    
    Required: Admin/Owner role
    """
    require_admin_or_owner(current_user)
    
    org_id = get_current_org_id(request)
    
    user = db.query(User).filter(
        User.id == user_id,
        User.org_id == org_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate new password
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )
    
    # Update password
    user.password_hash = get_password_hash(new_password)
    user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Password reset successfully for user '{user.email}'"
    }
