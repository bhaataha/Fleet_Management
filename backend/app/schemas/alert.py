"""
Alert schemas for API
"""
from pydantic import BaseModel, Field
from typing import Optional, Any, Union
from datetime import datetime
from uuid import UUID


class AlertBase(BaseModel):
    """Base alert schema"""
    alert_type: str
    severity: str
    category: str
    title: str
    message: str
    action_url: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None


class AlertCreate(AlertBase):
    """Schema for creating alert"""
    org_id: Union[int, UUID]
    created_for_user_id: Optional[int] = None
    created_for_role: Optional[str] = None
    expires_at: Optional[datetime] = None
    alert_metadata: Optional[dict] = Field(default_factory=dict)


class AlertUpdate(BaseModel):
    """Schema for updating alert"""
    status: Optional[str] = None
    read_at: Optional[datetime] = None
    dismissed_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = None


class AlertResponse(AlertBase):
    """Schema for alert response"""
    id: int
    org_id: Union[int, UUID]
    status: str
    read_at: Optional[datetime] = None
    dismissed_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = None
    created_for_user_id: Optional[int] = None
    created_for_role: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    alert_metadata: Optional[dict] = None
    
    # Computed properties
    is_read: bool = False
    is_active: bool = True
    is_expired: bool = False
    
    class Config:
        from_attributes = True


class AlertListResponse(BaseModel):
    """Schema for list of alerts"""
    total: int
    unread: int
    items: list[AlertResponse]


class UnreadCountResponse(BaseModel):
    """Schema for unread count"""
    count: int


class AlertStatsResponse(BaseModel):
    """Schema for alert statistics"""
    total: int
    unread: int
    by_severity: dict[str, int]
    by_category: dict[str, int]
