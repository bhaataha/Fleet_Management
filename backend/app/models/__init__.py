from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, Enum, JSON, Date, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base
import enum
import uuid


class UserRole(str, enum.Enum):
    """User roles for RBAC"""
    ADMIN = "ADMIN"
    DISPATCHER = "DISPATCHER"
    ACCOUNTING = "ACCOUNTING"
    DRIVER = "DRIVER"


class JobStatus(str, enum.Enum):
    """Job/Trip status lifecycle"""
    PLANNED = "PLANNED"
    ASSIGNED = "ASSIGNED"
    ENROUTE_PICKUP = "ENROUTE_PICKUP"
    LOADED = "LOADED"
    ENROUTE_DROPOFF = "ENROUTE_DROPOFF"
    DELIVERED = "DELIVERED"
    CLOSED = "CLOSED"
    CANCELED = "CANCELED"


class BillingUnit(str, enum.Enum):
    """Units for material billing"""
    TON = "TON"
    M3 = "M3"
    TRIP = "TRIP"
    KM = "KM"


class StatementStatus(str, enum.Enum):
    """Statement/Invoice status"""
    DRAFT = "DRAFT"
    SENT = "SENT"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"


class Organization(Base):
    """Multi-tenant organization"""
    __tablename__ = "organizations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(200))
    
    # Contact
    contact_name = Column(String(200))
    contact_email = Column(String(255), unique=True, nullable=False, index=True)
    contact_phone = Column(String(20))
    vat_id = Column(String(50))
    
    # Address
    address = Column(Text)
    city = Column(String(100))
    postal_code = Column(String(20))
    country = Column(String(3), server_default='ISR')
    
    # Subscription
    plan_type = Column(String(50), nullable=False, server_default='trial')
    plan_start_date = Column(Date)
    plan_end_date = Column(Date)
    trial_ends_at = Column(DateTime(timezone=True))
    
    # Limits
    max_trucks = Column(Integer, server_default='5')
    max_drivers = Column(Integer, server_default='10')
    max_storage_gb = Column(Integer, server_default='10')
    features_json = Column(JSONB, server_default='{}')
    
    # Billing
    billing_cycle = Column(String(20), server_default='monthly')
    billing_email = Column(String(255))
    last_payment_date = Column(Date)
    next_billing_date = Column(Date)
    total_paid = Column(DECIMAL(10, 2), server_default='0')
    
    # Settings
    timezone = Column(String(50), server_default='Asia/Jerusalem')
    locale = Column(String(10), server_default='he')
    currency = Column(String(3), server_default='ILS')
    settings_json = Column(JSONB, server_default='{}')
    
    # Branding
    logo_url = Column(Text)
    primary_color = Column(String(7))
    custom_domain = Column(String(255))
    
    # Status
    status = Column(String(50), nullable=False, server_default='active', index=True)
    suspended_reason = Column(Text)
    
    # Stats
    total_trucks = Column(Integer, server_default='0')
    total_drivers = Column(Integer, server_default='0')
    total_jobs_completed = Column(Integer, server_default='0')
    storage_used_gb = Column(DECIMAL(10, 2), server_default='0')
    
    # Legacy
    is_active = Column(Boolean, server_default='true')
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    
    # Relationships
    users = relationship("User", back_populates="organization")
    customers = relationship("Customer", back_populates="organization")
    sites = relationship("Site", back_populates="organization")
    drivers = relationship("Driver", back_populates="organization")
    trucks = relationship("Truck", back_populates="organization")
    materials = relationship("Material", back_populates="organization")
    share_urls = relationship("ShareUrl", back_populates="organization")
    subcontractors = relationship("Subcontractor", back_populates="organization")


class User(Base):
    """System users"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20))
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_super_admin = Column(Boolean, server_default='false')
    org_role = Column(String(50), server_default='user')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    roles = relationship("UserRoleModel", back_populates="user")
    driver_profile = relationship("Driver", back_populates="user", uselist=False)


class UserRoleModel(Base):
    """User role assignments"""
    __tablename__ = "user_roles"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="roles")


class Customer(Base):
    """Customers/Clients"""
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    vat_id = Column(String(50))
    contact_name = Column(String(255))
    phone = Column(String(20))
    email = Column(String(255))
    address = Column(Text)
    payment_terms = Column(String(100))  # e.g., "Net 30", "Net 60"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization", back_populates="customers")
    sites = relationship("Site", back_populates="customer")
    jobs = relationship("Job", back_populates="customer")


class Site(Base):
    """Customer sites/projects"""
    __tablename__ = "sites"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)  # Nullable for general sites
    name = Column(String(255), nullable=False)
    address = Column(Text)
    lat = Column(Numeric(10, 7))
    lng = Column(Numeric(10, 7))
    opening_hours = Column(String(255))
    access_notes = Column(Text)  # הערות גישה/אישורים
    contact_name = Column(String(255))
    contact_phone = Column(String(50))
    site_type = Column(String(50), default="general")  # general, customer_project
    is_generic = Column(Boolean, default=False)  # אתר כללי (מחצבה, תחנת דלק, מזבלה) לא משויך ללקוח ספציפי
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization", back_populates="sites")
    customer = relationship("Customer", back_populates="sites")
    jobs_from = relationship("Job", foreign_keys="Job.from_site_id", back_populates="from_site")
    jobs_to = relationship("Job", foreign_keys="Job.to_site_id", back_populates="to_site")


class Material(Base):
    """Materials (עפר, חצץ, מצע, etc.)"""
    __tablename__ = "materials"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    name_hebrew = Column(String(255))
    billing_unit = Column(Enum(BillingUnit), nullable=False)
    density = Column(Numeric(5, 2))  # kg/m³ for ton<->m³ conversion
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    organization = relationship("Organization", back_populates="materials")
    jobs = relationship("Job", back_populates="material")


class VehicleType(Base):
    """Custom vehicle types per organization"""
    __tablename__ = "vehicle_types"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    name_hebrew = Column(String(100))
    description = Column(Text)
    code = Column(String(50), nullable=False)  # Internal code like FULL_TRAILER
    is_system_default = Column(Boolean, default=False)  # True for pre-defined types
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization")


class Truck(Base):
    """Fleet trucks"""
    __tablename__ = "trucks"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    plate_number = Column(String(20), nullable=False, unique=True)
    model = Column(String(100))
    truck_type = Column(String(50))  # פול טריילר/סמי/דאבל
    capacity_ton = Column(Numeric(5, 2))
    capacity_m3 = Column(Numeric(5, 2))
    insurance_expiry = Column(DateTime(timezone=True))
    test_expiry = Column(DateTime(timezone=True))  # טסט
    owner_type = Column(String(20), default='COMPANY')  # COMPANY or SUBCONTRACTOR
    subcontractor_id = Column(Integer, ForeignKey("subcontractors.id"))
    # NEW: Truck-Centric Assignment
    primary_driver_id = Column(Integer, ForeignKey("drivers.id"))  # נהג ראשי
    secondary_driver_ids = Column(JSONB, default=[])  # נהגים משניים (array of IDs)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization", back_populates="trucks")
    subcontractor = relationship("Subcontractor", back_populates="trucks")
    jobs = relationship("Job", back_populates="truck")
    primary_driver = relationship("Driver", foreign_keys=[primary_driver_id], back_populates="primary_trucks")


class Trailer(Base):
    """Fleet trailers"""
    __tablename__ = "trailers"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    plate_number = Column(String(20), nullable=False, unique=True)
    capacity_ton = Column(Numeric(5, 2))
    capacity_m3 = Column(Numeric(5, 2))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    jobs = relationship("Job", back_populates="trailer")


class Driver(Base):
    """Drivers"""
    __tablename__ = "drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20))
    license_type = Column(String(20))
    license_expiry = Column(DateTime(timezone=True))
    # REMOVED: default_truck_id - now trucks own drivers!
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization", back_populates="drivers")
    user = relationship("User", back_populates="driver_profile")
    primary_trucks = relationship("Truck", foreign_keys="Truck.primary_driver_id", back_populates="primary_driver")
    jobs = relationship("Job", back_populates="driver")


class PriceList(Base):
    """Price lists for customers"""
    __tablename__ = "price_lists"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))  # null = general price
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    from_site_id = Column(Integer, ForeignKey("sites.id"))
    to_site_id = Column(Integer, ForeignKey("sites.id"))
    unit = Column(Enum(BillingUnit), nullable=False)
    base_price = Column(Numeric(10, 2), nullable=False)
    min_charge = Column(Numeric(10, 2))
    trip_surcharge = Column(Numeric(10, 2))  # תוספת קבועה לנסיעה (למשל: 50 ש"ח נסיעה + מחיר טון)
    wait_fee_per_hour = Column(Numeric(10, 2))
    night_surcharge_pct = Column(Numeric(5, 2))
    valid_from = Column(DateTime(timezone=True), nullable=False)
    valid_to = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Job(Base):
    """Jobs/Trips (נסיעות)"""
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    from_site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    to_site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    
    scheduled_date = Column(DateTime(timezone=True), nullable=False, index=True)
    priority = Column(Integer, default=0)
    
    driver_id = Column(Integer, ForeignKey("drivers.id"))
    truck_id = Column(Integer, ForeignKey("trucks.id"))
    trailer_id = Column(Integer, ForeignKey("trailers.id"))
    
    planned_qty = Column(Numeric(10, 2), nullable=False)
    actual_qty = Column(Numeric(10, 2))
    unit = Column(Enum(BillingUnit), nullable=False)
    
    status = Column(Enum(JobStatus), default=JobStatus.PLANNED, index=True)
    
    # Pricing
    pricing_total = Column(Numeric(10, 2))
    pricing_breakdown_json = Column(JSON)
    manual_override_total = Column(Numeric(10, 2))
    manual_override_reason = Column(Text)
    # Subcontractor support
    is_subcontractor = Column(Boolean, default=False)
    subcontractor_id = Column(Integer, ForeignKey("subcontractors.id"))
    subcontractor_price_total = Column(Numeric(10, 2))
    subcontractor_price_breakdown_json = Column(JSON)
    subcontractor_billing_unit = Column(String(10))  # TON, M3, TRIP, KM - how to bill subcontractor
    
    notes = Column(Text)
    is_billable = Column(Boolean, default=False)
    
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    customer = relationship("Customer", back_populates="jobs")
    from_site = relationship("Site", foreign_keys=[from_site_id])
    to_site = relationship("Site", foreign_keys=[to_site_id])
    material = relationship("Material", back_populates="jobs")
    driver = relationship("Driver", back_populates="jobs")
    truck = relationship("Truck", back_populates="jobs")
    trailer = relationship("Trailer", back_populates="jobs")
    subcontractor = relationship("Subcontractor", back_populates="jobs")
    status_events = relationship("JobStatusEvent", back_populates="job")
    delivery_note = relationship("DeliveryNote", back_populates="job", uselist=False)
    files = relationship("JobFile", back_populates="job")
    share_urls = relationship("ShareUrl", back_populates="job")


class JobStatusEvent(Base):
    """Job status change audit trail"""
    __tablename__ = "job_status_events"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    status = Column(Enum(JobStatus), nullable=False)
    event_time = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))
    lat = Column(Numeric(10, 7))
    lng = Column(Numeric(10, 7))
    note = Column(Text)
    
    # Relationships
    job = relationship("Job", back_populates="status_events")


class DeliveryNote(Base):
    """Delivery notes with signature"""
    __tablename__ = "delivery_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False, unique=True)
    note_number = Column(String(50))
    receiver_name = Column(String(255), nullable=False)
    receiver_signature_file_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    delivered_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text)
    
    # Relationships
    job = relationship("Job", back_populates="delivery_note")
    signature_file = relationship("File")


class WeighTicket(Base):
    """Weigh tickets (תעודות שקילה)"""
    __tablename__ = "weigh_tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    ticket_number = Column(String(50))
    gross_weight = Column(Numeric(10, 2))
    tare_weight = Column(Numeric(10, 2))
    net_weight = Column(Numeric(10, 2))
    file_id = Column(Integer, ForeignKey("files.id"))
    issued_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class File(Base):
    """File storage metadata"""
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    storage_key = Column(String(500), nullable=False)  # S3 key
    filename = Column(String(255), nullable=False)
    mime_type = Column(String(100))
    size = Column(Integer)  # bytes
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())


class JobFile(Base):
    """Job file associations"""
    __tablename__ = "job_files"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    file_type = Column(String(50))  # PHOTO, WEIGH_TICKET, DELIVERY_NOTE, OTHER
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    job = relationship("Job", back_populates="files")
    file = relationship("File")


class Statement(Base):
    """Customer statements/invoices"""
    __tablename__ = "statements"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    number = Column(String(50), unique=True, nullable=False)
    period_from = Column(DateTime(timezone=True), nullable=False)
    period_to = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(StatementStatus), default=StatementStatus.DRAFT)
    subtotal = Column(Numeric(10, 2))
    tax = Column(Numeric(10, 2))
    total = Column(Numeric(10, 2), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    lines = relationship("StatementLine", back_populates="statement")


class StatementLine(Base):
    """Statement line items"""
    __tablename__ = "statement_lines"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    statement_id = Column(Integer, ForeignKey("statements.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    description = Column(Text)
    qty = Column(Numeric(10, 2))
    unit_price = Column(Numeric(10, 2))
    total = Column(Numeric(10, 2), nullable=False)
    breakdown_json = Column(JSON)
    
    # Relationships
    statement = relationship("Statement", back_populates="lines")


class Payment(Base):
    """Customer payments"""
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    paid_at = Column(DateTime(timezone=True), nullable=False)
    method = Column(String(50))  # העברה/צ'ק/אשראי
    reference = Column(String(100))  # אסמכתא
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    allocations = relationship("PaymentAllocation", back_populates="payment")


class PaymentAllocation(Base):
    """Payment allocation to statements"""
    __tablename__ = "payment_allocations"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False)
    statement_id = Column(Integer, ForeignKey("statements.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    
    # Relationships
    payment = relationship("Payment", back_populates="allocations")


class Expense(Base):
    """Expenses (דלק, תיקונים, etc.)"""
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    category = Column(String(100), nullable=False)  # דלק/טיפולים/צמיגים/אגרות/שכר
    amount = Column(Numeric(10, 2), nullable=False)
    expense_date = Column(DateTime(timezone=True), nullable=False)
    vendor_name = Column(String(255))
    truck_id = Column(Integer, ForeignKey("trucks.id"))
    driver_id = Column(Integer, ForeignKey("drivers.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    file_id = Column(Integer, ForeignKey("files.id"))
    note = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    """Audit trail for all changes"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE
    before_json = Column(JSON)
    after_json = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ShareUrl(Base):
    """Short URLs for PDF sharing (like bit.ly for job PDFs)"""
    __tablename__ = "share_urls"
    
    id = Column(Integer, primary_key=True, index=True)
    short_id = Column(String(8), unique=True, nullable=False, index=True)  # e.g., "abc123xy"
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))  # Optional expiration
    is_active = Column(Boolean, default=True)
    
    # Relationships
    job = relationship("Job", back_populates="share_urls")
    organization = relationship("Organization", back_populates="share_urls")


class Subcontractor(Base):
    """Subcontractors - external hauling service providers"""
    __tablename__ = "subcontractors"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    
    # פרטי קבלן
    name = Column(String(200), nullable=False)
    company_name = Column(String(200))
    vat_id = Column(String(50))
    contact_person = Column(String(200))
    phone = Column(String(20), nullable=False)
    email = Column(String(255))
    address = Column(Text)
    truck_plate_number = Column(String(20), index=True)  # מספר משאית ייחודי לקבלן - לדוחות
    
    # תנאי תשלום
    payment_terms = Column(String(100), default='monthly')
    payment_method = Column(String(50))
    bank_details = Column(Text)
    
    # מטא
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    organization = relationship("Organization", back_populates="subcontractors")
    trucks = relationship("Truck", back_populates="subcontractor")
    jobs = relationship("Job", back_populates="subcontractor")
    price_lists = relationship("SubcontractorPriceList", back_populates="subcontractor")


class SubcontractorPriceList(Base):
    """Price lists for subcontractors"""
    __tablename__ = "subcontractor_price_lists"
    
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True)
    subcontractor_id = Column(Integer, ForeignKey("subcontractors.id"), nullable=False)
    truck_id = Column(Integer, ForeignKey("trucks.id"))
    
    # הגדרת מסלול/חומר (אופציונלי)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    material_id = Column(Integer, ForeignKey("materials.id"))
    from_site_id = Column(Integer, ForeignKey("sites.id"))
    to_site_id = Column(Integer, ForeignKey("sites.id"))
    
    # מחירים
    price_per_trip = Column(Numeric(10, 2))
    price_per_ton = Column(Numeric(10, 2))
    price_per_m3 = Column(Numeric(10, 2))
    price_per_km = Column(Numeric(10, 2))
    
    # מינימום
    min_charge = Column(Numeric(10, 2))
    
    # תוקף
    valid_from = Column(DateTime(timezone=True))
    valid_to = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    
    # מטא
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    subcontractor = relationship("Subcontractor", back_populates="price_lists")
    material = relationship("Material", foreign_keys=[material_id])
