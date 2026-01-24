from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
import os

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import (
    File as FileModel,
    JobFile as JobFileModel,
    Job,
    User,
)
from pydantic import BaseModel

router = APIRouter()

# MinIO/S3 configuration (placeholder - would use boto3 in production)
UPLOAD_DIR = "/tmp/fleet_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class FileResponse(BaseModel):
    id: int
    filename: str
    storage_key: str
    mime_type: str
    size: int

    class Config:
        from_attributes = True


@router.post("/files/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a file to storage (photos, PDFs, signatures)
    In production, this would upload to MinIO/S3
    """
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    storage_key = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, storage_key)

    # Save file (in production: upload to S3)
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    # Create database record
    db_file = FileModel(
        org_id=current_user.org_id,
        storage_key=storage_key,
        filename=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        size=len(contents),
        uploaded_by=current_user.id,
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return db_file


@router.post("/jobs/{job_id}/files")
def attach_file_to_job(
    job_id: int,
    file_id: int,
    file_type: str,  # PHOTO, WEIGH_TICKET, DELIVERY_NOTE, OTHER
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Attach an uploaded file to a job
    """
    job = (
        db.query(Job)
        .filter(Job.id == job_id, Job.org_id == current_user.org_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    file = (
        db.query(FileModel)
        .filter(
            FileModel.id == file_id, FileModel.org_id == current_user.org_id
        )
        .first()
    )
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    job_file = JobFileModel(job_id=job_id, file_id=file_id, type=file_type)
    db.add(job_file)
    db.commit()

    return {"message": "File attached to job", "job_file_id": job_file.id}


@router.get("/jobs/{job_id}/files", response_model=List[FileResponse])
def list_job_files(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all files attached to a job
    """
    job = (
        db.query(Job)
        .filter(Job.id == job_id, Job.org_id == current_user.org_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job_files = (
        db.query(JobFileModel)
        .filter(JobFileModel.job_id == job_id)
        .all()
    )

    file_ids = [jf.file_id for jf in job_files]
    files = db.query(FileModel).filter(FileModel.id.in_(file_ids)).all()

    return files


class DeliveryNoteCreate(BaseModel):
    receiver_name: str
    receiver_signature_file_id: int
    note: str = ""


@router.post("/jobs/{job_id}/delivery-note")
def create_delivery_note(
    job_id: int,
    delivery_note: DeliveryNoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create delivery note with signature
    Required before marking job as DELIVERED
    """
    from app.models import DeliveryNote
    from datetime import datetime

    job = (
        db.query(Job)
        .filter(Job.id == job_id, Job.org_id == current_user.org_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Check if delivery note already exists
    existing = (
        db.query(DeliveryNote).filter(DeliveryNote.job_id == job_id).first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="Delivery note already exists"
        )

    # Verify signature file exists
    signature_file = (
        db.query(FileModel)
        .filter(
            FileModel.id == delivery_note.receiver_signature_file_id,
            FileModel.org_id == current_user.org_id,
        )
        .first()
    )
    if not signature_file:
        raise HTTPException(status_code=404, detail="Signature file not found")

    # Create delivery note
    db_note = DeliveryNote(
        job_id=job_id,
        note_number=f"DN-{job_id:06d}",
        receiver_name=delivery_note.receiver_name,
        receiver_signature_file_id=delivery_note.receiver_signature_file_id,
        delivered_at=datetime.utcnow(),
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)

    return {
        "message": "Delivery note created",
        "delivery_note_id": db_note.id,
        "can_mark_delivered": True,
    }
