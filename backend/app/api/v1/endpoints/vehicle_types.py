"""
Vehicle Types API endpoints - Manage custom vehicle types
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional, Union
from app.core.database import get_db
from app.models import VehicleType
from app.middleware.tenant import get_current_org_id, get_current_user_id
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

router = APIRouter(prefix="/vehicle-types", tags=["Vehicle Types"])


class VehicleTypeBase(BaseModel):
    name: str
    name_hebrew: Optional[str] = None
    description: Optional[str] = None
    code: str
    is_active: bool = True
    sort_order: int = 0


class VehicleTypeCreate(VehicleTypeBase):
    pass


class VehicleTypeUpdate(BaseModel):
    name: Optional[str] = None
    name_hebrew: Optional[str] = None
    description: Optional[str] = None
    code: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class VehicleTypeResponse(VehicleTypeBase):
    id: int
    org_id: Union[int, UUID]
    is_system_default: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


@router.get("", response_model=List[VehicleTypeResponse])
async def list_vehicle_types(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """
    List all vehicle types for the organization
    """
    org_id = get_current_org_id(request)
    
    query = db.query(VehicleType).filter(VehicleType.org_id == org_id)
    
    if active_only:
        query = query.filter(VehicleType.is_active == True)
    
    vehicle_types = query.order_by(VehicleType.sort_order, VehicleType.name).offset(skip).limit(limit).all()
    
    return vehicle_types


@router.post("", response_model=VehicleTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle_type(
    vehicle_type: VehicleTypeCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Create a new vehicle type
    """
    org_id = get_current_org_id(request)
    user_id = get_current_user_id(request)
    
    # Check if code already exists in this organization
    existing = db.query(VehicleType).filter(
        VehicleType.org_id == org_id,
        VehicleType.code == vehicle_type.code
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle type with code '{vehicle_type.code}' already exists"
        )
    
    db_vehicle_type = VehicleType(
        org_id=org_id,
        **vehicle_type.dict()
    )
    
    db.add(db_vehicle_type)
    db.commit()
    db.refresh(db_vehicle_type)
    
    return db_vehicle_type


@router.get("/{vehicle_type_id}", response_model=VehicleTypeResponse)
async def get_vehicle_type(
    vehicle_type_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get vehicle type by ID
    """
    org_id = get_current_org_id(request)
    
    vehicle_type = db.query(VehicleType).filter(
        VehicleType.id == vehicle_type_id,
        VehicleType.org_id == org_id
    ).first()
    
    if not vehicle_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle type not found"
        )
    
    return vehicle_type


@router.patch("/{vehicle_type_id}", response_model=VehicleTypeResponse)
async def update_vehicle_type(
    vehicle_type_id: int,
    vehicle_type_update: VehicleTypeUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Update vehicle type
    """
    org_id = get_current_org_id(request)
    
    db_vehicle_type = db.query(VehicleType).filter(
        VehicleType.id == vehicle_type_id,
        VehicleType.org_id == org_id
    ).first()
    
    if not db_vehicle_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle type not found"
        )
    
    # Check if new code conflicts with existing types
    if vehicle_type_update.code and vehicle_type_update.code != db_vehicle_type.code:
        existing = db.query(VehicleType).filter(
            VehicleType.org_id == org_id,
            VehicleType.code == vehicle_type_update.code,
            VehicleType.id != vehicle_type_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Vehicle type with code '{vehicle_type_update.code}' already exists"
            )
    
    # Update fields
    update_data = vehicle_type_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_vehicle_type, field, value)
    
    db.commit()
    db.refresh(db_vehicle_type)
    
    return db_vehicle_type


@router.delete("/{vehicle_type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle_type(
    vehicle_type_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Delete vehicle type (soft delete by setting is_active=False)
    """
    org_id = get_current_org_id(request)
    
    db_vehicle_type = db.query(VehicleType).filter(
        VehicleType.id == vehicle_type_id,
        VehicleType.org_id == org_id
    ).first()
    
    if not db_vehicle_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle type not found"
        )
    
    # Check if vehicle type is used by any trucks
    from app.models import Truck
    trucks_using_type = db.query(Truck).filter(
        Truck.org_id == org_id,
        Truck.truck_type == db_vehicle_type.code
    ).count()
    
    if trucks_using_type > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete vehicle type. It is used by {trucks_using_type} truck(s)"
        )
    
    # Soft delete
    db_vehicle_type.is_active = False
    db.commit()


@router.post("/seed-defaults", response_model=dict)
async def seed_default_vehicle_types(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Seed organization with default vehicle types
    """
    org_id = get_current_org_id(request)
    
    # Check if organization already has vehicle types
    existing_count = db.query(VehicleType).filter(VehicleType.org_id == org_id).count()
    
    if existing_count > 0:
        return {
            "message": f"Organization already has {existing_count} vehicle types",
            "seeded": 0
        }
    
    # Default vehicle types
    default_types = [
        {"name": "פול טריילר", "code": "FULL_TRAILER", "description": "משאית עם נגרר מלא", "sort_order": 1},
        {"name": "סמי טריילר", "code": "SEMI_TRAILER", "description": "משאית עם נגרר חלקי", "sort_order": 2},
        {"name": "דאבל", "code": "DOUBLE_TRAILER", "description": "משאית עם נגרר כפול", "sort_order": 3},
        {"name": "משאית קטנה", "code": "SMALL_TRUCK", "description": "משאית עד 12 טון", "sort_order": 4},
        {"name": "טנדר", "code": "PICKUP", "description": "רכב פיקאפ", "sort_order": 5},
        {"name": "מערבל בטון", "code": "CONCRETE_MIXER", "description": "רכב מערבל בטון", "sort_order": 6},
        {"name": "מטרגה", "code": "DUMP_TRUCK", "description": "משאית מטרגה", "sort_order": 7},
        {"name": "משטח פתוח", "code": "FLATBED", "description": "משאית משטח פתוח", "sort_order": 8},
    ]
    
    created_count = 0
    for type_data in default_types:
        db_vehicle_type = VehicleType(
            org_id=org_id,
            is_system_default=True,
            **type_data
        )
        db.add(db_vehicle_type)
        created_count += 1
    
    db.commit()
    
    return {
        "message": f"Successfully seeded {created_count} default vehicle types",
        "seeded": created_count
    }