from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models import Material, BillingUnit
from app.middleware.tenant import get_current_org_id
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

router = APIRouter()


class MaterialBase(BaseModel):
    name: str
    name_hebrew: Optional[str] = None
    billing_unit: BillingUnit


class MaterialCreate(MaterialBase):
    pass


class MaterialResponse(MaterialBase):
    id: int
    org_id: UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("", response_model=List[MaterialResponse])
async def list_materials(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    org_id = get_current_org_id(request)
    query = db.query(Material).filter(Material.org_id == org_id)
    if is_active is not None:
        query = query.filter(Material.is_active == is_active)
    return query.offset(skip).limit(limit).all()


@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material(
    material_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    org_id = get_current_org_id(request)
    material = db.query(Material).filter(
        Material.id == material_id,
        Material.org_id == org_id
    ).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return material


@router.post("", response_model=MaterialResponse, status_code=201)
async def create_material(
    material: MaterialCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    org_id = get_current_org_id(request)
    db_material = Material(org_id=org_id, **material.dict())
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material


@router.post("/seed-defaults", status_code=201)
async def seed_default_materials(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    יצירת חומרים סטנדרטיים לארגון (עפר, חצץ, מצע, חול, פסולת בניין, אספלט)
    """
    org_id = get_current_org_id(request)
    
    # בדיקה אם כבר יש חומרים
    existing_count = db.query(Material).filter(Material.org_id == org_id).count()
    if existing_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Organization already has {existing_count} materials"
        )
    
    default_materials = [
        {"name": "עפר", "name_hebrew": "עפר", "billing_unit": BillingUnit.TON},
        {"name": "חצץ", "name_hebrew": "חצץ", "billing_unit": BillingUnit.TON},
        {"name": "מצע", "name_hebrew": "מצע", "billing_unit": BillingUnit.TON},
        {"name": "חול", "name_hebrew": "חול", "billing_unit": BillingUnit.TON},
        {"name": "פסולת בניין", "name_hebrew": "פסולת בניין", "billing_unit": BillingUnit.TON},
        {"name": "אספלט", "name_hebrew": "אספלט", "billing_unit": BillingUnit.TON},
    ]
    
    created_materials = []
    for mat_data in default_materials:
        db_material = Material(org_id=org_id, **mat_data, is_active=True)
        db.add(db_material)
        created_materials.append(db_material)
    
    db.commit()
    
    return {
        "message": f"Created {len(created_materials)} default materials",
        "materials": [m.name for m in created_materials]
    }


@router.patch("/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: int,
    material: MaterialBase,
    request: Request,
    db: Session = Depends(get_db)
):
    org_id = get_current_org_id(request)
    db_material = db.query(Material).filter(
        Material.id == material_id,
        Material.org_id == org_id
    ).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    for key, value in material.dict().items():
        setattr(db_material, key, value)
    
    db.commit()
    db.refresh(db_material)
    return db_material


@router.delete("/{material_id}", status_code=204)
async def delete_material(
    material_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    org_id = get_current_org_id(request)
    db_material = db.query(Material).filter(
        Material.id == material_id,
        Material.org_id == org_id
    ).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    db.delete(db_material)
    db.commit()
    return None
