"""
Phone Authentication and Permissions API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.middleware.tenant import get_current_org_id, get_current_user_id, is_super_admin
from app.services.permission_service import PermissionService
from app.models.permissions import Permission, UserPermission
from app.models import User, Organization
from app.core.security import create_access_token_for_user
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from uuid import UUID

router = APIRouter(prefix="/phone-auth", tags=["Phone Authentication"])
permissions_router = APIRouter(prefix="/permissions", tags=["Permissions"])


# ============ Phone Auth Schemas ============

class PhoneLoginRequest(BaseModel):
    phone: str = Field(..., description="מספר טלפון", example="050-1234567")
    org_slug: Optional[str] = Field(None, description="שם הארגון (אופציונלי)", example="demo")


class OTPRequest(BaseModel):
    phone: str = Field(..., description="מספר טלפון")
    otp_code: str = Field(..., description="קוד אימות", example="123456")
    org_slug: Optional[str] = Field(None, description="שם הארגון")


class PhoneAuthResponse(BaseModel):
    success: bool
    message: str
    otp_sent: Optional[bool] = None
    expires_in_minutes: Optional[int] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict
    permissions: List[str]


# ============ Permissions Schemas ============

class PermissionGrant(BaseModel):
    user_id: int
    permission_name: str
    expires_at: Optional[str] = None
    notes: Optional[str] = None


class PermissionBulkUpdate(BaseModel):
    user_id: int
    permissions: List[str]


class UserPermissionsResponse(BaseModel):
    user_id: int
    user_name: str
    org_role: str
    permissions: List[Dict]
    available_permissions: Dict[str, str]


# ============ Phone Auth Endpoints ============

@router.post("/send-otp", response_model=PhoneAuthResponse)
async def send_otp(
    request_data: PhoneLoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    שליחת קוד OTP למספר טלפון
    
    Steps:
    1. מחפש את הארגון לפי slug
    2. מחפש משתמש לפי מספר טלפון
    3. שולח קוד OTP ל-SMS
    """
    try:
        # Find organization
        org = None
        if request_data.org_slug:
            org = db.query(Organization).filter(Organization.slug == request_data.org_slug).first()
        else:
            # If no slug provided, try to find by domain or use default
            org = db.query(Organization).filter(Organization.status == "active").first()
        
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
        
        # Find user by phone
        user = PermissionService.find_user_by_phone(
            db=db,
            phone=request_data.phone,
            org_id=org.id
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found with this phone number"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled"
            )
        
        # Send OTP
        user_agent = request.headers.get("user-agent")
        ip_address = request.client.host if hasattr(request, 'client') else None
        
        otp = PermissionService.send_otp(
            db=db,
            phone=request_data.phone,
            org_id=org.id,
            user_agent=user_agent,
            ip_address=ip_address
        )
        
        return PhoneAuthResponse(
            success=True,
            message=f"קוד אימות נשלח ל-{request_data.phone}",
            otp_sent=True,
            expires_in_minutes=5
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending OTP: {str(e)}"
        )


@router.post("/verify-otp", response_model=LoginResponse)
async def verify_otp_and_login(
    request_data: OTPRequest,
    db: Session = Depends(get_db)
):
    """
    אימות קוד OTP והתחברות למערכת
    
    Steps:
    1. מאמת את הקוד
    2. מחזיר JWT token
    3. מחזיר הרשאות המשתמש
    """
    try:
        # Find organization
        org = None
        if request_data.org_slug:
            org = db.query(Organization).filter(Organization.slug == request_data.org_slug).first()
        else:
            org = db.query(Organization).filter(Organization.status == "active").first()
        
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
        
        # Verify OTP
        is_valid = PermissionService.verify_otp(
            db=db,
            phone=request_data.phone,
            otp_code=request_data.otp_code,
            org_id=org.id
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired OTP code"
            )
        
        # Find user
        user = PermissionService.find_user_by_phone(
            db=db,
            phone=request_data.phone,
            org_id=org.id
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get user permissions
        permissions = PermissionService.get_user_permissions(user)
        
        # Create access token
        access_token = create_access_token_for_user(user)
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user.id,
                "name": user.name,
                "phone": user.phone,
                "email": user.email,
                "org_id": str(user.org_id),
                "org_name": org.name,
                "org_slug": org.slug,
                "org_role": user.org_role,
                "is_super_admin": user.is_super_admin
            },
            permissions=permissions
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying OTP: {str(e)}"
        )


@router.post("/resend-otp", response_model=PhoneAuthResponse)
async def resend_otp(
    request_data: PhoneLoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    שליחה מחדש של קוד OTP
    """
    return await send_otp(request_data, request, db)


# ============ Permissions Management Endpoints ============

@permissions_router.get("/available")
async def get_available_permissions():
    """
    קבלת רשימת כל ההרשאות הזמינות במערכת
    """
    return {
        "permissions": Permission.get_all_permissions()
    }


@permissions_router.get("/user/{user_id}", response_model=UserPermissionsResponse)
async def get_user_permissions(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    קבלת הרשאות של משתמש ספציפי (מנהל בלבד)
    """
    current_user_id = get_current_user_id(request)
    current_user = db.query(User).filter(User.id == current_user_id).first()
    
    # Check if user has permission to view permissions
    if not (current_user.is_super_admin or 
            PermissionService.has_permission(current_user, Permission.USERS_PERMISSIONS)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No permission to view user permissions"
        )
    
    # Get target user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get user permissions
    user_permissions = []
    for perm in user.permissions:
        user_permissions.append({
            "permission_name": perm.permission_name,
            "granted": perm.granted,
            "granted_at": perm.granted_at.isoformat() if perm.granted_at else None,
            "expires_at": perm.expires_at.isoformat() if perm.expires_at else None,
            "notes": perm.notes,
            "is_active": perm.is_active
        })
    
    return UserPermissionsResponse(
        user_id=user.id,
        user_name=user.name,
        org_role=user.org_role,
        permissions=user_permissions,
        available_permissions=Permission.get_all_permissions()
    )


@permissions_router.post("/grant")
async def grant_permission(
    request_data: PermissionGrant,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    מתן הרשאה למשתמש (מנהל בלבד)
    """
    current_user_id = get_current_user_id(request)
    current_user = db.query(User).filter(User.id == current_user_id).first()
    
    # Check if user has permission to grant permissions
    if not (current_user.is_super_admin or 
            PermissionService.has_permission(current_user, Permission.USERS_PERMISSIONS)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No permission to grant permissions"
        )
    
    try:
        # Parse expires_at if provided
        expires_at = None
        if request_data.expires_at:
            from datetime import datetime
            expires_at = datetime.fromisoformat(request_data.expires_at)
        
        # Grant permission
        permission = PermissionService.grant_permission(
            db=db,
            user_id=request_data.user_id,
            permission_name=request_data.permission_name,
            granted_by_user_id=current_user_id,
            expires_at=expires_at,
            notes=request_data.notes
        )
        
        return {
            "success": True,
            "message": f"Permission {request_data.permission_name} granted to user {request_data.user_id}",
            "permission": {
                "id": permission.id,
                "permission_name": permission.permission_name,
                "granted_at": permission.granted_at.isoformat(),
                "expires_at": permission.expires_at.isoformat() if permission.expires_at else None
            }
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@permissions_router.delete("/revoke/{user_id}/{permission_name}")
async def revoke_permission(
    user_id: int,
    permission_name: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    ביטול הרשאה ממשתמש (מנהל בלבד)
    """
    current_user_id = get_current_user_id(request)
    current_user = db.query(User).filter(User.id == current_user_id).first()
    
    # Check if user has permission to revoke permissions
    if not (current_user.is_super_admin or 
            PermissionService.has_permission(current_user, Permission.USERS_PERMISSIONS)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No permission to revoke permissions"
        )
    
    success = PermissionService.revoke_permission(
        db=db,
        user_id=user_id,
        permission_name=permission_name,
        revoked_by_user_id=current_user_id
    )
    
    if success:
        return {
            "success": True,
            "message": f"Permission {permission_name} revoked from user {user_id}"
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )


@permissions_router.post("/bulk-update")
async def bulk_update_permissions(
    request_data: PermissionBulkUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    עדכון מלא של הרשאות משתמש (מנהל בלבד)
    """
    current_user_id = get_current_user_id(request)
    current_user = db.query(User).filter(User.id == current_user_id).first()
    
    # Check if user has permission to manage permissions
    if not (current_user.is_super_admin or 
            PermissionService.has_permission(current_user, Permission.USERS_PERMISSIONS)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No permission to manage permissions"
        )
    
    try:
        PermissionService.bulk_update_permissions(
            db=db,
            user_id=request_data.user_id,
            permissions=request_data.permissions,
            granted_by_user_id=current_user_id
        )
        
        return {
            "success": True,
            "message": f"Updated permissions for user {request_data.user_id}",
            "granted_permissions": len(request_data.permissions)
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@permissions_router.post("/assign-defaults/{user_id}")
async def assign_default_permissions(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    הקצאת הרשאות ברירת מחדל לפי תפקיד (מנהל בלבד)
    """
    current_user_id = get_current_user_id(request)
    current_user = db.query(User).filter(User.id == current_user_id).first()
    
    # Check if user has permission to manage permissions
    if not (current_user.is_super_admin or 
            PermissionService.has_permission(current_user, Permission.USERS_PERMISSIONS)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No permission to manage permissions"
        )
    
    # Get target user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    try:
        PermissionService.grant_default_permissions(
            db=db,
            user=user,
            granted_by_user_id=current_user_id
        )
        
        return {
            "success": True,
            "message": f"Assigned default permissions for role '{user.org_role}' to user {user.name}",
            "user_role": user.org_role
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error assigning default permissions: {str(e)}"
        )