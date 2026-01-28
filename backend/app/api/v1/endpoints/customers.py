from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Union
from app.core.database import get_db
from app.models import Customer
from app.middleware.tenant import get_current_org_id
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

router = APIRouter()


class CustomerBase(BaseModel):
    name: str
    vat_id: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    vat_id: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None
    is_active: Optional[bool] = None


class CustomerResponse(CustomerBase):
    id: int
    org_id: Union[int, UUID]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


@router.get("", response_model=List[CustomerResponse])
async def list_customers(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """
    List all customers with pagination (filtered by org_id from JWT)
    """
    org_id = get_current_org_id(request)
    
    query = db.query(Customer).filter(Customer.org_id == org_id)
    
    if is_active is not None:
        query = query.filter(Customer.is_active == is_active)
    
    customers = query.offset(skip).limit(limit).all()
    return customers


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get customer by ID (filtered by org_id from JWT)
    """
    org_id = get_current_org_id(request)
    
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.org_id == org_id
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return customer


@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer(
    customer: CustomerCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Create new customer (auto-assigned to current org from JWT)
    """
    org_id = get_current_org_id(request)
    
    db_customer = Customer(
        org_id=org_id,
        **customer.dict()
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    return db_customer


@router.patch("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Update customer (filtered by org_id from JWT)
    """
    org_id = get_current_org_id(request)
    
    db_customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.org_id == org_id
    ).first()
    
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_customer, field, value)
    
    db.commit()
    db.refresh(db_customer)
    
    return db_customer


@router.delete("/{customer_id}", status_code=204)
async def delete_customer(
    customer_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Delete customer (soft delete - filtered by org_id from JWT)
    """
    org_id = get_current_org_id(request)
    
    db_customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.org_id == org_id
    ).first()
    
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db_customer.is_active = False
    db.commit()
    
    return None
