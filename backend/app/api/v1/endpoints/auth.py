from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_access_token_for_user, decode_access_token
from app.models import User, Driver, Organization
from app.models.permissions import PermissionModel, UserPermission
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID

router = APIRouter()
security = HTTPBearer()


class LoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserInfo(BaseModel):
    id: int
    name: str
    email: str
    org_id: UUID
    roles: list[str]


@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint - authenticate user with email OR phone number and return JWT token
    Drivers can login with their phone number
    """
    user = None
    
    # Try to find user by email or phone
    if credentials.email:
        user = db.query(User).filter(User.email == credentials.email).first()
    elif credentials.phone:
        # Find driver by phone, then get associated user
        driver = db.query(Driver).filter(Driver.phone == credentials.phone).first()
        if driver and driver.user_id:
            user = db.query(User).filter(User.id == driver.user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials"
        )
    
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Check if organization is suspended
    org = db.query(Organization).filter(Organization.id == user.org_id).first()
    if org and org.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Organization is suspended: {org.suspended_reason or 'Please contact support'}"
        )
    
    # Get user roles
    roles = [role.role.value for role in user.roles]
    
    # Create access token with org_id, is_super_admin, org_role
    access_token = create_access_token_for_user(user)
    
    return LoginResponse(
        access_token=access_token,
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "org_id": str(user.org_id),  # UUID to string
            "org_name": org.name if org else None,
            "org_slug": org.slug if org else None,
            "plan_type": org.plan_type if org else None,
            "trial_ends_at": org.trial_ends_at.isoformat() if org and org.trial_ends_at else None,
            "is_super_admin": user.is_super_admin or False,
            "org_role": user.org_role or "user",
            "roles": roles
        }
    )


@router.get("/me", response_model=UserInfo)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Get current user information from JWT token
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    roles = [role.role.value for role in user.roles]
    
    return UserInfo(
        id=user.id,
        name=user.name,
        email=user.email,
        org_id=user.org_id,
        roles=roles
    )


@router.post("/logout")
async def logout():
    """
    Logout endpoint (client should discard token)
    """
    return {"message": "Successfully logged out"}


@router.get("/my-permissions")
async def get_my_permissions(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Get current user's permissions (no admin access required)
    """
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
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
        permissions_response.append({
            "permission_id": perm.id,
            "permission_name": perm.name,
            "permission_description": perm.description,
            "granted": perm.name in user_permission_names
        })
    
    return permissions_response
