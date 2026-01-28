"""
Expenses API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Union
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID

from app.core.database import get_db
from app.models import Expense, Truck, Driver
from app.middleware.tenant import get_current_org_id, get_current_user_id
from pydantic import BaseModel

router = APIRouter(prefix="/expenses")


# Pydantic Schemas
class ExpenseCreate(BaseModel):
    category: str  # דלק, תיקונים, צמיגים, ביטוח, רישוי, שכר, אחר
    amount: float
    expense_date: datetime
    vendor_name: Optional[str] = None
    truck_id: Optional[int] = None
    driver_id: Optional[int] = None
    job_id: Optional[int] = None
    note: Optional[str] = None


class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    expense_date: Optional[datetime] = None
    vendor_name: Optional[str] = None
    truck_id: Optional[int] = None
    driver_id: Optional[int] = None
    job_id: Optional[int] = None
    note: Optional[str] = None


class TruckNested(BaseModel):
    id: int
    plate_number: str
    
    class Config:
        from_attributes = True


class DriverNested(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True


class ExpenseResponse(BaseModel):
    id: int
    org_id: Union[int, UUID]
    category: str
    amount: float
    expense_date: datetime
    vendor_name: Optional[str]
    truck_id: Optional[int]
    driver_id: Optional[int]
    job_id: Optional[int]
    note: Optional[str]
    created_by: Optional[int]
    created_at: datetime
    
    # Nested relations
    truck: Optional[TruckNested] = None
    driver: Optional[DriverNested] = None
    
    class Config:
        from_attributes = True


@router.get("", response_model=List[ExpenseResponse])
async def list_expenses(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    category: Optional[str] = None,
    truck_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    List expenses with filters (filtered by org_id from JWT)
    
    Query Parameters:
    - from_date: Filter expenses from this date (inclusive)
    - to_date: Filter expenses to this date (inclusive)
    - category: Filter by category (דלק, תיקונים, etc.)
    - truck_id: Filter by truck
    - driver_id: Filter by driver
    """
    org_id = get_current_org_id(request)
    
    query = db.query(Expense).filter(Expense.org_id == org_id)
    
    # Date filters
    if from_date:
        query = query.filter(Expense.expense_date >= from_date)
    if to_date:
        # Include the entire day
        to_datetime = datetime.combine(to_date, datetime.max.time())
        query = query.filter(Expense.expense_date <= to_datetime)
    
    # Category filter
    if category:
        query = query.filter(Expense.category == category)
    
    # Entity filters
    if truck_id:
        query = query.filter(Expense.truck_id == truck_id)
    if driver_id:
        query = query.filter(Expense.driver_id == driver_id)
    
    # Order by date descending (newest first)
    query = query.order_by(Expense.expense_date.desc())
    
    expenses = query.offset(skip).limit(limit).all()
    
    # Fetch related entities for response
    for expense in expenses:
        if expense.truck_id:
            expense.truck = db.query(Truck).filter(Truck.id == expense.truck_id).first()
        if expense.driver_id:
            expense.driver = db.query(Driver).filter(Driver.id == expense.driver_id).first()
    
    return expenses


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get single expense by ID (filtered by org_id)
    """
    org_id = get_current_org_id(request)
    
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.org_id == org_id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Load relations
    if expense.truck_id:
        expense.truck = db.query(Truck).filter(Truck.id == expense.truck_id).first()
    if expense.driver_id:
        expense.driver = db.query(Driver).filter(Driver.id == expense.driver_id).first()
    
    return expense


@router.post("", response_model=ExpenseResponse, status_code=201)
async def create_expense(
    expense_data: ExpenseCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Create new expense (auto-assigned to current org from JWT)
    """
    org_id = get_current_org_id(request)
    user_id = get_current_user_id(request)
    
    # Validate truck belongs to org if provided
    if expense_data.truck_id:
        truck = db.query(Truck).filter(
            Truck.id == expense_data.truck_id,
            Truck.org_id == org_id
        ).first()
        if not truck:
            raise HTTPException(status_code=404, detail="Truck not found")
    
    # Validate driver belongs to org if provided
    if expense_data.driver_id:
        driver = db.query(Driver).filter(
            Driver.id == expense_data.driver_id,
            Driver.org_id == org_id
        ).first()
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")
    
    # Create expense
    expense = Expense(
        org_id=org_id,
        category=expense_data.category,
        amount=Decimal(str(expense_data.amount)),
        expense_date=expense_data.expense_date,
        vendor_name=expense_data.vendor_name,
        truck_id=expense_data.truck_id,
        driver_id=expense_data.driver_id,
        job_id=expense_data.job_id,
        note=expense_data.note,
        created_by=user_id
    )
    
    db.add(expense)
    db.commit()
    db.refresh(expense)
    
    # Load relations for response
    if expense.truck_id:
        expense.truck = db.query(Truck).filter(Truck.id == expense.truck_id).first()
    if expense.driver_id:
        expense.driver = db.query(Driver).filter(Driver.id == expense.driver_id).first()
    
    return expense


@router.patch("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    expense_update: ExpenseUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Update expense (filtered by org_id)
    """
    org_id = get_current_org_id(request)
    
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.org_id == org_id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Validate truck if changed
    if expense_update.truck_id:
        truck = db.query(Truck).filter(
            Truck.id == expense_update.truck_id,
            Truck.org_id == org_id
        ).first()
        if not truck:
            raise HTTPException(status_code=404, detail="Truck not found")
    
    # Validate driver if changed
    if expense_update.driver_id:
        driver = db.query(Driver).filter(
            Driver.id == expense_update.driver_id,
            Driver.org_id == org_id
        ).first()
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")
    
    # Update fields
    update_data = expense_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "amount" and value is not None:
            value = Decimal(str(value))
        setattr(expense, key, value)
    
    db.commit()
    db.refresh(expense)
    
    # Load relations for response
    if expense.truck_id:
        expense.truck = db.query(Truck).filter(Truck.id == expense.truck_id).first()
    if expense.driver_id:
        expense.driver = db.query(Driver).filter(Driver.id == expense.driver_id).first()
    
    return expense


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(
    expense_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Delete expense (filtered by org_id)
    """
    org_id = get_current_org_id(request)
    
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.org_id == org_id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(expense)
    db.commit()
    
    return None


@router.get("/summary/by-category", response_model=dict)
async def get_expenses_by_category(
    request: Request,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    Get expenses summary grouped by category
    """
    org_id = get_current_org_id(request)
    
    query = db.query(Expense).filter(Expense.org_id == org_id)
    
    if from_date:
        query = query.filter(Expense.expense_date >= from_date)
    if to_date:
        to_datetime = datetime.combine(to_date, datetime.max.time())
        query = query.filter(Expense.expense_date <= to_datetime)
    
    expenses = query.all()
    
    # Group by category
    summary = {}
    for expense in expenses:
        category = expense.category
        if category not in summary:
            summary[category] = {
                "category": category,
                "total": 0.0,
                "count": 0,
                "avg": 0.0
            }
        summary[category]["total"] += float(expense.amount)
        summary[category]["count"] += 1
    
    # Calculate averages
    for category in summary:
        if summary[category]["count"] > 0:
            summary[category]["avg"] = summary[category]["total"] / summary[category]["count"]
    
    return {
        "summary": list(summary.values()),
        "total_expenses": sum(s["total"] for s in summary.values()),
        "total_count": sum(s["count"] for s in summary.values())
    }
