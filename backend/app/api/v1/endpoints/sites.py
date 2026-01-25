from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.core.database import get_db
from app.models import Site
from app.middleware.tenant import get_current_org_id
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

router = APIRouter()


class SiteBase(BaseModel):
    customer_id: int
    name: str
    address: Optional[str] = None
    lat: Optional[Decimal] = None
    lng: Optional[Decimal] = None
    opening_hours: Optional[str] = None
    access_notes: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None


class SiteCreate(SiteBase):
    pass


class SiteUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[Decimal] = None
    lng: Optional[Decimal] = None
    opening_hours: Optional[str] = None
    access_notes: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: Optional[bool] = None


class SiteResponse(SiteBase):
    id: int
    org_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


@router.get("", response_model=List[SiteResponse])
async def list_sites(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    customer_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """
    List all sites with pagination and filters (filtered by org_id from JWT)
    """
    org_id = get_current_org_id(request)
    
    query = db.query(Site).filter(Site.org_id == org_id)
    
    if customer_id:
        query = query.filter(Site.customer_id == customer_id)
    if is_active is not None:
        query = query.filter(Site.is_active == is_active)
    
    sites = query.offset(skip).limit(limit).all()
    return sites


@router.get("/{site_id}", response_model=SiteResponse)
async def get_site(
    site_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get site by ID (filtered by org_id from JWT)
    """
    org_id = get_current_org_id(request)
    
    site = db.query(Site).filter(
        Site.id == site_id,
        Site.org_id == org_id
    ).first()
    
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    return site


@router.post("", response_model=SiteResponse, status_code=201)
async def create_site(
    site: SiteCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Create new site (auto-assigned to current org from JWT)
    """
    org_id = get_current_org_id(request)
    
    db_site = Site(org_id=org_id, **site.dict())
    db.add(db_site)
    db.commit()
    db.refresh(db_site)
    return db_site


@router.patch("/{site_id}", response_model=SiteResponse)
async def update_site(
    site_id: int,
    site_update: SiteUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Update site (filtered by org_id from JWT)
    """
    org_id = get_current_org_id(request)
    
    db_site = db.query(Site).filter(
        Site.id == site_id,
        Site.org_id == org_id
    ).first()
    
    if not db_site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    update_data = site_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_site, field, value)
    
    db.commit()
    db.refresh(db_site)
    return db_site


@router.delete("/{site_id}", status_code=204)
async def delete_site(
    site_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Delete site (soft delete - filtered by org_id from JWT)
    """
    org_id = get_current_org_id(request)
    
    db_site = db.query(Site).filter(
        Site.id == site_id,
        Site.org_id == org_id
    ).first()
    
    if not db_site:
        raise HTTPException(status_code=404, detail="Site not found")
    
    db_site.is_active = False
    db.commit()
    return None
