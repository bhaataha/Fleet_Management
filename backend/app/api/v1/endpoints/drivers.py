from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models import Driver
from app.middleware.tenant import get_current_org_id
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

router = APIRouter()


class DriverBase(BaseModel):
    name: str
    phone: Optional[str] = None
    license_type: Optional[str] = None
    license_expiry: Optional[datetime] = None


class DriverCreate(DriverBase):
    user_id: Optional[int] = None


class DriverResponse(DriverBase):
    id: int
    org_id: int
    user_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("", response_model=List[DriverResponse])
async def list_drivers(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    org_id = get_current_org_id(request)
    query = db.query(Driver).filter(Driver.org_id == org_id)
    if is_active is not None:
        query = query.filter(Driver.is_active == is_active)
    return query.offset(skip).limit(limit).all()


@router.get("/{driver_id}", response_model=DriverResponse)
async def get_driver(
    driver_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    org_id = get_current_org_id(request)
    driver = db.query(Driver).filter(
        Driver.id == driver_id,
        Driver.org_id == org_id
    ).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver


@router.post("", response_model=DriverResponse, status_code=201)
async def create_driver(
    driver: DriverCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    org_id = get_current_org_id(request)
    db_driver = Driver(org_id=org_id, **driver.dict())
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver


@router.delete("/{driver_id}", status_code=204)
async def delete_driver(
    driver_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    org_id = get_current_org_id(request)
    driver = db.query(Driver).filter(
        Driver.id == driver_id,
        Driver.org_id == org_id
    ).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    db.delete(driver)
    db.commit()
    return None
