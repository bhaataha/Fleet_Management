from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Union
from app.core.database import get_db
from app.models import Driver, User
from app.middleware.tenant import get_current_org_id
from app.core.security import get_password_hash
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class DriverBase(BaseModel):
    name: str
    phone: str  # Required - drivers must have phone for login
    email: Optional[str] = None  # Optional - drivers can login with phone only
    license_type: Optional[str] = None
    license_expiry: Optional[datetime] = None
    is_active: Optional[bool] = True


class DriverCreate(DriverBase):
    password: Optional[str] = None  # Optional - will generate default if not provided
    # user_id is auto-created, no need to pass it


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None  # Optional - can update email
    password: Optional[str] = None  # Optional - only if changing
    license_type: Optional[str] = None
    license_expiry: Optional[datetime] = None
    is_active: Optional[bool] = None


class DriverResponse(DriverBase):
    id: int
    org_id: Union[int, UUID]
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
    # If no password provided, generate default: driver + phone last 4 digits
    if not driver.password:
        # Default password: driver + last 4 digits of phone
        phone_suffix = ''.join(filter(str.isdigit, driver.phone))[-4:] if driver.phone else '1234'
        default_password = f"driver{phone_suffix}"
        logger.info(f"Generated default password for new driver: {driver.name}")
    else:
        default_password = driver.password
    
    # Bcrypt has a 72 byte limit - truncate by bytes, not characters
    password_bytes = default_password.encode('utf-8')[:72]
    password = password_bytes.decode('utf-8', errors='ignore')  # Handle incomplete UTF-8 sequences
    hashed_password = get_password_hash(password)
    user = User(
        name=driver.name,
        phone=driver.phone or "",
        email=driver.email if driver.email else None,  # Optional email for drivers
        password_hash=hashed_password,
        org_id=org_id,
        org_role="driver",
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
    try:
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
        
        # Sync name, phone, email to User table if user exists
        if db_driver.user_id:
            user = db.query(User).filter(User.id == db_driver.user_id).first()
            if user:
                if driver.name:
                    user.name = driver.name
                if driver.phone:
                    user.phone = driver.phone
                if driver.email is not None:  # Allow setting to empty string
                    user.email = driver.email if driver.email else None
                if driver.is_active is not None:
                    user.is_active = driver.is_active
        
        # If password provided, update user password
        if driver.password:
            # Bcrypt has a 72 byte limit - truncate by bytes, not characters
            password_bytes = driver.password.encode('utf-8')[:72]
            password = password_bytes.decode('utf-8', errors='ignore')  # Handle incomplete UTF-8 sequences
            hashed_password = get_password_hash(password)
            
            if db_driver.user_id:
                user = db.query(User).filter(User.id == db_driver.user_id).first()
                if user:
                    user.password_hash = hashed_password
                    logger.info(f"Updated password for driver {driver_id}, user {user.id}")
            else:
                # Create user if doesn't exist
                logger.info(f"Creating new user for driver {driver_id}")
                user = User(
                    name=db_driver.name,
                    phone=db_driver.phone or "",
                    email=driver.email if driver.email else None,
                    password_hash=hashed_password,
                    org_id=org_id,
                    org_role="driver",
                    is_active=db_driver.is_active
                )
                db.add(user)
                db.flush()
                db_driver.user_id = user.id
                logger.info(f"Created user {user.id} for driver {driver_id}")
        
        db.commit()
        db.refresh(db_driver)
        return db_driver
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating driver {driver_id}: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating driver: {str(e)}")


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
