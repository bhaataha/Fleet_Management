"""
Alert model for notifications system
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class AlertType(str, enum.Enum):
    """Alert types"""
    # Operational
    JOB_NOT_ASSIGNED = "JOB_NOT_ASSIGNED"
    JOB_NOT_STARTED = "JOB_NOT_STARTED"
    JOB_DELAYED = "JOB_DELAYED"
    JOB_MISSING_DOCS = "JOB_MISSING_DOCS"
    JOB_STUCK = "JOB_STUCK"
    
    # Maintenance
    INSURANCE_EXPIRY = "INSURANCE_EXPIRY"
    TEST_EXPIRY = "TEST_EXPIRY"
    LICENSE_EXPIRY = "LICENSE_EXPIRY"
    
    # Financial
    INVOICE_OVERDUE = "INVOICE_OVERDUE"
    DEBT_30_DAYS = "DEBT_30_DAYS"
    HIGH_EXPENSE = "HIGH_EXPENSE"
    SUBCONTRACTOR_UNBILLED = "SUBCONTRACTOR_UNBILLED"
    
    # System
    TRIAL_ENDING = "TRIAL_ENDING"
    TRUCK_LIMIT = "TRUCK_LIMIT"
    DRIVER_LIMIT = "DRIVER_LIMIT"
    STORAGE_LIMIT = "STORAGE_LIMIT"
    
    # Real-time
    JOB_ASSIGNED_TO_DRIVER = "JOB_ASSIGNED_TO_DRIVER"
    JOB_STATUS_CHANGED = "JOB_STATUS_CHANGED"
    JOB_COMPLETED = "JOB_COMPLETED"
    STATEMENT_CREATED = "STATEMENT_CREATED"


class AlertSeverity(str, enum.Enum):
    """Alert severity levels"""
    CRITICAL = "CRITICAL"  # דורש טיפול מיידי
    HIGH = "HIGH"          # דורש טיפול בשעות הקרובות
    MEDIUM = "MEDIUM"      # דורש טיפול היום
    LOW = "LOW"            # למידע בלבד
    INFO = "INFO"          # אינפורמטיבי
    SUCCESS = "SUCCESS"    # אישור חיובי


class AlertCategory(str, enum.Enum):
    """Alert categories"""
    OPERATIONAL = "OPERATIONAL"
    MAINTENANCE = "MAINTENANCE"
    FINANCIAL = "FINANCIAL"
    SYSTEM = "SYSTEM"
    REALTIME = "REALTIME"


class AlertStatus(str, enum.Enum):
    """Alert status"""
    UNREAD = "UNREAD"
    READ = "READ"
    DISMISSED = "DISMISSED"
    RESOLVED = "RESOLVED"


class Alert(Base):
    """Alert/Notification model"""
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    # Alert type and severity
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    category = Column(String(50), nullable=False)
    
    # Content
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    action_url = Column(String(500), nullable=True)
    
    # Entity relation (job, truck, driver, etc.)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(Integer, nullable=True)
    
    # Status
    status = Column(String(20), server_default='UNREAD', nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    dismissed_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Target users
    created_for_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    created_for_role = Column(String(50), nullable=True)
    
    # Metadata (use alert_metadata to avoid SQLAlchemy reserved word)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    alert_metadata = Column(JSONB, server_default='{}', nullable=True)
    
    def __repr__(self):
        return f"<Alert {self.id} {self.alert_type} {self.severity}>"
    
    @property
    def is_read(self):
        return self.status in ['READ', 'DISMISSED', 'RESOLVED']
    
    @property
    def is_active(self):
        return self.status in ['UNREAD', 'READ']
    
    @property
    def is_expired(self):
        if not self.expires_at:
            return False
        from datetime import datetime
        now = datetime.now().replace(tzinfo=None)
        expires_naive = self.expires_at.replace(tzinfo=None) if self.expires_at.tzinfo else self.expires_at
        return now > expires_naive
