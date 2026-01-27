from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date as DateType
from decimal import Decimal

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import (
    Statement as StatementModel,
    StatementLine as StatementLineModel,
    Payment as PaymentModel,
    PaymentAllocation as PaymentAllocationModel,
    Job,
    Customer,
    User,
    StatementStatus,
)
from pydantic import BaseModel

router = APIRouter()


class GenerateStatementRequest(BaseModel):
    customer_id: int
    period_from: DateType
    period_to: DateType
    job_ids: Optional[List[int]] = None


class StatementLineResponse(BaseModel):
    id: int
    job_id: int
    description: str
    qty: Decimal
    unit_price: Decimal
    total: Decimal

    class Config:
        from_attributes = True


class StatementResponse(BaseModel):
    id: int
    number: str
    customer_id: int
    period_from: DateType
    period_to: DateType
    status: StatementStatus
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    lines: List[StatementLineResponse] = []

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    customer_id: int
    amount: Decimal
    paid_at: DateType
    method: str
    reference: Optional[str] = None


class PaymentAllocationCreate(BaseModel):
    statement_id: int
    amount: Decimal


@router.post("/statements/generate", response_model=StatementResponse)
def generate_statement(
    request: GenerateStatementRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a statement for delivered jobs in a period
    """
    # Get eligible jobs
    query = db.query(Job).filter(
        Job.org_id == current_user.org_id,
        Job.customer_id == request.customer_id,
        Job.status == "DELIVERED",
        Job.scheduled_date >= request.period_from,
        Job.scheduled_date <= request.period_to,
    )

    if request.job_ids:
        query = query.filter(Job.id.in_(request.job_ids))

    # Exclude already billed jobs
    already_billed = db.query(StatementLineModel.job_id).filter(
        StatementLineModel.statement.has(
            StatementModel.org_id == current_user.org_id
        )
    )
    query = query.filter(~Job.id.in_(already_billed))

    jobs = query.all()

    if not jobs:
        raise HTTPException(
            status_code=400, detail="No eligible jobs found for statement"
        )

    # Generate statement number
    last_statement = (
        db.query(StatementModel)
        .filter(StatementModel.org_id == current_user.org_id)
        .order_by(StatementModel.id.desc())
        .first()
    )
    next_num = (last_statement.id + 1) if last_statement else 1
    statement_number = f"ST-{next_num:06d}"

    # Create statement
    statement = StatementModel(
        org_id=current_user.org_id,
        customer_id=request.customer_id,
        period_from=request.period_from,
        period_to=request.period_to,
        number=statement_number,
        status=StatementStatus.DRAFT,
        subtotal=Decimal(0),
        tax=Decimal(0),
        total=Decimal(0),
        created_by=current_user.id,
    )
    db.add(statement)
    db.flush()

    # Create lines
    subtotal = Decimal(0)
    for job in jobs:
        # CRITICAL: Use manual_override_total if exists, otherwise use pricing_total
        # Manual price MUST be the authoritative price for billing!
        amount = (
            job.manual_override_total
            or job.pricing_total
            or ((job.actual_qty or job.planned_qty) * Decimal(100))  # Fallback
        )

        line = StatementLineModel(
            statement_id=statement.id,
            job_id=job.id,
            org_id=current_user.org_id,
            description=f"Job #{job.id} - {job.material_id}",
            qty=job.actual_qty or job.planned_qty,
            unit_price=amount
            / (job.actual_qty or job.planned_qty or Decimal(1)),
            total=amount,
            breakdown_json=job.pricing_breakdown_json or {},
        )
        db.add(line)
        subtotal += amount

    # Update totals (17% VAT)
    tax = subtotal * Decimal("0.17")
    statement.subtotal = subtotal
    statement.tax = tax
    statement.total = subtotal + tax

    db.commit()
    db.refresh(statement)

    return statement


@router.get("/statements", response_model=List[StatementResponse])
def list_statements(
    customer_id: Optional[int] = None,
    status: Optional[StatementStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(StatementModel).filter(
        StatementModel.org_id == current_user.org_id
    )

    if customer_id:
        query = query.filter(StatementModel.customer_id == customer_id)
    if status:
        query = query.filter(StatementModel.status == status)

    return query.order_by(StatementModel.created_at.desc()).all()


@router.patch("/statements/{statement_id}/status")
def update_statement_status(
    statement_id: int,
    status: StatementStatus,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    statement = (
        db.query(StatementModel)
        .filter(
            StatementModel.id == statement_id,
            StatementModel.org_id == current_user.org_id,
        )
        .first()
    )
    if not statement:
        raise HTTPException(status_code=404, detail="Statement not found")

    statement.status = status
    db.commit()
    return {"message": "Status updated"}


@router.post("/payments", response_model=dict)
def create_payment(
    payment: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_payment = PaymentModel(
        org_id=current_user.org_id,
        created_by=current_user.id,
        **payment.model_dump(),
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return {"id": db_payment.id, "message": "Payment created"}


@router.post("/payments/{payment_id}/allocate")
def allocate_payment(
    payment_id: int,
    allocations: List[PaymentAllocationCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = (
        db.query(PaymentModel)
        .filter(
            PaymentModel.id == payment_id,
            PaymentModel.org_id == current_user.org_id,
        )
        .first()
    )
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    for alloc in allocations:
        db_alloc = PaymentAllocationModel(
            payment_id=payment_id,
            statement_id=alloc.statement_id,
            amount=alloc.amount,
        )
        db.add(db_alloc)

        # Update statement status
        statement = db.query(StatementModel).get(alloc.statement_id)
        if statement:
            total_allocated = (
                db.query(PaymentAllocationModel)
                .filter(PaymentAllocationModel.statement_id == alloc.statement_id)
                .sum(PaymentAllocationModel.amount)
                or Decimal(0)
            ) + alloc.amount

            if total_allocated >= statement.total:
                statement.status = StatementStatus.PAID
            elif total_allocated > 0:
                statement.status = StatementStatus.PARTIALLY_PAID

    db.commit()
    return {"message": "Payment allocated"}
