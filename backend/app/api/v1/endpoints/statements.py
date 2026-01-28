from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import date as DateType
from decimal import Decimal

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.pdf_generator import StatementPDF
from app.models import (
    Statement as StatementModel,
    StatementLine as StatementLineModel,
    Payment as PaymentModel,
    PaymentAllocation as PaymentAllocationModel,
    Job,
    Customer,
    User,
    StatementStatus,
    Organization,
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
    material_name: Optional[str] = None
    truck_plate: Optional[str] = None

    class Config:
        from_attributes = True


class StatementResponse(BaseModel):
    id: int
    number: str
    customer_id: int
    customer_name: Optional[str] = None
    period_from: DateType
    period_to: DateType
    status: StatementStatus
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    paid_amount: Decimal = Decimal(0)
    balance: Decimal = Decimal(0)
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


def _format_money(value: Optional[Decimal]) -> str:
    if value is None:
        return "0.00"
    return f"{value:.2f}"


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

    jobs = query.options(joinedload(Job.material), joinedload(Job.truck)).all()

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
    job_map = {job.id: job for job in jobs}

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

    customer = db.query(Customer).filter(Customer.id == statement.customer_id).first()
    paid_amount = Decimal(0)
    balance = statement.total - paid_amount

    return StatementResponse(
        id=statement.id,
        number=statement.number,
        customer_id=statement.customer_id,
        customer_name=customer.name if customer else None,
        period_from=statement.period_from,
        period_to=statement.period_to,
        status=statement.status,
        subtotal=statement.subtotal,
        tax=statement.tax,
        total=statement.total,
        paid_amount=paid_amount,
        balance=balance,
        lines=[
            StatementLineResponse(
                id=line.id,
                job_id=line.job_id,
                description=line.description,
                qty=line.qty,
                unit_price=line.unit_price,
                total=line.total,
                material_name=getattr(job_map.get(line.job_id), 'material', None).name if job_map.get(line.job_id) and getattr(job_map.get(line.job_id), 'material', None) else None,
                truck_plate=getattr(job_map.get(line.job_id), 'truck', None).plate_number if job_map.get(line.job_id) and getattr(job_map.get(line.job_id), 'truck', None) else None,
            )
            for line in statement.lines
        ],
    )


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

    statements = query.options(joinedload(StatementModel.lines)).order_by(StatementModel.created_at.desc()).all()

    customer_map = {
        c.id: c.name for c in db.query(Customer).filter(Customer.org_id == current_user.org_id).all()
    }

    statement_ids = [s.id for s in statements]
    paid_map = {}
    if statement_ids:
        allocations = (
            db.query(PaymentAllocationModel.statement_id, func.coalesce(func.sum(PaymentAllocationModel.amount), 0))
            .filter(PaymentAllocationModel.statement_id.in_(statement_ids))
            .group_by(PaymentAllocationModel.statement_id)
            .all()
        )
        paid_map = {stmt_id: Decimal(str(total)) for stmt_id, total in allocations}

    statement_job_ids = [line.job_id for stmt in statements for line in stmt.lines]
    jobs_map = {}
    if statement_job_ids:
        jobs = (
            db.query(Job)
            .options(joinedload(Job.material), joinedload(Job.truck))
            .filter(Job.org_id == current_user.org_id, Job.id.in_(statement_job_ids))
            .all()
        )
        jobs_map = {job.id: job for job in jobs}

    response_items = []
    for stmt in statements:
        paid_amount = paid_map.get(stmt.id, Decimal(0))
        balance = stmt.total - paid_amount
        response_items.append(StatementResponse(
            id=stmt.id,
            number=stmt.number,
            customer_id=stmt.customer_id,
            customer_name=customer_map.get(stmt.customer_id),
            period_from=stmt.period_from,
            period_to=stmt.period_to,
            status=stmt.status,
            subtotal=stmt.subtotal,
            tax=stmt.tax,
            total=stmt.total,
            paid_amount=paid_amount,
            balance=balance,
            lines=[
                StatementLineResponse(
                    id=line.id,
                    job_id=line.job_id,
                    description=line.description,
                    qty=line.qty,
                    unit_price=line.unit_price,
                    total=line.total,
                    material_name=getattr(jobs_map.get(line.job_id), 'material', None).name if jobs_map.get(line.job_id) and getattr(jobs_map.get(line.job_id), 'material', None) else None,
                    truck_plate=getattr(jobs_map.get(line.job_id), 'truck', None).plate_number if jobs_map.get(line.job_id) and getattr(jobs_map.get(line.job_id), 'truck', None) else None,
                )
                for line in stmt.lines
            ],
        ))

    return response_items


@router.get("/statements/{statement_id}/pdf")
def download_statement_pdf(
    statement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    statement = (
        db.query(StatementModel)
        .options(joinedload(StatementModel.lines))
        .filter(
            StatementModel.id == statement_id,
            StatementModel.org_id == current_user.org_id,
        )
        .first()
    )
    if not statement:
        raise HTTPException(status_code=404, detail="Statement not found")

    customer = db.query(Customer).filter(Customer.id == statement.customer_id).first()

    allocations_total = (
        db.query(func.coalesce(func.sum(PaymentAllocationModel.amount), 0))
        .filter(PaymentAllocationModel.statement_id == statement.id)
        .scalar()
    )
    paid_amount = Decimal(str(allocations_total or 0))
    balance = statement.total - paid_amount

    job_ids = [line.job_id for line in statement.lines]
    jobs_map = {}
    if job_ids:
        jobs = (
            db.query(Job)
            .options(joinedload(Job.material), joinedload(Job.truck))
            .filter(Job.org_id == current_user.org_id, Job.id.in_(job_ids))
            .all()
        )
        jobs_map = {job.id: job for job in jobs}

    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()

    statement_data = {
        "org_name": (org.display_name or org.name) if org else "",
        "org_email": org.contact_email if org else "",
        "org_phone": org.contact_phone if org else "",
        "org_vat": org.vat_id if org else "",
        "logo_url": org.logo_url if org else None,
        "number": statement.number,
        "issued_at": statement.created_at.strftime("%d/%m/%Y"),
        "customer_name": customer.name if customer else "",
        "period": f"{statement.period_from.strftime('%d/%m/%Y')} - {statement.period_to.strftime('%d/%m/%Y')}",
        "subtotal": _format_money(statement.subtotal),
        "tax": _format_money(statement.tax),
        "total": _format_money(statement.total),
        "balance": _format_money(balance),
        "lines": [
            {
                "job_id": line.job_id,
                "qty": _format_money(line.qty),
                "unit_price": _format_money(line.unit_price),
                "total": _format_money(line.total),
                "material_name": getattr(jobs_map.get(line.job_id), 'material', None).name if jobs_map.get(line.job_id) and getattr(jobs_map.get(line.job_id), 'material', None) else None,
                "truck_plate": getattr(jobs_map.get(line.job_id), 'truck', None).plate_number if jobs_map.get(line.job_id) and getattr(jobs_map.get(line.job_id), 'truck', None) else None,
            }
            for line in statement.lines
        ],
    }

    pdf_gen = StatementPDF()
    pdf_buffer = pdf_gen.generate(statement_data)

    filename = f"statement_{statement.number}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


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
            org_id=current_user.org_id,
            payment_id=payment_id,
            statement_id=alloc.statement_id,
            amount=alloc.amount,
        )
        db.add(db_alloc)

        # Update statement status
        statement = db.query(StatementModel).get(alloc.statement_id)
        if statement:
            total_allocated = (
                db.query(func.coalesce(func.sum(PaymentAllocationModel.amount), 0))
                .filter(PaymentAllocationModel.statement_id == alloc.statement_id)
                .scalar()
            )

            if total_allocated >= statement.total:
                statement.status = StatementStatus.PAID
            elif total_allocated > 0:
                statement.status = StatementStatus.PARTIALLY_PAID

    db.commit()
    return {"message": "Payment allocated"}
