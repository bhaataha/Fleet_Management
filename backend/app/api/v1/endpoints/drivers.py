from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models import Driver, User
from app.middleware.tenant import get_current_org_id
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from passlib.context import CryptContext

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class DriverBase(BaseModel):
    name: str
    phone: Optional[str] = None
    license_type: Optional[str] = None
    license_expiry: Optional[datetime] = None
    is_active: Optional[bool] = True


class DriverCreate(DriverBase):
    user_id: Optional[int] = None
    password: str  # Required for new drivers


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None  # Optional - only if changing
    license_type: Optional[str] = None
    license_expiry: Optional[datetime] = None
    is_active: Optional[bool] = None


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
    
    # Create user for driver login
    hashed_password = pwd_context.hash(driver.password)
    user = User(
        phone=driver.phone,
        password_hash=hashed_password,
        org_id=org_id,
        role="driver",
        is_active=driver.is_active if driver.is_active is not None else True
    )
    db.add(user)
    db.flush()  # Get user.id without committing
    
    # Create driver linked to user
    driver_data = driver.dict(exclude={'password'})
    driver_data['user_id'] = user.id
    db_driver = Driver(org_id=org_id, **driver_data)
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver


@router.patch("/{driver_id}", response_model=DriverResponse)
async def update_driver(
    driver_id: int,
    driver: DriverUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    org_id = get_current_org_id(request)
    db_driver = db.query(Driver).filter(
        Driver.id == driver_id,
        Driver.org_id == org_id
    ).first()
    if not db_driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Update driver fields
    update_data = driver.dict(exclude_unset=True, exclude={'password'})
    for field, value in update_data.items():
        setattr(db_driver, field, value)
    
    # If password provided, update user password
    if driver.password:
        if db_driver.user_id:
            user = db.query(User).filter(User.id == db_driver.user_id).first()
            if user:
                user.password_hash = pwd_context.hash(driver.password)
        else:
            # Create user if doesn't exist
            hashed_password = pwd_context.hash(driver.password)
            user = User(
                phone=db_driver.phone or "",
                password_hash=hashed_password,
                org_id=org_id,
                role="driver",
                is_active=db_driver.is_active
            )
            db.add(user)
            db.flush()
            db_driver.user_id = user.id
    
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
