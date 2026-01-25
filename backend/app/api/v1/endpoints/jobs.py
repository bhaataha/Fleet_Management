from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.core.database import get_db
from app.models import Job, JobStatus, JobStatusEvent, BillingUnit
from app.middleware.tenant import get_current_org_id, get_current_user_info
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

router = APIRouter()


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
    pass


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
    actual_qty: Optional[float] = None
    status: Optional[JobStatus] = None
    notes: Optional[str] = None


class JobResponse(JobBase):
    id: int
    org_id: UUID
    driver_id: Optional[int]
    truck_id: Optional[int]
    trailer_id: Optional[int]
    actual_qty: Optional[float]
    status: JobStatus
    pricing_total: Optional[float]
    is_billable: bool
    created_at: datetime
    
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
    limit: int = Query(50, ge=1, le=200),
    date: Optional[datetime] = None,
    status: Optional[JobStatus] = None,
    customer_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    List jobs with filters for dispatch board (filtered by org_id from JWT)
    """
    org_id = get_current_org_id(request)
    
    query = db.query(Job).filter(Job.org_id == org_id)
    
    if date:
        query = query.filter(Job.scheduled_date >= date, 
                           Job.scheduled_date < date.replace(hour=23, minute=59))
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
    
    job = db.query(Job).filter(
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
    """
    user_info = get_current_user_info(request)
    org_id = UUID(user_info["org_id"])
    user_id = user_info["user_id"]
    
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
    """
    user_info = get_current_user_info(request)
    org_id = UUID(user_info["org_id"])
    user_id = user_info["user_id"]
    
    db_job = db.query(Job).filter(
        Job.id == job_id,
        Job.org_id == org_id
    ).first()
    
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Track if status changed
    old_status = db_job.status
    
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
    user_info = get_current_user_info(request)
    org_id = UUID(user_info["org_id"])
    user_id = user_info["user_id"]
    
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
