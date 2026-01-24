from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models import Driver
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class DriverBase(BaseModel):
    name: str
    phone: Optional[str] = None
    license_type: Optional[str] = None
    license_expiry: Optional[datetime] = None


class DriverCreate(DriverBase):
    user_id: int


class DriverResponse(DriverBase):
    id: int
    org_id: int
    user_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("", response_model=List[DriverResponse])
async def list_drivers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Driver)
    if is_active is not None:
        query = query.filter(Driver.is_active == is_active)
    return query.offset(skip).limit(limit).all()


@router.get("/{driver_id}", response_model=DriverResponse)
async def get_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver


@router.post("", response_model=DriverResponse, status_code=201)
async def create_driver(driver: DriverCreate, db: Session = Depends(get_db)):
    db_driver = Driver(org_id=1, **driver.dict())
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver
