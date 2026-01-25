from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import User, File as FileModel, JobFile, Job
from app.services.storage import get_storage_service
from pydantic import BaseModel

router = APIRouter()
security = HTTPBearer()


class FileResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    size: int
    uploaded_at: datetime
    uploaded_by_name: str
    url: str

    class Config:
        from_attributes = True


class JobFilesResponse(BaseModel):
    job_id: int
    files: List[FileResponse]
    total: int


def get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return user


@router.post("/jobs/{job_id}/files/upload", response_model=FileResponse)
async def upload_job_file(
    job_id: int,
    file: UploadFile = File(...),
    file_type: str = Form("PHOTO"),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Upload a file (photo, PDF, etc.) for a job"""
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.org_id == current_user.org_id
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Validate file type
    valid_types = ["PHOTO", "WEIGH_TICKET", "DELIVERY_NOTE", "OTHER"]
    file_type_upper = file_type.upper()
    if file_type_upper not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Must be one of: {', '.join(valid_types)}"
        )
    
    storage = get_storage_service()
    
    try:
        storage_key = storage.upload_file(
            file=file.file,
            filename=file.filename,
            folder=f"jobs/{job_id}",
            content_type=file.content_type
        )
        
        file_record = FileModel(
            org_id=current_user.org_id,
            storage_key=storage_key,
            filename=file.filename,
            mime_type=file.content_type,
            size=file.size or 0,
            uploaded_by=current_user.id
        )
        db.add(file_record)
        db.flush()
        
        job_file = JobFile(
            job_id=job_id,
            file_id=file_record.id,
            file_type=file_type_upper
        )
        db.add(job_file)
        db.commit()
        db.refresh(file_record)
        
        url = storage.get_presigned_url(storage_key, expiration=3600)
        
        return FileResponse(
            id=file_record.id,
            filename=file_record.filename,
            file_type=file_type,
            size=file_record.size,
            uploaded_at=file_record.uploaded_at,
            uploaded_by_name=current_user.name,
            url=url
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/jobs/{job_id}/files", response_model=JobFilesResponse)
async def get_job_files(
    job_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all files for a job"""
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.org_id == current_user.org_id
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_files = db.query(JobFile).filter(JobFile.job_id == job_id).all()
    
    storage = get_storage_service()
    files_response = []
    
    for jf in job_files:
        file_record = db.query(FileModel).filter(FileModel.id == jf.file_id).first()
        if file_record:
            uploader = db.query(User).filter(User.id == file_record.uploaded_by).first()
            url = storage.get_presigned_url(file_record.storage_key, expiration=3600)
            
            files_response.append(FileResponse(
                id=file_record.id,
                filename=file_record.filename,
                file_type=jf.file_type or "OTHER",
                size=file_record.size,
                uploaded_at=file_record.uploaded_at,
                uploaded_by_name=uploader.name if uploader else "Unknown",
                url=url
            ))
    
    return JobFilesResponse(
        job_id=job_id,
        files=files_response,
        total=len(files_response)
    )


@router.delete("/files/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete a file (admin only)"""
    roles = [role.role.value for role in current_user.roles]
    if "ADMIN" not in roles:
        raise HTTPException(status_code=403, detail="Admin only")
    
    file_record = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.org_id == current_user.org_id
    ).first()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    storage = get_storage_service()
    storage.delete_file(file_record.storage_key)
    
    db.query(JobFile).filter(JobFile.file_id == file_id).delete()
    db.delete(file_record)
    db.commit()
    
    return {"message": "File deleted", "file_id": file_id}
