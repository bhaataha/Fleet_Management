"""
Pydantic schemas for Subcontractors
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID


class SubcontractorBase(BaseModel):
    """Base subcontractor schema"""
    name: str = Field(..., min_length=1, max_length=200)
    company_name: Optional[str] = Field(None, max_length=200)
    vat_id: Optional[str] = Field(None, max_length=50)
    contact_person: Optional[str] = Field(None, max_length=200)
    phone: str = Field(..., min_length=9, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = None
    truck_plate_number: Optional[str] = Field(None, max_length=20, description="מספר משאית ייחודי לקבלן")
    payment_terms: Optional[str] = Field("monthly", max_length=100)
    payment_method: Optional[str] = Field(None, max_length=50)
    bank_details: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True


class SubcontractorCreate(SubcontractorBase):
    """Schema for creating a subcontractor"""
    pass


class SubcontractorUpdate(BaseModel):
    """Schema for updating a subcontractor"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    company_name: Optional[str] = Field(None, max_length=200)
    vat_id: Optional[str] = Field(None, max_length=50)
    contact_person: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, min_length=9, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = None
    truck_plate_number: Optional[str] = Field(None, max_length=20)
    payment_terms: Optional[str] = Field(None, max_length=100)
    payment_method: Optional[str] = Field(None, max_length=50)
    bank_details: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class SubcontractorResponse(SubcontractorBase):
    """Response schema for subcontractor"""
    id: int
    org_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: Optional[int]
    
    class Config:
        from_attributes = True


class SubcontractorDetailResponse(SubcontractorResponse):
    """Detailed subcontractor response with trucks and recent jobs"""
    trucks_count: int = 0
    jobs_completed_count: int = 0
    active_jobs_count: int = 0


# ============================================================================
# Price Lists
# ============================================================================

class SubcontractorPriceListBase(BaseModel):
    """Base price list schema"""
    truck_id: Optional[int] = None
    customer_id: Optional[int] = None
    material_id: Optional[int] = None
    from_site_id: Optional[int] = None
    to_site_id: Optional[int] = None
    price_per_trip: Optional[Decimal] = Field(None, ge=0)
    price_per_ton: Optional[Decimal] = Field(None, ge=0)
    price_per_m3: Optional[Decimal] = Field(None, ge=0)
    price_per_km: Optional[Decimal] = Field(None, ge=0)
    min_charge: Optional[Decimal] = Field(None, ge=0)
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    notes: Optional[str] = None
    is_active: bool = True
    
    @validator('valid_from', 'valid_to', pre=True)
    def parse_date_or_datetime(cls, v):
        """Accept both date strings (YYYY-MM-DD) and datetime strings"""
        if v is None:
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, str):
            # Try parsing as date first (YYYY-MM-DD)
            try:
                from datetime import date
                parsed_date = date.fromisoformat(v)
                # Convert to datetime at midnight
                return datetime.combine(parsed_date, datetime.min.time())
            except ValueError:
                # Try parsing as full datetime
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
        return v
    
    @validator('valid_to')
    def valid_to_after_valid_from(cls, v, values):
        if v and 'valid_from' in values and values['valid_from']:
            if v < values['valid_from']:
                raise ValueError('valid_to must be after valid_from')
        return v
    
    @validator('price_per_trip', 'price_per_ton', 'price_per_m3', 'price_per_km', pre=True)
    def convert_to_decimal(cls, v):
        if v is not None:
            return Decimal(str(v))
        return v


class SubcontractorPriceListCreate(SubcontractorPriceListBase):
    """Schema for creating a price list"""
    pass


class SubcontractorPriceListUpdate(BaseModel):
    """Schema for updating a price list"""
    truck_id: Optional[int] = None
    customer_id: Optional[int] = None
    material_id: Optional[int] = None
    from_site_id: Optional[int] = None
    to_site_id: Optional[int] = None
    price_per_trip: Optional[Decimal] = Field(None, ge=0)
    price_per_ton: Optional[Decimal] = Field(None, ge=0)
    price_per_m3: Optional[Decimal] = Field(None, ge=0)
    price_per_km: Optional[Decimal] = Field(None, ge=0)
    min_charge: Optional[Decimal] = Field(None, ge=0)
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None
    
    @validator('valid_from', 'valid_to', pre=True)
    def parse_date_or_datetime(cls, v):
        """Accept both date strings (YYYY-MM-DD) and datetime strings"""
        if v is None:
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, str):
            # Try parsing as date first (YYYY-MM-DD)
            try:
                from datetime import date
                parsed_date = date.fromisoformat(v)
                # Convert to datetime at midnight
                return datetime.combine(parsed_date, datetime.min.time())
            except ValueError:
                # Try parsing as full datetime
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
        return v
    
    @validator('price_per_trip', 'price_per_ton', 'price_per_m3', 'price_per_km', pre=True)
    def convert_to_decimal(cls, v):
        if v is not None:
            return Decimal(str(v))
        return v


class SubcontractorPriceListResponse(SubcontractorPriceListBase):
    """Response schema for price list"""
    id: int
    org_id: UUID
    subcontractor_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: Optional[int]
    
    class Config:
        from_attributes = True


# ============================================================================
# Pricing Preview & Calculation
# ============================================================================

class SubcontractorPricePreview(BaseModel):
    """Preview of subcontractor pricing calculation"""
    base_trip_price: float = Field(..., description="מחיר נסיעה בסיס")
    qty: float = Field(..., description="כמות")
    unit: str = Field(..., description="יחידת חיוב: TON/M3/TRIP/KM")
    price_per_unit: Optional[float] = Field(None, description="מחיר ליחידה")
    qty_price: float = Field(..., description="מחיר הכמות")
    min_charge: float = Field(0, description="מינימום חיוב")
    total: float = Field(..., description="סה\"כ לתשלום לקבלן")
    calculation: str = Field(..., description="הסבר החישוב בעברית")


class SubcontractorJobPricing(BaseModel):
    """Pricing info for job with subcontractor"""
    company_price: float = Field(..., description="מחיר ללקוח")
    subcontractor_price: float = Field(..., description="מחיר לקבלן")
    profit: float = Field(..., description="רווח גולמי")
    profit_margin_pct: float = Field(..., description="שולי רווח באחוזים")
    calculation_details: dict = Field(..., description="פירוט החישובים")


# ============================================================================
# Reports & Statistics
# ============================================================================

class SubcontractorJobSummary(BaseModel):
    """Summary of single job with subcontractor"""
    job_id: int
    job_date: datetime
    from_site: str
    to_site: str
    material: str
    quantity: float
    unit: str
    company_price: float
    subcontractor_price: float
    profit: float


class SubcontractorReport(BaseModel):
    """Subcontractor performance report"""
    subcontractor_id: int
    subcontractor_name: str
    period: dict
    statistics: dict
    financials: dict
    jobs: Optional[List[SubcontractorJobSummary]] = []


class SubcontractorPaymentSummary(BaseModel):
    """Payment summary for subcontractor"""
    subcontractor_id: int
    subcontractor_name: str
    total_amount_due: float
    total_amount_paid: float
    outstanding_balance: float
    period: dict
    details: List[dict] = []
