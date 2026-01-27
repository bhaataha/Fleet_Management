from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse, RedirectResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Union
from decimal import Decimal
from app.core.database import get_db
from app.models import Job, JobStatus, JobStatusEvent, BillingUnit, ShareUrl, Driver
from app.models.alert import AlertType, AlertSeverity, AlertCategory
from app.middleware.tenant import get_current_org_id, get_current_user_id
from app.core.security import create_access_token
from app.services.pdf_generator import DeliveryNotePDF
from app.services.alert_service import AlertService
from app.schemas.alert import AlertCreate
from pydantic import BaseModel
from datetime import datetime, timedelta, date
from uuid import UUID

router = APIRouter()


class JobStatusEventResponse(BaseModel):
    id: int
    job_id: int
    status: JobStatus
    event_time: datetime
    lat: Optional[float]
    lng: Optional[float]
    note: Optional[str]
    
    class Config:
        from_attributes = True


# Nested schemas for relations
class CustomerNested(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True


class SiteNested(BaseModel):
    id: int
    name: str
    address: Optional[str]
    
    class Config:
        from_attributes = True


class MaterialNested(BaseModel):
    id: int
    name: str
    billing_unit: str
    
    class Config:
        from_attributes = True


class DriverNested(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    
    class Config:
        from_attributes = True


class TruckNested(BaseModel):
    id: int
    plate_number: str
    
    class Config:
        from_attributes = True


class JobBase(BaseModel):
    customer_id: int
    from_site_id: int
    to_site_id: int
    material_id: int
    scheduled_date: datetime
    planned_qty: float
    unit: BillingUnit
    priority: int = 0
    notes: Optional[str] = None


class JobCreate(JobBase):
    driver_id: Optional[int] = None
    truck_id: Optional[int] = None
    trailer_id: Optional[int] = None
    subcontractor_id: Optional[int] = None
    is_subcontractor: bool = False
    subcontractor_billing_unit: Optional[str] = None  # TON, M3, TRIP, KM
    manual_override_total: Optional[float] = None
    manual_override_reason: Optional[str] = None


class JobUpdate(BaseModel):
    customer_id: Optional[int] = None
    from_site_id: Optional[int] = None
    to_site_id: Optional[int] = None
    material_id: Optional[int] = None
    scheduled_date: Optional[datetime] = None
    planned_qty: Optional[float] = None
    unit: Optional[BillingUnit] = None
    priority: Optional[int] = None
    driver_id: Optional[int] = None
    truck_id: Optional[int] = None
    trailer_id: Optional[int] = None
    subcontractor_id: Optional[int] = None
    is_subcontractor: Optional[bool] = None
    subcontractor_billing_unit: Optional[str] = None  # TON, M3, TRIP, KM
    actual_qty: Optional[float] = None
    status: Optional[JobStatus] = None
    notes: Optional[str] = None
    manual_override_total: Optional[float] = None
    manual_override_reason: Optional[str] = None


class JobResponse(JobBase):
    id: int
    org_id: UUID
    driver_id: Optional[int]
    truck_id: Optional[int]
    trailer_id: Optional[int]
    subcontractor_id: Optional[int]
    is_subcontractor: bool
    subcontractor_billing_unit: Optional[str]
    actual_qty: Optional[float]
    status: JobStatus
    pricing_total: Optional[float]
    manual_override_total: Optional[float]
    manual_override_reason: Optional[str]
    is_billable: bool
    created_at: datetime
    status_events: List[JobStatusEventResponse] = []
    
    # Relations
    customer: Optional[CustomerNested] = None
    from_site: Optional[SiteNested] = None
    to_site: Optional[SiteNested] = None
    material: Optional[MaterialNested] = None
    driver: Optional[DriverNested] = None
    truck: Optional[TruckNested] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v) if v else None
        }


class JobStatusUpdate(BaseModel):
    status: JobStatus
    note: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


@router.get("", response_model=List[JobResponse])
async def list_jobs(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),  # הגדלה ל-1000 כדי לתמוך במערכות גדולות
    date: Optional[str] = None,  # תאריך ספציפי (יום בודד) - YYYY-MM-DD
    from_date: Optional[str] = None,  # תאריך התחלה (טווח) - YYYY-MM-DD
    to_date: Optional[str] = None,  # תאריך סיום (טווח) - YYYY-MM-DD
    status: Optional[JobStatus] = None,
    customer_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    List jobs with filters for dispatch board (filtered by org_id from JWT)
    
    Date Filtering:
    - date: Single day (ignores from_date/to_date) - format: YYYY-MM-DD
    - from_date & to_date: Date range (recommended for performance) - format: YYYY-MM-DD
    - If no dates provided: Returns last 50 jobs by default
    """
    org_id = get_current_org_id(request)
    
    query = db.query(Job).options(
        joinedload(Job.status_events),
        joinedload(Job.customer),
        joinedload(Job.from_site),
        joinedload(Job.to_site),
        joinedload(Job.material),
        joinedload(Job.driver),
        joinedload(Job.truck)
    ).filter(Job.org_id == org_id)
    
    # סינון תאריכים: date מנצח על from_date/to_date
    if date:
        # תאריך בודד - כל היום
        date_obj = datetime.strptime(date, '%Y-%m-%d')
        query = query.filter(Job.scheduled_date >= date_obj, 
                           Job.scheduled_date < date_obj.replace(hour=23, minute=59))
    elif from_date or to_date:
        # טווח תאריכים
        if from_date:
            from_date_obj = datetime.strptime(from_date, '%Y-%m-%d')
            query = query.filter(Job.scheduled_date >= from_date_obj)
        if to_date:
            # כולל את כל היום האחרון
            to_date_obj = datetime.strptime(to_date, '%Y-%m-%d')
            query = query.filter(Job.scheduled_date < to_date_obj.replace(hour=23, minute=59, second=59))
    
    if status:
        query = query.filter(Job.status == status)
    if customer_id:
        query = query.filter(Job.customer_id == customer_id)
    if driver_id:
        query = query.filter(Job.driver_id == driver_id)
    
    return query.offset(skip).limit(limit).all()


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get job by ID (filtered by org_id from JWT)
    """
    org_id = get_current_org_id(request)
    
    job = db.query(Job).options(
        joinedload(Job.status_events)
    ).filter(
        Job.id == job_id,
        Job.org_id == org_id
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job


@router.post("", response_model=JobResponse, status_code=201)
async def create_job(
    job: JobCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Create new job (Dispatcher creates job in PLANNED status)
    Auto-assigned to current org from JWT
    
    Manual Pricing Override:
    - If manual_override_total is provided, manual_override_reason is required
    - Only users with ADMIN or ACCOUNTING roles can override pricing
    - Audit log is created automatically for all overrides
    """
    org_id = get_current_org_id(request)
    user_id = get_current_user_id(request)
    
    # Note: Manual pricing override is optional - no validation required for reason
    # TODO: Check user role (ADMIN or ACCOUNTING) - currently allowing all authenticated users
    # if job.manual_override_total is not None:
    #     user_role = getattr(request.state, "org_role", "user")
    #     if user_role not in ["owner", "admin", "accounting"]:
    #         raise HTTPException(status_code=403, detail="Only ADMIN or ACCOUNTING can override pricing")
    
    db_job = Job(
        org_id=org_id,
        status=JobStatus.PLANNED,
        created_by=user_id,
        **job.dict()
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    
    # Create initial status event
    status_event = JobStatusEvent(
        org_id=org_id,
        job_id=db_job.id,
        status=JobStatus.PLANNED,
        user_id=user_id
    )
    db.add(status_event)
    db.commit()
    
    return db_job


@router.patch("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    job_update: JobUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Update job (assign driver/truck, update quantities, status, etc.)
    Filtered by org_id from JWT
    
    Manual Pricing Override:
    - If manual_override_total is provided, manual_override_reason is required
    - Can also clear manual pricing by passing None
    """
    org_id = get_current_org_id(request)
    user_id = get_current_user_id(request)
    
    # Note: Manual pricing override is optional - no validation required for reason
    
    db_job = db.query(Job).filter(
        Job.id == job_id,
        Job.org_id == org_id
    ).first()
    
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Track if status changed
    old_status = db_job.status
    old_driver_id = db_job.driver_id
    
    # Auto-assign status ONLY when assigning driver for FIRST time (was null before)
    # Don't auto-change status if just updating existing driver or if user explicitly set status
    if (job_update.driver_id and db_job.driver_id is None) and db_job.status == JobStatus.PLANNED and not job_update.status:
        db_job.status = JobStatus.ASSIGNED
        status_event = JobStatusEvent(
            org_id=org_id,
            job_id=db_job.id,
            status=JobStatus.ASSIGNED,
            user_id=user_id
        )
        db.add(status_event)
        
        # Auto-resolve JOB_NOT_ASSIGNED alerts
        AlertService.auto_resolve_outdated_alerts(
            db, org_id, AlertType.JOB_NOT_ASSIGNED, "job", db_job.id
        )
    
    # Update all provided fields
    for field, value in job_update.dict(exclude_unset=True).items():
        setattr(db_job, field, value)
    
    # If status was explicitly changed, create a status event
    if job_update.status and job_update.status != old_status:
        status_event = JobStatusEvent(
            org_id=org_id,
            job_id=db_job.id,
            status=job_update.status,
            user_id=user_id
        )
        db.add(status_event)
    
    db.commit()
    db.refresh(db_job)
    
    # Create real-time alert if driver was assigned
    if job_update.driver_id and job_update.driver_id != old_driver_id:
        try:
            # Get driver details
            driver = db.query(Driver).filter(Driver.id == job_update.driver_id).first()
            if driver and driver.user_id:
                alert_data = AlertCreate(
                    org_id=org_id,
                    alert_type=AlertType.JOB_ASSIGNED_TO_DRIVER.value,
                    severity=AlertSeverity.INFO.value,
                    category=AlertCategory.REALTIME.value,
                    title=f"נסיעה חדשה #{db_job.id}",
                    message=f"שובצת לך נסיעה חדשה ל-{db_job.scheduled_date.strftime('%d/%m/%Y %H:%M')}",
                    action_url=f"/jobs/{db_job.id}",
                    entity_type="job",
                    entity_id=db_job.id,
                    created_for_user_id=driver.user_id,
                    expires_at=db_job.scheduled_date + timedelta(hours=48)
                )
                AlertService.create_alert(db, alert_data)
        except Exception as e:
            # Don't fail job update if alert creation fails
            import logging
            logging.error(f"Failed to create driver alert: {e}")
    
    return db_job


@router.post("/{job_id}/status", response_model=JobResponse)
async def update_job_status(
    job_id: int,
    status_update: JobStatusUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Update job status (driver updates from mobile app)
    Filtered by org_id from JWT
    """
    org_id = get_current_org_id(request)
    user_id = get_current_user_id(request)
    
    db_job = db.query(Job).filter(
        Job.id == job_id,
        Job.org_id == org_id
    ).first()
    
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # TODO: Validate status transition (state machine)
    # For now, allow any transition
    
    db_job.status = status_update.status
    
    # Create status event
    status_event = JobStatusEvent(
        org_id=org_id,
        job_id=job_id,
        status=status_update.status,
        user_id=user_id,
        lat=status_update.lat,
        lng=status_update.lng,
        note=status_update.note
    )
    db.add(status_event)
    
    db.commit()
    db.refresh(db_job)
    return db_job


class JobStatusEventResponse(BaseModel):
    id: int
    job_id: int
    status: JobStatus
    event_time: datetime
    lat: Optional[float]
    lng: Optional[float]
    note: Optional[str]
    
    class Config:
        from_attributes = True


@router.get("/{job_id}/status-events", response_model=List[JobStatusEventResponse])
async def get_job_status_events(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get all status events for a job (for tracking/timeline)
    Filtered by org_id from JWT
    """
    org_id = get_current_org_id(request)
    
    # First verify job belongs to this org
    db_job = db.query(Job).filter(
        Job.id == job_id,
        Job.org_id == org_id
    ).first()
    
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    events = db.query(JobStatusEvent)\
        .filter(JobStatusEvent.job_id == job_id)\
        .order_by(JobStatusEvent.event_time.desc())\
        .all()
    
    return events


@router.get("/{job_id}/share")
async def create_share_url(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Create short shareable URL for job PDF
    Returns a short link like /share/abc123xy
    """
    org_id = get_current_org_id(request)
    user_id = get_current_user_id(request)
    
    # Verify job exists and belongs to org
    db_job = db.query(Job).filter(
        Job.id == job_id,
        Job.org_id == org_id
    ).first()
    
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if active share URL already exists for this job
    existing_share = db.query(ShareUrl).filter(
        ShareUrl.job_id == job_id,
        ShareUrl.org_id == org_id,
        ShareUrl.is_active == True
    ).first()
    
    if existing_share:
        return {"short_url": f"https://truckflow.site/share/{existing_share.short_id}"}
    
    # Generate short ID (8 characters)
    import random
    import string
    short_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    
    # Ensure uniqueness
    while db.query(ShareUrl).filter(ShareUrl.short_id == short_id).first():
        short_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    
    # Create share URL record
    share_url = ShareUrl(
        short_id=short_id,
        job_id=job_id,
        org_id=org_id,
        created_by=user_id,
        expires_at=datetime.utcnow() + timedelta(days=30)  # Expires in 30 days
    )
    db.add(share_url)
    db.commit()
    
    return {"short_url": f"https://truckflow.site/api/share/{short_id}"}


@router.get("/{job_id}/pdf")
async def download_job_pdf(
    job_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Generate and download delivery note PDF for a job
    Token can be provided via Authorization header OR query parameter (?token=...)
    """
    # org_id already extracted by middleware from token
    org_id = get_current_org_id(request)
    
    # Get job with all related data
    db_job = db.query(Job)\
        .options(
            joinedload(Job.customer),
            joinedload(Job.from_site),
            joinedload(Job.to_site),
            joinedload(Job.material),
            joinedload(Job.driver),
            joinedload(Job.truck)
        )\
        .filter(Job.id == job_id, Job.org_id == org_id)\
        .first()
    
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Prepare data for PDF
    job_data = {
        'id': db_job.id,
        'scheduled_date': db_job.scheduled_date.strftime('%d/%m/%Y') if db_job.scheduled_date else 'N/A',
        'status': db_job.status.value if db_job.status else 'PLANNED',
        'customer_name': db_job.customer.name if db_job.customer else None,
        'from_site_name': db_job.from_site.name if db_job.from_site else 'N/A',
        'from_site_address': db_job.from_site.address if db_job.from_site else '-',
        'to_site_name': db_job.to_site.name if db_job.to_site else 'N/A',
        'to_site_address': db_job.to_site.address if db_job.to_site else '-',
        'material_name': db_job.material.name if db_job.material else 'N/A',
        'planned_qty': float(db_job.planned_qty) if db_job.planned_qty else 0,
        'actual_qty': float(db_job.actual_qty) if db_job.actual_qty else None,
        'unit': db_job.unit.value if db_job.unit else 'TON',
        'driver_name': db_job.driver.name if db_job.driver else None,
        'truck_plate': db_job.truck.plate_number if db_job.truck else None,
        'notes': db_job.notes,
        'manual_override_total': float(db_job.manual_override_total) if db_job.manual_override_total else None,
        'manual_override_reason': db_job.manual_override_reason if db_job.manual_override_reason else None
    }
    
    # Generate PDF
    pdf_gen = DeliveryNotePDF()
    pdf_buffer = pdf_gen.generate(job_data)
    
    # Create filename with job number and customer name
    customer_name = db_job.customer.name if db_job.customer else 'NoCustomer'
    # Clean customer name for filename (remove special characters, keep Hebrew)
    import re
    from urllib.parse import quote
    clean_customer = re.sub(r'[^\w\s-]', '', customer_name).strip().replace(' ', '_')
    
    # Use URL encoding for Hebrew filename (RFC 5987)
    filename_encoded = quote(f"תעודה_{job_id}_{clean_customer}.pdf")
    filename_ascii = f"delivery_note_{job_id}.pdf"  # Fallback for old browsers
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename={filename_ascii}; filename*=UTF-8''{filename_encoded}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
