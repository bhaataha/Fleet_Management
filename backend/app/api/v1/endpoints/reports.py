from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import base64

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Organization, User
from app.services.pdf_generator import SubcontractorPaymentPDF, CustomerReportPDF, ARAgingPDF, DailyJobsPDF
from app.services.storage import get_storage_service
import os
from app.services.email_service import send_email_smtp

router = APIRouter()


class SubcontractorReportLine(BaseModel):
    date: str
    job_id: int
    customer: Optional[str] = None
    from_site: Optional[str] = None
    to_site: Optional[str] = None
    material: Optional[str] = None
    quantity: str
    unit: str
    price: str
    status: Optional[str] = None


class SubcontractorReportTotals(BaseModel):
    total_jobs: int
    total_quantity: str
    total_amount: str


class SubcontractorPaymentReportRequest(BaseModel):
    subcontractor_name: str
    subcontractor_plate: Optional[str] = None
    subcontractor_phone: Optional[str] = None
    period_from: str
    period_to: str
    generated_at: Optional[str] = None
    totals: SubcontractorReportTotals
    lines: List[SubcontractorReportLine]


class ReportEmailRequest(BaseModel):
    to_email: str
    subject: Optional[str] = None
    body: Optional[str] = None
    attachment_filename: Optional[str] = None
    attachment_mime: Optional[str] = None
    attachment_base64: Optional[str] = None


class CustomerReportLine(BaseModel):
    date: str
    job_id: int
    from_site: Optional[str] = None
    to_site: Optional[str] = None
    material: Optional[str] = None
    quantity: str
    unit: str
    unit_price: str
    total: str


class CustomerReportRequest(BaseModel):
    customer_name: str
    period_from: str
    period_to: str
    lines: List[CustomerReportLine]


class ARAgingLine(BaseModel):
    customer: str
    current: str
    days_30: str
    days_60: str
    days_90: str
    total: str


class ARAgingReportRequest(BaseModel):
    as_of_date: str
    lines: List[ARAgingLine]


class DailyJobsLine(BaseModel):
    job_id: int
    customer: str
    driver: str
    truck: str
    from_site: str
    to_site: str
    material: str
    quantity: str
    unit: str
    status: str


class DailyJobsReportRequest(BaseModel):
    date: str
    lines: List[DailyJobsLine]


def _to_absolute_url(request: Request, path_or_url: str) -> str:
    if not path_or_url:
        return path_or_url
    if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
        return path_or_url
    base = os.getenv("PUBLIC_BASE_URL") or str(request.base_url).rstrip("/")
    return f"{base}{path_or_url}"


def _upload_pdf_and_get_url(request: Request, pdf_buffer, filename: str, org_id) -> str:
    storage = get_storage_service()
    pdf_buffer.seek(0)
    storage_key = storage.upload_file(
        file=pdf_buffer,
        filename=filename,
        folder=f"reports/{org_id}",
        content_type="application/pdf",
    )
    url = storage.get_presigned_url(storage_key, expiration=60 * 60 * 24)
    return _to_absolute_url(request, url)


@router.post("/reports/subcontractor-payment/pdf")
def subcontractor_payment_pdf(
    data: SubcontractorPaymentReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    org_info = {
        "org_name": (org.display_name or org.name) if org else "",
        "org_email": org.contact_email if org else "",
        "org_phone": org.contact_phone if org else "",
        "org_vat": org.vat_id if org else "",
        "logo_url": org.logo_url if org else None,
    }

    payload = data.dict()
    payload["generated_at"] = payload.get("generated_at") or datetime.utcnow().strftime("%d/%m/%Y")

    pdf_gen = SubcontractorPaymentPDF()
    pdf_buffer = pdf_gen.generate(payload, org_info)

    filename = "subcontractor_payment_report.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.post("/reports/subcontractor-payment/share")
def subcontractor_payment_share(
    data: SubcontractorPaymentReportRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    org_info = {
        "org_name": (org.display_name or org.name) if org else "",
        "org_email": org.contact_email if org else "",
        "org_phone": org.contact_phone if org else "",
        "org_vat": org.vat_id if org else "",
        "logo_url": org.logo_url if org else None,
    }

    payload = data.dict()
    payload["generated_at"] = payload.get("generated_at") or datetime.utcnow().strftime("%d/%m/%Y")

    pdf_gen = SubcontractorPaymentPDF()
    pdf_buffer = pdf_gen.generate(payload, org_info)
    filename = "subcontractor_payment_report.pdf"
    url = _upload_pdf_and_get_url(request, pdf_buffer, filename, current_user.org_id)
    return {"share_url": url}


@router.post("/reports/customer-report/share")
def customer_report_share(
    data: CustomerReportRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    org_info = {
        "org_name": (org.display_name or org.name) if org else "",
        "org_email": org.contact_email if org else "",
        "org_phone": org.contact_phone if org else "",
        "org_vat": org.vat_id if org else "",
        "logo_url": org.logo_url if org else None,
    }

    payload = data.dict()
    pdf_gen = CustomerReportPDF()
    pdf_buffer = pdf_gen.generate(payload, org_info)
    filename = "customer_report.pdf"
    url = _upload_pdf_and_get_url(request, pdf_buffer, filename, current_user.org_id)
    return {"share_url": url}


@router.post("/reports/ar-aging/share")
def ar_aging_share(
    data: ARAgingReportRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    org_info = {
        "org_name": (org.display_name or org.name) if org else "",
        "org_email": org.contact_email if org else "",
        "org_phone": org.contact_phone if org else "",
        "org_vat": org.vat_id if org else "",
        "logo_url": org.logo_url if org else None,
    }

    payload = data.dict()
    pdf_gen = ARAgingPDF()
    pdf_buffer = pdf_gen.generate(payload, org_info)
    filename = "ar_aging_report.pdf"
    url = _upload_pdf_and_get_url(request, pdf_buffer, filename, current_user.org_id)
    return {"share_url": url}


@router.post("/reports/daily-jobs/share")
def daily_jobs_share(
    data: DailyJobsReportRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    org_info = {
        "org_name": (org.display_name or org.name) if org else "",
        "org_email": org.contact_email if org else "",
        "org_phone": org.contact_phone if org else "",
        "org_vat": org.vat_id if org else "",
        "logo_url": org.logo_url if org else None,
    }

    payload = data.dict()
    pdf_gen = DailyJobsPDF()
    pdf_buffer = pdf_gen.generate(payload, org_info)
    filename = "daily_jobs_report.pdf"
    url = _upload_pdf_and_get_url(request, pdf_buffer, filename, current_user.org_id)
    return {"share_url": url}


@router.post("/reports/send-email", response_model=dict)
def send_report_email(
    data: ReportEmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = db.query(Organization).filter(Organization.id == current_user.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    settings_json = org.settings_json or {}
    smtp_settings = settings_json.get("smtp")
    if not smtp_settings:
        raise HTTPException(status_code=400, detail="SMTP settings not configured")

    attachments = []
    if data.attachment_base64 and data.attachment_filename:
        try:
            file_bytes = base64.b64decode(data.attachment_base64)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid attachment data")
        attachments.append((
            data.attachment_filename,
            file_bytes,
            data.attachment_mime or "application/octet-stream"
        ))

    try:
        send_email_smtp(
            smtp_settings=smtp_settings,
            to_email=data.to_email,
            subject=data.subject or "Report",
            body=data.body or "",
            attachments=attachments
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

    return {"success": True, "message": "Email sent"}
