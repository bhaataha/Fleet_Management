"""
Alerts API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.middleware.tenant import get_current_org_id, get_current_user_id, get_org_role
from app.services.alert_service import AlertService
from app.schemas.alert import (
    AlertResponse, 
    AlertListResponse, 
    UnreadCountResponse,
    AlertStatsResponse
)
from app.models.alert import AlertStatus, AlertCategory, AlertSeverity

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=AlertListResponse)
def list_alerts(
    request: Request,
    status: Optional[str] = Query(None, description="Filter by status: UNREAD, READ, DISMISSED, RESOLVED"),
    category: Optional[str] = Query(None, description="Filter by category: OPERATIONAL, MAINTENANCE, FINANCIAL, SYSTEM, REALTIME"),
    severity: Optional[str] = Query(None, description="Filter by severity: CRITICAL, HIGH, MEDIUM, LOW, INFO, SUCCESS"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    List alerts for current organization/user
    
    Filters:
    - status: Alert status
    - category: Alert category
    - severity: Alert severity
    - Automatically filters by org_id from JWT
    - Automatically filters by user_id or role from JWT
    """
    org_id = get_current_org_id(request)
    user_id = get_current_user_id(request)
    user_role = get_org_role(request)
    
    # Parse enum filters
    status_enum = None
    if status:
        try:
            status_enum = AlertStatus(status.upper())
        except ValueError:
            raise HTTPException(400, f"Invalid status: {status}")
    
    category_enum = None
    if category:
        try:
            category_enum = AlertCategory(category.upper())
        except ValueError:
            raise HTTPException(400, f"Invalid category: {category}")
    
    severity_enum = None
    if severity:
        try:
            severity_enum = AlertSeverity(severity.upper())
        except ValueError:
            raise HTTPException(400, f"Invalid severity: {severity}")
    
    # Get alerts
    alerts, total = AlertService.get_alerts(
        db=db,
        org_id=org_id,
        user_id=user_id,
        user_role=user_role,
        status=status_enum,
        category=category_enum,
        severity=severity_enum,
        skip=skip,
        limit=limit
    )
    
    # Get unread count
    unread = AlertService.get_unread_count(
        db=db,
        org_id=org_id,
        user_id=user_id,
        user_role=user_role
    )
    
    # Convert to response
    items = []
    for alert in alerts:
        alert_response = AlertResponse.from_orm(alert)
        alert_response.is_read = alert.is_read
        alert_response.is_active = alert.is_active
        alert_response.is_expired = alert.is_expired
        items.append(alert_response)
    
    return AlertListResponse(
        total=total,
        unread=unread,
        items=items
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get count of unread alerts
    
    Used for notification badge in header
    """
    org_id = get_current_org_id(request)
    user_id = get_current_user_id(request)
    user_role = get_org_role(request)
    
    count = AlertService.get_unread_count(
        db=db,
        org_id=org_id,
        user_id=user_id,
        user_role=user_role
    )
    
    return UnreadCountResponse(count=count)


@router.get("/stats", response_model=AlertStatsResponse)
def get_alert_stats(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get alert statistics
    
    Returns:
    - Total alerts
    - Unread count
    - Breakdown by severity
    - Breakdown by category
    """
    org_id = get_current_org_id(request)
    user_id = get_current_user_id(request)
    user_role = get_org_role(request)
    
    stats = AlertService.get_alert_stats(
        db=db,
        org_id=org_id,
        user_id=user_id,
        user_role=user_role
    )
    
    return AlertStatsResponse(**stats)


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(
    alert_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get single alert by ID
    
    Automatically filters by org_id from JWT
    """
    org_id = get_current_org_id(request)
    
    alert = AlertService.get_alert_by_id(db, alert_id, org_id)
    
    if not alert:
        raise HTTPException(404, "Alert not found")
    
    alert_response = AlertResponse.from_orm(alert)
    alert_response.is_read = alert.is_read
    alert_response.is_active = alert.is_active
    alert_response.is_expired = alert.is_expired
    
    return alert_response


@router.post("/{alert_id}/read", response_model=AlertResponse)
def mark_alert_as_read(
    alert_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Mark alert as read
    
    Changes status from UNREAD to READ
    """
    org_id = get_current_org_id(request)
    
    alert = AlertService.mark_as_read(db, alert_id, org_id)
    
    if not alert:
        raise HTTPException(404, "Alert not found")
    
    alert_response = AlertResponse.from_orm(alert)
    alert_response.is_read = alert.is_read
    alert_response.is_active = alert.is_active
    alert_response.is_expired = alert.is_expired
    
    return alert_response


@router.post("/{alert_id}/dismiss", response_model=AlertResponse)
def dismiss_alert(
    alert_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Dismiss alert
    
    Changes status to DISMISSED and removes from active list
    """
    org_id = get_current_org_id(request)
    
    alert = AlertService.dismiss_alert(db, alert_id, org_id)
    
    if not alert:
        raise HTTPException(404, "Alert not found")
    
    alert_response = AlertResponse.from_orm(alert)
    alert_response.is_read = alert.is_read
    alert_response.is_active = alert.is_active
    alert_response.is_expired = alert.is_expired
    
    return alert_response


@router.post("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Resolve alert
    
    Changes status to RESOLVED (typically done by system when issue is fixed)
    """
    org_id = get_current_org_id(request)
    user_id = get_current_user_id(request)
    
    alert = AlertService.resolve_alert(db, alert_id, org_id, user_id)
    
    if not alert:
        raise HTTPException(404, "Alert not found")
    
    alert_response = AlertResponse.from_orm(alert)
    alert_response.is_read = alert.is_read
    alert_response.is_active = alert.is_active
    alert_response.is_expired = alert.is_expired
    
    return alert_response
