from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, Union, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Organization, User
from app.services.storage import get_storage_service

router = APIRouter()


class OrganizationProfileResponse(BaseModel):
    id: Union[int, UUID]
    name: str
    display_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    vat_id: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    logo_url: Optional[str] = None
    settings_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class OrganizationProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    vat_id: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    logo_url: Optional[str] = None
    settings_json: Optional[Dict[str, Any]] = None


@router.get("/organization", response_model=OrganizationProfileResponse)
def get_organization_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.patch("/organization", response_model=OrganizationProfileResponse)
def update_organization_profile(
    data: OrganizationProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    update_data = data.dict(exclude_unset=True)
    settings_update = update_data.pop("settings_json", None)
    for key, value in update_data.items():
        setattr(org, key, value)

    if settings_update is not None:
        current_settings = org.settings_json or {}
        current_settings.update(settings_update)
        org.settings_json = current_settings

    db.commit()
    db.refresh(org)
    return org


@router.post("/organization/logo", response_model=OrganizationProfileResponse)
async def upload_organization_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Logo must be an image")

    storage = get_storage_service()
    storage_key = storage.upload_file(
        file=file.file,
        filename=file.filename,
        folder=f"orgs/{org.id}",
        content_type=file.content_type,
    )

    org.logo_url = storage.get_presigned_url(storage_key, expiration=3600)
    db.commit()
    db.refresh(org)
    return org
