"""
Super Admin Endpoints - Manage organizations, users, and system-wide settings
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Organization, User
from app.core.tenant import require_super_admin, get_org_stats, is_super_admin
from app.core.security import get_password_hash
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Union
from uuid import UUID, uuid4
from datetime import datetime, date

router = APIRouter(prefix="/super-admin", tags=["Super Admin"])


# Pydantic Models
class OrganizationCreate(BaseModel):
    name: str
    slug: str
    display_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    vat_id: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = "IL"
    plan_type: str = "trial"  # trial, basic, professional, enterprise
    trial_days: Optional[int] = 30
    max_trucks: int = 5
    max_drivers: int = 5
    max_storage_gb: int = 10
    timezone: str = "Asia/Jerusalem"
    locale: str = "he"
    currency: str = "ILS"


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    vat_id: Optional[str] = None
    plan_type: Optional[str] = None
    plan_start_date: Optional[date] = None
    plan_end_date: Optional[date] = None
    trial_ends_at: Optional[datetime] = None
    max_trucks: Optional[int] = None
    max_drivers: Optional[int] = None
    max_storage_gb: Optional[int] = None
    status: Optional[str] = None
    suspended_reason: Optional[str] = None


class OrganizationResponse(BaseModel):
    id: Union[int, UUID]  # Support both Integer (current) and UUID (future)
    name: str
    slug: str
    display_name: Optional[str]
    contact_email: Optional[str]
    plan_type: str
    status: str
    max_trucks: Optional[int]
    max_drivers: Optional[int]
    total_trucks: int
    total_drivers: int
    total_jobs_completed: int
    created_at: datetime
    trial_ends_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class OrganizationDetail(OrganizationResponse):
    contact_name: Optional[str]
    contact_phone: Optional[str]
    vat_id: Optional[str]
    address: Optional[str]
    city: Optional[str]
    country: Optional[str]
    max_storage_gb: Optional[int]
    storage_used_gb: float
    suspended_reason: Optional[str]
    stats: Optional[dict] = None


class SuspendRequest(BaseModel):
    reason: str


class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str


# Endpoints

@router.get("/organizations", response_model=dict)
def list_organizations(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    plan_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all organizations (Super Admin only)
    
    Filters:
    - status_filter: active, suspended, inactive
    - plan_filter: trial, basic, professional, enterprise
    """
    require_super_admin(request)
    
    query = db.query(Organization)
    
    if status_filter:
        query = query.filter(Organization.status == status_filter)
    
    if plan_filter:
        query = query.filter(Organization.plan_type == plan_filter)
    
    total = query.count()
    orgs = query.order_by(Organization.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [OrganizationResponse.from_orm(org) for org in orgs]
    }


@router.post("/organizations", response_model=OrganizationDetail, status_code=status.HTTP_201_CREATED)
def create_organization(
    request: Request,
    data: OrganizationCreate,
    db: Session = Depends(get_db)
):
    """
    Create new organization (Super Admin only)
    """
    require_super_admin(request)
    
    # Check if slug already exists
    existing = db.query(Organization).filter(Organization.slug == data.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Organization with slug '{data.slug}' already exists"
        )
    
    # Calculate trial end date
    trial_ends_at = None
    if data.plan_type == "trial" and data.trial_days:
        from datetime import timedelta
        trial_ends_at = datetime.utcnow() + timedelta(days=data.trial_days)
    
    # Create organization
    org = Organization(
        id=uuid4(),
        name=data.name,
        slug=data.slug,
        display_name=data.display_name or data.name,
        contact_name=data.contact_name or "Admin",
        contact_email=data.contact_email or f"admin@{data.slug}.com",
        contact_phone=data.contact_phone,
        vat_id=data.vat_id,
        address=data.address,
        city=data.city,
        postal_code=data.postal_code,
        country=data.country,
        plan_type=data.plan_type,
        plan_start_date=datetime.utcnow().date() if data.plan_type != "trial" else None,
        trial_ends_at=trial_ends_at,
        max_trucks=data.max_trucks,
        max_drivers=data.max_drivers,
        max_storage_gb=data.max_storage_gb,
        timezone=data.timezone,
        locale=data.locale,
        currency=data.currency,
        status="active",
        is_active=True,
        total_trucks=0,
        total_drivers=0,
        total_jobs_completed=0,
        storage_used_gb=0.0,
        created_at=datetime.utcnow()
    )
    
    db.add(org)
    db.commit()
    db.refresh(org)
    
    # Get stats
    stats = get_org_stats(db, org.id)
    
    result = OrganizationDetail.from_orm(org)
    result.stats = stats
    
    return result


@router.get("/organizations/{org_id}", response_model=OrganizationDetail)
def get_organization(
    org_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get organization details with statistics (Super Admin only)
    """
    require_super_admin(request)
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Get detailed stats
    stats = get_org_stats(db, org.id)
    
    result = OrganizationDetail.from_orm(org)
    result.stats = stats
    
    return result


@router.patch("/organizations/{org_id}", response_model=OrganizationDetail)
def update_organization(
    org_id: int,
    request: Request,
    data: OrganizationUpdate,
    db: Session = Depends(get_db)
):
    """
    Update organization (Super Admin only)
    """
    require_super_admin(request)
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Update fields
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(org, key, value)
    
    org.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(org)
    
    # Get stats
    stats = get_org_stats(db, org.id)
    
    result = OrganizationDetail.from_orm(org)
    result.stats = stats
    
    return result


@router.post("/organizations/{org_id}/suspend", response_model=dict)
def suspend_organization(
    org_id: int,
    request: Request,
    suspend_data: SuspendRequest,
    db: Session = Depends(get_db)
):
    """
    Suspend organization (Super Admin only)
    Users from suspended orgs cannot login
    """
    require_super_admin(request)
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    if org.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization is already suspended"
        )
    
    org.status = "suspended"
    org.suspended_reason = suspend_data.reason
    org.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Organization '{org.name}' suspended",
        "reason": suspend_data.reason
    }


@router.post("/organizations/{org_id}/activate", response_model=dict)
def activate_organization(
    org_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Activate suspended organization (Super Admin only)
    """
    require_super_admin(request)
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    org.status = "active"
    org.suspended_reason = None
    org.is_active = True
    org.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Organization '{org.name}' activated"
    }


@router.delete("/organizations/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization(
    org_id: int,
    request: Request,
    confirm: bool = False,
    db: Session = Depends(get_db)
):
    """
    Delete organization and ALL its data (Super Admin only)
    
    ⚠️ WARNING: This will CASCADE DELETE all customers, sites, drivers, 
    trucks, jobs, and all related data!
    
    Must pass confirm=true to actually delete.
    """
    require_super_admin(request)
    
    if not confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must pass confirm=true to delete organization. This will delete ALL org data!"
        )
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Get stats before deletion
    stats = get_org_stats(db, org.id)
    
    org_name = org.name
    
    # Delete organization (will CASCADE to all related tables)
    db.delete(org)
    db.commit()
    
    return {
        "success": True,
        "message": f"Organization '{org_name}' and all its data deleted",
        "deleted_counts": stats
    }


@router.get("/organizations/{org_id}/users", response_model=dict)
def list_organization_users(
    org_id: int,
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    List all users in an organization (Super Admin only)
    """
    require_super_admin(request)
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    query = db.query(User).filter(User.org_id == org_id)
    total = query.count()
    users = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "organization": org.name,
        "items": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "phone": u.phone,
                "is_active": u.is_active,
                "is_super_admin": u.is_super_admin,
                "org_role": u.org_role,
                "created_at": u.created_at
            }
            for u in users
        ]
    }


@router.get("/stats", response_model=dict)
def get_system_stats(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get system-wide statistics (Super Admin only)
    """
    require_super_admin(request)
    
    from app.models import Customer, Site, Driver, Truck, Job
    
    total_orgs = db.query(Organization).count()
    active_orgs = db.query(Organization).filter(Organization.status == "active").count()
    suspended_orgs = db.query(Organization).filter(Organization.status == "suspended").count()
    trial_orgs = db.query(Organization).filter(Organization.plan_type == "trial").count()
    
    total_users = db.query(User).count()
    total_customers = db.query(Customer).count()
    total_sites = db.query(Site).count()
    total_drivers = db.query(Driver).count()
    total_trucks = db.query(Truck).count()
    total_jobs = db.query(Job).count()
    completed_jobs = db.query(Job).filter(Job.status == "CLOSED").count()  # Enum value is uppercase
    
    return {
        "organizations": {
            "total": total_orgs,
            "active": active_orgs,
            "suspended": suspended_orgs,
            "trial": trial_orgs
        },
        "resources": {
            "total_users": total_users,
            "total_customers": total_customers,
            "total_sites": total_sites,
            "total_drivers": total_drivers,
            "total_trucks": total_trucks
        },
        "jobs": {
            "total": total_jobs,
            "completed": completed_jobs,
            "completion_rate": round(completed_jobs / total_jobs * 100, 2) if total_jobs > 0 else 0
        }
    }


@router.post("/organizations/{org_id}/reset-password", response_model=dict)
def reset_organization_user_password(
    org_id: int,
    request: Request,
    reset_data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password for a user in an organization (Super Admin only)
    
    This allows Super Admin to reset the password of any user in any organization,
    typically the admin/owner user for that organization.
    """
    require_super_admin(request)
    
    # Verify organization exists
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Find user by email in that organization
    user = db.query(User).filter(
        User.org_id == org_id,
        User.email == reset_data.email
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email '{reset_data.email}' not found in organization '{org.name}'"
        )
    
    # Hash and update password
    user.password_hash = get_password_hash(reset_data.new_password)
    user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Password reset successfully for user '{user.email}' in organization '{org.name}'",
        "user_id": user.id,
        "user_email": user.email,
        "user_name": user.name
    }
