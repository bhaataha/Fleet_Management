from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date as DateType

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import (
    PriceList as PriceListModel,
    Customer,
    Material,
    Site,
    User,
)
from pydantic import BaseModel
from decimal import Decimal

router = APIRouter()


class PriceListCreate(BaseModel):
    customer_id: Optional[int] = None
    material_id: int
    from_site_id: Optional[int] = None
    to_site_id: Optional[int] = None
    unit: str
    base_price: Decimal
    min_charge: Optional[Decimal] = None
    wait_fee_per_hour: Optional[Decimal] = None
    night_surcharge_pct: Optional[Decimal] = None
    valid_from: DateType
    valid_to: Optional[DateType] = None


class PriceListResponse(BaseModel):
    id: int
    customer_id: Optional[int]
    material_id: int
    from_site_id: Optional[int]
    to_site_id: Optional[int]
    unit: str
    base_price: Decimal
    min_charge: Optional[Decimal]
    wait_fee_per_hour: Optional[Decimal]
    night_surcharge_pct: Optional[Decimal]
    valid_from: DateType
    valid_to: Optional[DateType]

    class Config:
        from_attributes = True


class PricingPreviewRequest(BaseModel):
    job_id: int
    qty: Decimal
    wait_hours: Optional[Decimal] = 0
    is_night: bool = False


class PricingBreakdown(BaseModel):
    base_amount: Decimal
    min_charge_adjustment: Decimal
    wait_fee: Decimal
    night_surcharge: Decimal
    total: Decimal
    details: dict


@router.get("/price-lists", response_model=List[PriceListResponse])
def list_price_lists(
    customer_id: Optional[int] = None,
    material_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(PriceListModel).filter(
        PriceListModel.org_id == current_user.org_id
    )

    if customer_id:
        query = query.filter(
            (PriceListModel.customer_id == customer_id)
            | (PriceListModel.customer_id.is_(None))
        )
    if material_id:
        query = query.filter(PriceListModel.material_id == material_id)

    return query.all()


@router.post("/price-lists", response_model=PriceListResponse)
def create_price_list(
    price_list: PriceListCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_price_list = PriceListModel(
        org_id=current_user.org_id, **price_list.model_dump()
    )
    db.add(db_price_list)
    db.commit()
    db.refresh(db_price_list)
    return db_price_list


@router.post("/pricing/preview", response_model=PricingBreakdown)
def preview_pricing(
    request: PricingPreviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Calculate pricing for a job based on price lists and adjustments
    """
    from app.models import Job

    job = (
        db.query(Job)
        .filter(Job.id == request.job_id, Job.org_id == current_user.org_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Find applicable price list
    price_list = (
        db.query(PriceListModel)
        .filter(
            PriceListModel.org_id == current_user.org_id,
            PriceListModel.material_id == job.material_id,
            PriceListModel.valid_from <= DateType.today(),
            (PriceListModel.valid_to.is_(None))
            | (PriceListModel.valid_to >= DateType.today()),
        )
        .filter(
            (PriceListModel.customer_id == job.customer_id)
            | (PriceListModel.customer_id.is_(None))
        )
        .order_by(
            PriceListModel.customer_id.desc(),  # Customer-specific first
            PriceListModel.valid_from.desc(),
        )
        .first()
    )

    if not price_list:
        raise HTTPException(
            status_code=404, detail="No applicable price list found"
        )

    # Calculate base amount
    base_amount = price_list.base_price * request.qty

    # Min charge adjustment
    min_charge_adjustment = Decimal(0)
    if price_list.min_charge and base_amount < price_list.min_charge:
        min_charge_adjustment = price_list.min_charge - base_amount
        base_amount = price_list.min_charge

    # Wait fee
    wait_fee = Decimal(0)
    if price_list.wait_fee_per_hour and request.wait_hours:
        wait_fee = price_list.wait_fee_per_hour * request.wait_hours

    # Night surcharge
    night_surcharge = Decimal(0)
    if request.is_night and price_list.night_surcharge_pct:
        night_surcharge = base_amount * (price_list.night_surcharge_pct / 100)

    total = base_amount + wait_fee + night_surcharge

    return PricingBreakdown(
        base_amount=base_amount,
        min_charge_adjustment=min_charge_adjustment,
        wait_fee=wait_fee,
        night_surcharge=night_surcharge,
        total=total,
        details={
            "price_list_id": price_list.id,
            "unit_price": float(price_list.base_price),
            "qty": float(request.qty),
            "wait_hours": float(request.wait_hours or 0),
            "is_night": request.is_night,
        },
    )
