from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models import ShareUrl, Job
from app.core.security import create_access_token
from datetime import datetime, timedelta, timezone

router = APIRouter()


@router.get("/{short_id}")
async def redirect_to_pdf(
    short_id: str,
    db: Session = Depends(get_db)
):
    """
    Public endpoint that redirects short URL to PDF
    No authentication required - security through obscurity
    """
    # Find active share URL
    share_url = db.query(ShareUrl).options(
        joinedload(ShareUrl.job)
    ).filter(
        ShareUrl.short_id == short_id,
        ShareUrl.is_active == True
    ).first()
    
    if not share_url:
        raise HTTPException(status_code=404, detail="Share link not found or expired")
    
    # Check if expired
    if share_url.expires_at and datetime.now(timezone.utc) > share_url.expires_at:
        raise HTTPException(status_code=410, detail="Share link has expired")
    
    # Create temporary token for PDF access
    import time
    exp_timestamp = int((datetime.now(timezone.utc) + timedelta(minutes=5)).timestamp())
    
    token_data = {
        "sub": str(share_url.created_by or 0),
        "org_id": str(share_url.org_id),
        "exp": exp_timestamp  # Unix timestamp
    }
    temp_token = create_access_token(token_data)
    
    # Redirect to PDF endpoint with temporary token as query parameter
    pdf_url = f"https://truckflow.site/api/jobs/{share_url.job_id}/pdf?token={temp_token}"
    return RedirectResponse(url=pdf_url, status_code=302)