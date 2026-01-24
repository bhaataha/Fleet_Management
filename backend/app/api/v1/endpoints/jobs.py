from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.core.database import get_db
from app.models import Job, JobStatus, JobStatusEvent, BillingUnit
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class JobBase(BaseModel):
    customer_id: int
    from_site_id: int
    to_site_id: int
    material_id: int
    scheduled_date: datetime
    planned_qty: Decimal
    unit: BillingUnit
    priority: int = 0
    notes: Optional[str] = None


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    driver_id: Optional[int] = None
    truck_id: Optional[int] = None
    trailer_id: Optional[int] = None
    actual_qty: Optional[Decimal] = None
    notes: Optional[str] = None


class JobResponse(JobBase):
    id: int
    org_id: int
    driver_id: Optional[int]
    truck_id: Optional[int]
    trailer_id: Optional[int]
    actual_qty: Optional[Decimal]
    status: JobStatus
    pricing_total: Optional[Decimal]
    is_billable: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class JobStatusUpdate(BaseModel):
    status: JobStatus
    note: Optional[str] = None
    lat: Optional[Decimal] = None
    lng: Optional[Decimal] = None


@router.get("", response_model=List[JobResponse])
async def list_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    date: Optional[datetime] = None,
    status: Optional[JobStatus] = None,
    customer_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    List jobs with filters for dispatch board
    """
    query = db.query(Job)
    
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
async def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("", response_model=JobResponse, status_code=201)
async def create_job(job: JobCreate, db: Session = Depends(get_db)):
    """
    Create new job (Dispatcher creates job in PLANNED status)
    """
    db_job = Job(
        org_id=1,  # TODO: From JWT
        status=JobStatus.PLANNED,
        created_by=1,  # TODO: From JWT
        **job.dict()
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    
    # Create initial status event
    status_event = JobStatusEvent(
        job_id=db_job.id,
        status=JobStatus.PLANNED,
        user_id=1  # TODO: From JWT
    )
    db.add(status_event)
    db.commit()
    
    return db_job


@router.patch("/{job_id}", response_model=JobResponse)
async def update_job(job_id: int, job_update: JobUpdate, db: Session = Depends(get_db)):
    """
    Update job (assign driver/truck, update quantities, etc.)
    """
    db_job = db.query(Job).filter(Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # If assigning driver/truck for first time, change status to ASSIGNED
    if (job_update.driver_id or job_update.truck_id) and db_job.status == JobStatus.PLANNED:
        db_job.status = JobStatus.ASSIGNED
        status_event = JobStatusEvent(
            job_id=db_job.id,
            status=JobStatus.ASSIGNED,
            user_id=1  # TODO: From JWT
        )
        db.add(status_event)
    
    for field, value in job_update.dict(exclude_unset=True).items():
        setattr(db_job, field, value)
    
    db.commit()
    db.refresh(db_job)
    return db_job


@router.post("/{job_id}/status", response_model=JobResponse)
async def update_job_status(
    job_id: int,
    status_update: JobStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Update job status (driver updates from mobile app)
    """
    db_job = db.query(Job).filter(Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # TODO: Validate status transition (state machine)
    # For now, allow any transition
    
    db_job.status = status_update.status
    
    # Create status event
    status_event = JobStatusEvent(
        job_id=job_id,
        status=status_update.status,
        user_id=1,  # TODO: From JWT
        lat=status_update.lat,
        lng=status_update.lng,
        note=status_update.note
    )
    db.add(status_event)
    
    db.commit()
    db.refresh(db_job)
    return db_job
