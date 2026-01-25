"""
Organization model for multi-tenant support
"""
from sqlalchemy import Column, String, Integer, Date, DateTime, Numeric, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class Organization(Base):
    """
    Organization/Tenant model
    Represents a company using the TruckFlow system
    """
    __tablename__ = "organizations"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic Info
    name = Column(String(200), nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    display_name = Column(String(200), nullable=True)
    
    # Contact
    contact_name = Column(String(200), nullable=True)
    contact_email = Column(String(255), unique=True, nullable=False, index=True)
    contact_phone = Column(String(20), nullable=True)
    vat_id = Column(String(50), nullable=True)
    
    # Address
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(3), default='ISR')
    
    # Subscription
    plan_type = Column(String(50), nullable=False, default='trial', index=True)
    # Possible values: 'trial', 'starter', 'professional', 'enterprise', 'suspended'
    plan_start_date = Column(Date, nullable=True)
    plan_end_date = Column(Date, nullable=True)
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    
    # Limits (from plan)
    max_trucks = Column(Integer, default=5)
    max_drivers = Column(Integer, default=10)
    max_storage_gb = Column(Integer, default=10)
    features_json = Column(JSONB, default={})
    # Example: {"gps_tracking": true, "api_access": false, "white_label": false}
    
    # Billing
    billing_cycle = Column(String(20), default='monthly')  # 'monthly', 'yearly'
    billing_email = Column(String(255), nullable=True)
    last_payment_date = Column(Date, nullable=True)
    next_billing_date = Column(Date, nullable=True)
    total_paid = Column(Numeric(10, 2), default=0)
    
    # Settings
    timezone = Column(String(50), default='Asia/Jerusalem')
    locale = Column(String(10), default='he')  # 'he', 'en', 'ar'
    currency = Column(String(3), default='ILS')
    settings_json = Column(JSONB, default={})
    
    # Branding (White Label - Phase 2)
    logo_url = Column(Text, nullable=True)
    primary_color = Column(String(7), nullable=True)  # #3B82F6
    custom_domain = Column(String(255), nullable=True)  # trucks.company.com
    
    # Status
    status = Column(String(50), nullable=False, default='active', index=True)
    # Possible values: 'active', 'trial', 'suspended', 'cancelled'
    suspended_reason = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True), nullable=True)
    
    # Stats (cached for performance)
    total_trucks = Column(Integer, default=0)
    total_drivers = Column(Integer, default=0)
    total_jobs_completed = Column(Integer, default=0)
    storage_used_gb = Column(Numeric(10, 2), default=0)
    
    def __repr__(self):
        return f"<Organization {self.name} ({self.slug})>"
    
    @property
    def is_trial(self):
        """Check if organization is in trial period"""
        return self.plan_type == 'trial'
    
    @property
    def is_active(self):
        """Check if organization is active"""
        return self.status == 'active'
    
    @property
    def is_suspended(self):
        """Check if organization is suspended"""
        return self.status == 'suspended'
    
    def has_feature(self, feature_name: str) -> bool:
        """Check if organization has access to a specific feature"""
        return self.features_json.get(feature_name, False)
    
    def can_add_truck(self) -> bool:
        """Check if organization can add more trucks"""
        return self.total_trucks < self.max_trucks
    
    def can_add_driver(self) -> bool:
        """Check if organization can add more drivers"""
        return self.total_drivers < self.max_drivers
    
    def has_storage_space(self, size_gb: float) -> bool:
        """Check if organization has enough storage space"""
        return (self.storage_used_gb + size_gb) <= self.max_storage_gb
