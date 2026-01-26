"""
Subcontractors Management Endpoints
endpoints: /api/subcontractors
קבלני משנה - ספקי הובלה חיצוניים
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import (
    Subcontractor, SubcontractorPriceList, User, UserRole, Organization, 
    Truck, Job, Expense
)
from app.schemas.common import Message
from app.schemas.subcontractors import (
    SubcontractorCreate, SubcontractorUpdate, SubcontractorResponse,
    SubcontractorDetailResponse, SubcontractorPriceListCreate, 
    SubcontractorPriceListUpdate, SubcontractorPriceListResponse,
    SubcontractorPricePreview
)

router = APIRouter(prefix="/subcontractors", tags=["subcontractors"])


# ============================================================================
# Subcontractors CRUD
# ============================================================================

@router.get("", response_model=List[SubcontractorResponse])
async def list_subcontractors(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    רשימת קבלני משנה
    
    Parameters:
    - is_active: סינון לפי סטטוס פעיל
    - search: חיפוש לפי שם או מספר ח.פ
    """
    # Check authorization
    org_id = current_user.org_id
    
    # Check permissions - Dispatcher, Accounting, Admin
    user_roles = [role.role for role in current_user.roles]
    if UserRole.DRIVER.value in user_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = db.query(Subcontractor).filter(Subcontractor.org_id == org_id)
    
    if is_active is not None:
        query = query.filter(Subcontractor.is_active == is_active)
    
    if search:
        query = query.filter(or_(
            Subcontractor.name.ilike(f"%{search}%"),
            Subcontractor.company_name.ilike(f"%{search}%"),
            Subcontractor.vat_id.ilike(f"%{search}%")
        ))
    
    return query.offset(skip).limit(limit).all()


@router.post("", response_model=SubcontractorResponse, status_code=status.HTTP_201_CREATED)
async def create_subcontractor(
    data: SubcontractorCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    יצירת קבלן משנה חדש
    
    חובה: שם, טלפון
    אופציונלי: פרטי חברה, תנאי תשלום
    """
    # Check permissions
    user_roles = [role.role for role in current_user.roles]
    if UserRole.DRIVER.value in user_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if name already exists
    existing = db.query(Subcontractor).filter(
        and_(
            Subcontractor.org_id == current_user.org_id,
            Subcontractor.name == data.name
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Subcontractor name already exists")
    
    subcontractor = Subcontractor(
        org_id=current_user.org_id,
        **data.dict(),
        created_by=current_user.id
    )
    
    db.add(subcontractor)
    db.commit()
    db.refresh(subcontractor)
    
    return subcontractor


@router.get("/{subcontractor_id}", response_model=SubcontractorDetailResponse)
async def get_subcontractor(
    subcontractor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    פרטי קבלן משנה - כולל משאיות ופעולות עדכניות
    """
    subcontractor = db.query(Subcontractor).filter(
        and_(
            Subcontractor.id == subcontractor_id,
            Subcontractor.org_id == current_user.org_id
        )
    ).first()
    
    if not subcontractor:
        raise HTTPException(status_code=404, detail="Subcontractor not found")
    
    return subcontractor


@router.patch("/{subcontractor_id}", response_model=SubcontractorResponse)
async def update_subcontractor(
    subcontractor_id: int,
    data: SubcontractorUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """עדכון פרטי קבלן משנה"""
    
    user_roles = [role.role for role in current_user.roles]
    if UserRole.DRIVER.value in user_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    subcontractor = db.query(Subcontractor).filter(
        and_(
            Subcontractor.id == subcontractor_id,
            Subcontractor.org_id == current_user.org_id
        )
    ).first()
    
    if not subcontractor:
        raise HTTPException(status_code=404, detail="Subcontractor not found")
    
    update_data = data.dict(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(subcontractor, field, value)
    
    db.commit()
    db.refresh(subcontractor)
    
    return subcontractor


@router.delete("/{subcontractor_id}", response_model=Message)
async def delete_subcontractor(
    subcontractor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    מחיקת קבלן משנה
    
    הערה: לא ניתן למחוק אם יש משאיות או נסיעות משויכות
    """
    user_roles = [role.role for role in current_user.roles]
    if UserRole.ADMIN.value not in user_roles:
        raise HTTPException(status_code=403, detail="Only admins can delete subcontractors")
    
    subcontractor = db.query(Subcontractor).filter(
        and_(
            Subcontractor.id == subcontractor_id,
            Subcontractor.org_id == current_user.org_id
        )
    ).first()
    
    if not subcontractor:
        raise HTTPException(status_code=404, detail="Subcontractor not found")
    
    # Check for associated trucks
    trucks = db.query(Truck).filter(Truck.subcontractor_id == subcontractor_id).count()
    if trucks > 0:
        raise HTTPException(status_code=400, detail="Cannot delete subcontractor with associated trucks")
    
    # Check for associated jobs
    jobs = db.query(Job).filter(Job.subcontractor_id == subcontractor_id).count()
    if jobs > 0:
        raise HTTPException(status_code=400, detail="Cannot delete subcontractor with associated jobs")
    
    db.delete(subcontractor)
    db.commit()
    
    return {"message": "Subcontractor deleted successfully"}


# ============================================================================
# Subcontractor Price Lists
# ============================================================================

@router.get("/{subcontractor_id}/prices", response_model=List[SubcontractorPriceListResponse])
async def list_subcontractor_prices(
    subcontractor_id: int,
    is_active: Optional[bool] = None,
    truck_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    מחירונים של קבלן משנה
    
    סינון אופציונלי לפי משאית או סטטוס
    """
    # Verify subcontractor exists
    subcontractor = db.query(Subcontractor).filter(
        and_(
            Subcontractor.id == subcontractor_id,
            Subcontractor.org_id == current_user.org_id
        )
    ).first()
    
    if not subcontractor:
        raise HTTPException(status_code=404, detail="Subcontractor not found")
    
    query = db.query(SubcontractorPriceList).filter(
        SubcontractorPriceList.subcontractor_id == subcontractor_id
    )
    
    if is_active is not None:
        query = query.filter(SubcontractorPriceList.is_active == is_active)
    
    if truck_id is not None:
        query = query.filter(or_(
            SubcontractorPriceList.truck_id == truck_id,
            SubcontractorPriceList.truck_id == None  # Include general prices
        ))
    
    return query.all()


@router.post("/{subcontractor_id}/prices", response_model=SubcontractorPriceListResponse, status_code=status.HTTP_201_CREATED)
async def create_subcontractor_price(
    subcontractor_id: int,
    data: SubcontractorPriceListCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    יצירת מחירון לקבלן משנה
    
    דוגמה:
    {
        "price_per_trip": 80,
        "price_per_ton": 50,
        "min_charge": 400,
        "valid_from": "2026-01-01",
        "valid_to": "2026-12-31"
    }
    """
    # Verify subcontractor exists
    subcontractor = db.query(Subcontractor).filter(
        and_(
            Subcontractor.id == subcontractor_id,
            Subcontractor.org_id == current_user.org_id
        )
    ).first()
    
    if not subcontractor:
        raise HTTPException(status_code=404, detail="Subcontractor not found")
    
    # Validate at least one price is set
    price_data = data.dict(exclude_unset=True)
    prices = [
        price_data.get('price_per_trip'),
        price_data.get('price_per_ton'),
        price_data.get('price_per_m3'),
        price_data.get('price_per_km')
    ]
    
    if not any(prices):
        raise HTTPException(status_code=400, detail="At least one price must be provided")
    
    price_list = SubcontractorPriceList(
        org_id=current_user.org_id,
        subcontractor_id=subcontractor_id,
        **data.dict(),
        created_by=current_user.id
    )
    
    db.add(price_list)
    db.commit()
    db.refresh(price_list)
    
    return price_list


@router.patch("/{subcontractor_id}/prices/{price_id}", response_model=SubcontractorPriceListResponse)
async def update_subcontractor_price(
    subcontractor_id: int,
    price_id: int,
    data: SubcontractorPriceListUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """עדכון מחירון קבלן"""
    
    price_list = db.query(SubcontractorPriceList).filter(
        and_(
            SubcontractorPriceList.id == price_id,
            SubcontractorPriceList.subcontractor_id == subcontractor_id,
            SubcontractorPriceList.org_id == current_user.org_id
        )
    ).first()
    
    if not price_list:
        raise HTTPException(status_code=404, detail="Price list not found")
    
    update_data = data.dict(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(price_list, field, value)
    
    db.commit()
    db.refresh(price_list)
    
    return price_list


# ============================================================================
# Subcontractor Pricing Preview
# ============================================================================

@router.post("/{subcontractor_id}/pricing-preview", response_model=SubcontractorPricePreview)
async def preview_subcontractor_pricing(
    subcontractor_id: int,
    qty: float = Query(..., gt=0),
    unit: str = Query("TON", regex="^(TON|M3|TRIP|KM)$"),
    truck_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    תצוגה מקדימה של מחיר לקבלן - חישוב עבור quantity ספציפיקה
    
    דוגמה:
    GET /subcontractors/1/pricing-preview?qty=15&unit=TON&truck_id=5
    
    תוצאה:
    {
        "base_trip_price": 80,
        "qty": 15,
        "unit": "TON",
        "price_per_ton": 50,
        "qty_price": 750,
        "min_charge": 400,
        "total": 830,
        "calculation": "80₪ נסיעה + (15 טון × 50₪)"
    }
    """
    
    # Verify subcontractor exists
    subcontractor = db.query(Subcontractor).filter(
        and_(
            Subcontractor.id == subcontractor_id,
            Subcontractor.org_id == current_user.org_id
        )
    ).first()
    
    if not subcontractor:
        raise HTTPException(status_code=404, detail="Subcontractor not found")
    
    # Get applicable price list
    query = db.query(SubcontractorPriceList).filter(
        and_(
            SubcontractorPriceList.subcontractor_id == subcontractor_id,
            SubcontractorPriceList.is_active == True,
            SubcontractorPriceList.org_id == current_user.org_id
        )
    )
    
    # Filter by truck if specified
    if truck_id:
        query = query.filter(or_(
            SubcontractorPriceList.truck_id == truck_id,
            SubcontractorPriceList.truck_id == None
        ))
    
    # Filter by customer if specified
    if customer_id:
        query = query.filter(or_(
            SubcontractorPriceList.customer_id == customer_id,
            SubcontractorPriceList.customer_id == None
        ))
    
    # Get most specific price list (truck > customer > general)
    price_list = query.order_by(
        SubcontractorPriceList.truck_id.desc(),
        SubcontractorPriceList.customer_id.desc()
    ).first()
    
    if not price_list:
        raise HTTPException(status_code=400, detail="No applicable price list found")
    
    # Calculate price
    trip_price = price_list.price_per_trip or Decimal(0)
    unit_price = None
    qty_price = Decimal(0)
    calculation_parts = []
    
    if unit == "TON" and price_list.price_per_ton:
        unit_price = price_list.price_per_ton
        qty_price = Decimal(qty) * unit_price
        calculation_parts.append(f"{int(qty)} טון × {unit_price}₪")
    elif unit == "M3" and price_list.price_per_m3:
        unit_price = price_list.price_per_m3
        qty_price = Decimal(qty) * unit_price
        calculation_parts.append(f"{qty} מ״ק × {unit_price}₪")
    elif unit == "KM" and price_list.price_per_km:
        unit_price = price_list.price_per_km
        qty_price = Decimal(qty) * unit_price
        calculation_parts.append(f"{qty} ק״מ × {unit_price}₪")
    
    if trip_price > 0:
        calculation_parts.insert(0, f"{int(trip_price)}₪ נסיעה")
    
    total = trip_price + qty_price
    
    # Apply minimum charge if applicable
    min_charge = price_list.min_charge or Decimal(0)
    if min_charge > 0 and total < min_charge:
        total = min_charge
        calculation_parts.append(f"(מינימום: {int(min_charge)}₪)")
    
    return SubcontractorPricePreview(
        base_trip_price=float(trip_price),
        qty=qty,
        unit=unit,
        price_per_unit=float(unit_price) if unit_price else None,
        qty_price=float(qty_price),
        min_charge=float(min_charge),
        total=float(total),
        calculation=" + ".join(calculation_parts)
    )


# ============================================================================
# Subcontractor Reports
# ============================================================================

@router.get("/{subcontractor_id}/summary", response_model=dict)
async def get_subcontractor_summary(
    subcontractor_id: int,
    from_date: Optional[str] = Query(None, regex="^\\d{4}-\\d{2}-\\d{2}$"),
    to_date: Optional[str] = Query(None, regex="^\\d{4}-\\d{2}-\\d{2}$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    סיכום פעילות קבלן - נסיעות, סכומים, רווחיות
    
    דוגמה:
    GET /subcontractors/1/summary?from_date=2026-01-01&to_date=2026-01-31
    """
    
    # Verify subcontractor exists
    subcontractor = db.query(Subcontractor).filter(
        and_(
            Subcontractor.id == subcontractor_id,
            Subcontractor.org_id == current_user.org_id
        )
    ).first()
    
    if not subcontractor:
        raise HTTPException(status_code=404, detail="Subcontractor not found")
    
    # Build date filters
    date_filters = []
    if from_date:
        date_filters.append(Job.scheduled_date >= datetime.strptime(from_date, "%Y-%m-%d"))
    if to_date:
        date_filters.append(Job.scheduled_date <= datetime.strptime(to_date, "%Y-%m-%d"))
    
    # Get jobs
    jobs_query = db.query(Job).filter(
        and_(
            Job.subcontractor_id == subcontractor_id,
            Job.is_subcontractor == True,
            Job.org_id == current_user.org_id,
            *date_filters
        )
    )
    
    jobs = jobs_query.all()
    
    total_jobs = len(jobs)
    total_qty = sum(j.actual_qty or j.planned_qty or 0 for j in jobs)
    total_company_price = sum(j.pricing_total or 0 for j in jobs)
    total_subcontractor_price = sum(j.subcontractor_price_total or 0 for j in jobs)
    profit = total_company_price - total_subcontractor_price
    profit_margin = (profit / total_company_price * 100) if total_company_price > 0 else 0
    
    return {
        "subcontractor_id": subcontractor_id,
        "subcontractor_name": subcontractor.name,
        "period": {
            "from": from_date,
            "to": to_date
        },
        "statistics": {
            "total_jobs": total_jobs,
            "total_quantity": float(total_qty),
            "jobs_by_status": {
                status.value: len([j for j in jobs if j.status.value == status.value])
                for status in [j.status for j in jobs]
            }
        },
        "financials": {
            "total_company_price": float(total_company_price),
            "total_subcontractor_price": float(total_subcontractor_price),
            "profit": float(profit),
            "profit_margin_pct": float(profit_margin)
        }
    }
