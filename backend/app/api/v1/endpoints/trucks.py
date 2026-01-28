from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Union
from decimal import Decimal
from app.core.database import get_db
from app.models import Truck
from app.middleware.tenant import get_current_org_id
from pydantic import BaseModel, field_validator
from datetime import datetime, date
from uuid import UUID

router = APIRouter()


class TruckBase(BaseModel):
    plate_number: str
    model: Optional[str] = None
    truck_type: Optional[str] = None
    capacity_ton: Optional[Decimal] = None
    capacity_m3: Optional[Decimal] = None
    insurance_expiry: Optional[Union[datetime, date]] = None
    test_expiry: Optional[Union[datetime, date]] = None
    primary_driver_id: Optional[int] = None
    secondary_driver_ids: Optional[List[int]] = []
    
    @field_validator('insurance_expiry', 'test_expiry', mode='before')
    @classmethod
    def parse_date_or_datetime(cls, v):
        """Accept both date and datetime formats"""
        if v is None:
            return v
        if isinstance(v, str) and not v.strip():
            return None
        if isinstance(v, (datetime, date)):
            return v
        if isinstance(v, str):
            # Try parsing as date first (YYYY-MM-DD)
            try:
                return datetime.strptime(v, '%Y-%m-%d')
            except ValueError:
                pass
            # Try parsing as datetime
            try:
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError(f"Invalid date/datetime format: {v}")
        return v


class TruckCreate(TruckBase):
    pass


class TruckUpdate(BaseModel):
    plate_number: Optional[str] = None
    model: Optional[str] = None
    truck_type: Optional[str] = None
    capacity_ton: Optional[Decimal] = None
    capacity_m3: Optional[Decimal] = None
    insurance_expiry: Optional[Union[datetime, date]] = None
    test_expiry: Optional[Union[datetime, date]] = None
    primary_driver_id: Optional[int] = None
    secondary_driver_ids: Optional[List[int]] = None
    is_active: Optional[bool] = None
    
    @field_validator('insurance_expiry', 'test_expiry', mode='before')
    @classmethod
    def parse_date_or_datetime(cls, v):
        """Accept both date and datetime formats"""
        if v is None:
            return v
        if isinstance(v, str) and not v.strip():
            return None
        if isinstance(v, (datetime, date)):
            return v
        if isinstance(v, str):
            # Try parsing as date first (YYYY-MM-DD)
            try:
                return datetime.strptime(v, '%Y-%m-%d')
            except ValueError:
                pass
            # Try parsing as datetime
            try:
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError(f"Invalid date/datetime format: {v}")
        return v


class TruckResponse(TruckBase):
    id: int
    org_id: Union[int, UUID]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


@router.get("", response_model=List[TruckResponse])
async def list_trucks(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    org_id = get_current_org_id(request)
    query = db.query(Truck).filter(Truck.org_id == org_id)
    if is_active is not None:
        query = query.filter(Truck.is_active == is_active)
    return query.offset(skip).limit(limit).all()


@router.get("/{truck_id}", response_model=TruckResponse)
async def get_truck(
    truck_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    org_id = get_current_org_id(request)
    truck = db.query(Truck).filter(
        Truck.id == truck_id,
        Truck.org_id == org_id
    ).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    return truck


@router.post("", response_model=TruckResponse, status_code=201)
async def create_truck(
    truck: TruckCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    org_id = get_current_org_id(request)
    db_truck = Truck(org_id=org_id, **truck.dict())
    db.add(db_truck)
    db.commit()
    db.refresh(db_truck)
    return db_truck


@router.patch("/{truck_id}", response_model=TruckResponse)
async def update_truck(
    truck_id: int,
    truck_update: TruckUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    org_id = get_current_org_id(request)
    db_truck = db.query(Truck).filter(
        Truck.id == truck_id,
        Truck.org_id == org_id
    ).first()
    if not db_truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    
    for field, value in truck_update.dict(exclude_unset=True).items():
        setattr(db_truck, field, value)
    
    db.commit()
    db.refresh(db_truck)
    return db_truck
