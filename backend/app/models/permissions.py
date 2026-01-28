"""
User Permissions and Phone Authentication Models
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum
from datetime import datetime, timedelta
import random
import string


class UserPermission(Base):
    """User permissions for granular access control"""
    __tablename__ = "user_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    org_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    permission_name = Column(String(100), nullable=False)
    granted = Column(Boolean, default=True, nullable=False)
    granted_by = Column(Integer, ForeignKey("users.id"))
    granted_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="permissions")
    granter = relationship("User", foreign_keys=[granted_by])
    organization = relationship("Organization")
    
    # Unique constraint
    __table_args__ = (
        UniqueConstraint('user_id', 'permission_name', name='uq_user_permission'),
    )
    
    @property
    def is_active(self) -> bool:
        """Check if permission is currently active"""
        if not self.granted:
            return False
        if self.expires_at and self.expires_at < func.now():
            return False
        return True


class PhoneOTP(Base):
    """Phone OTP for authentication"""
    __tablename__ = "phone_otps"
    
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(20), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    otp_code = Column(String(6), nullable=False)
    attempts = Column(Integer, default=0)
    used = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    used_at = Column(DateTime(timezone=True), nullable=True)
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    @classmethod
    def generate_otp(cls) -> str:
        """Generate 6-digit OTP"""
        return ''.join(random.choices(string.digits, k=6))
    
    @property
    def is_valid(self) -> bool:
        """Check if OTP is still valid"""
        from sqlalchemy import text
        from datetime import timezone
        
        # Handle timezone comparison
        now = datetime.utcnow()
        expires = self.expires_at
        if expires.tzinfo:
            # Convert timezone-aware to naive UTC
            expires = expires.replace(tzinfo=None)
            
        return (
            not self.used and 
            self.attempts < 3 and 
            now < expires
        )
    
    def use(self):
        """Mark OTP as used"""
        self.used = True
        self.used_at = func.now()


class PermissionModel(Base):
    """Database model for permissions"""
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    display_name = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# Available Permissions Enum/Constants
class Permission:
    """Available system permissions"""
    
    # Dashboard & Reports
    DASHBOARD_VIEW = "dashboard.view"
    REPORTS_VIEW = "reports.view" 
    REPORTS_FINANCIAL = "reports.financial"
    
    # Jobs & Dispatch
    JOBS_VIEW = "jobs.view"
    JOBS_CREATE = "jobs.create"
    JOBS_EDIT = "jobs.edit"
    JOBS_ASSIGN = "jobs.assign"
    JOBS_DELETE = "jobs.delete"
    JOBS_PRICING = "jobs.pricing"
    
    # Customers & Sites
    CUSTOMERS_VIEW = "customers.view"
    CUSTOMERS_CREATE = "customers.create"
    CUSTOMERS_EDIT = "customers.edit"
    SITES_VIEW = "sites.view"
    SITES_CREATE = "sites.create"
    
    # Fleet Management
    FLEET_VIEW = "fleet.view"
    TRUCKS_CREATE = "trucks.create"
    TRUCKS_EDIT = "trucks.edit"
    DRIVERS_VIEW = "drivers.view"
    DRIVERS_CREATE = "drivers.create"
    
    # Financial
    STATEMENTS_VIEW = "statements.view"
    STATEMENTS_CREATE = "statements.create"
    PAYMENTS_VIEW = "payments.view"
    PAYMENTS_CREATE = "payments.create"
    EXPENSES_VIEW = "expenses.view"
    EXPENSES_CREATE = "expenses.create"
    
    # Alerts
    ALERTS_VIEW = "alerts.view"
    ALERTS_MANAGE = "alerts.manage"
    
    # User Management (Admin only)
    USERS_VIEW = "users.view"
    USERS_CREATE = "users.create"
    USERS_PERMISSIONS = "users.permissions"
    
    # Mobile Driver Features
    MOBILE_JOB_STATUS = "mobile.job_status"
    MOBILE_UPLOAD_FILES = "mobile.upload_files"
    MOBILE_SIGNATURE = "mobile.signature"
    
    @classmethod
    def get_all_permissions(cls) -> dict:
        """Get all available permissions with descriptions"""
        return {
            # Dashboard & Reports
            cls.DASHBOARD_VIEW: "צפייה בדשבורד",
            cls.REPORTS_VIEW: "צפייה בדוחות",
            cls.REPORTS_FINANCIAL: "דוחות כספיים",
            
            # Jobs & Dispatch
            cls.JOBS_VIEW: "צפייה בנסיעות",
            cls.JOBS_CREATE: "יצירת נסיעות",
            cls.JOBS_EDIT: "עריכת נסיעות",
            cls.JOBS_ASSIGN: "שיבוץ נסיעות",
            cls.JOBS_DELETE: "מחיקת נסיעות",
            cls.JOBS_PRICING: "עריכת מחירים",
            
            # Customers & Sites
            cls.CUSTOMERS_VIEW: "צפייה בלקוחות",
            cls.CUSTOMERS_CREATE: "הוספת לקוחות",
            cls.CUSTOMERS_EDIT: "עריכת לקוחות",
            cls.SITES_VIEW: "צפייה באתרים",
            cls.SITES_CREATE: "הוספת אתרים",
            
            # Fleet Management
            cls.FLEET_VIEW: "צפייה בצי",
            cls.TRUCKS_CREATE: "הוספת משאיות",
            cls.TRUCKS_EDIT: "עריכת משאיות",
            cls.DRIVERS_VIEW: "צפייה בנהגים",
            cls.DRIVERS_CREATE: "הוספת נהגים",
            
            # Financial
            cls.STATEMENTS_VIEW: "צפייה בחשבוניות",
            cls.STATEMENTS_CREATE: "יצירת חשבוניות",
            cls.PAYMENTS_VIEW: "צפייה בתשלומים",
            cls.PAYMENTS_CREATE: "רישום תשלומים",
            cls.EXPENSES_VIEW: "צפייה בהוצאות",
            cls.EXPENSES_CREATE: "רישום הוצאות",
            
            # Alerts
            cls.ALERTS_VIEW: "צפייה בהתראות",
            cls.ALERTS_MANAGE: "ניהול התראות",
            
            # User Management
            cls.USERS_VIEW: "צפייה במשתמשים",
            cls.USERS_CREATE: "הוספת משתמשים",
            cls.USERS_PERMISSIONS: "ניהול הרשאות",
            
            # Mobile Features
            cls.MOBILE_JOB_STATUS: "עדכון סטטוס נסיעות",
            cls.MOBILE_UPLOAD_FILES: "העלאת קבצים",
            cls.MOBILE_SIGNATURE: "חתימה דיגיטלית",
        }
    
    @classmethod
    def get_default_permissions_for_role(cls, role: str) -> list:
        """Get default permissions for a role"""
        if role == "admin":
            # Admin gets almost all permissions
            return [
                cls.DASHBOARD_VIEW, cls.REPORTS_VIEW, cls.REPORTS_FINANCIAL,
                cls.JOBS_VIEW, cls.JOBS_CREATE, cls.JOBS_EDIT, cls.JOBS_ASSIGN, cls.JOBS_PRICING,
                cls.CUSTOMERS_VIEW, cls.CUSTOMERS_CREATE, cls.CUSTOMERS_EDIT,
                cls.SITES_VIEW, cls.SITES_CREATE,
                cls.FLEET_VIEW, cls.TRUCKS_CREATE, cls.TRUCKS_EDIT, cls.DRIVERS_VIEW, cls.DRIVERS_CREATE,
                cls.STATEMENTS_VIEW, cls.STATEMENTS_CREATE, cls.PAYMENTS_VIEW, cls.PAYMENTS_CREATE,
                cls.EXPENSES_VIEW, cls.EXPENSES_CREATE,
                cls.ALERTS_VIEW, cls.ALERTS_MANAGE,
                cls.USERS_VIEW, cls.USERS_CREATE, cls.USERS_PERMISSIONS,
            ]
        elif role == "dispatcher":
            return [
                cls.DASHBOARD_VIEW, cls.REPORTS_VIEW,
                cls.JOBS_VIEW, cls.JOBS_CREATE, cls.JOBS_EDIT, cls.JOBS_ASSIGN,
                cls.CUSTOMERS_VIEW, cls.SITES_VIEW,
                cls.FLEET_VIEW, cls.DRIVERS_VIEW,
                cls.ALERTS_VIEW,
            ]
        elif role == "accounting":
            return [
                cls.DASHBOARD_VIEW, cls.REPORTS_VIEW, cls.REPORTS_FINANCIAL,
                cls.JOBS_VIEW, cls.JOBS_PRICING,
                cls.CUSTOMERS_VIEW, cls.CUSTOMERS_EDIT,
                cls.STATEMENTS_VIEW, cls.STATEMENTS_CREATE,
                cls.PAYMENTS_VIEW, cls.PAYMENTS_CREATE,
                cls.EXPENSES_VIEW, cls.EXPENSES_CREATE,
            ]
        elif role == "driver":
            return [
                cls.MOBILE_JOB_STATUS, cls.MOBILE_UPLOAD_FILES, cls.MOBILE_SIGNATURE,
                cls.JOBS_VIEW,  # Only assigned jobs
            ]
        else:
            # Default minimal permissions
            return [cls.DASHBOARD_VIEW]
