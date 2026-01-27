// TypeScript types matching backend models

export type UserRole = 'ADMIN' | 'DISPATCHER' | 'ACCOUNTING' | 'DRIVER'

export type JobStatus = 
  | 'PLANNED' 
  | 'ASSIGNED' 
  | 'ENROUTE_PICKUP' 
  | 'LOADED' 
  | 'ENROUTE_DROPOFF' 
  | 'DELIVERED' 
  | 'CLOSED' 
  | 'CANCELED'

export type BillingUnit = 'TON' | 'M3' | 'TRIP' | 'KM'

export type StatementStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID'

export interface PriceList {
  id: number
  org_id?: number
  customer_id?: number
  material_id: number
  from_site_id?: number
  to_site_id?: number
  unit: BillingUnit
  base_price: number
  min_charge?: number
  trip_surcharge?: number
  wait_fee_per_hour?: number
  night_surcharge_pct?: number
  valid_from: string
  valid_to?: string
  created_at?: string
  updated_at?: string
}

export interface PriceListCreate {
  customer_id?: number
  material_id: number
  from_site_id?: number
  to_site_id?: number
  unit: BillingUnit
  base_price: number
  min_charge?: number
  trip_surcharge?: number
  wait_fee_per_hour?: number
  night_surcharge_pct?: number
  valid_from: string
  valid_to?: string
}

export interface User {
  id: number
  name: string
  email: string
  org_id: number
  roles: UserRole[]
  is_super_admin?: boolean
  org_role?: string
}

export interface Customer {
  id: number
  org_id: number
  name: string
  vat_id?: string
  contact_name?: string
  phone?: string
  email?: string
  address?: string
  payment_terms?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Site {
  id: number
  org_id: number
  customer_id: number | null
  name: string
  address?: string
  lat?: number
  lng?: number
  opening_hours?: string
  access_notes?: string
  contact_name?: string
  contact_phone?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Material {
  id: number
  org_id: number
  name: string
  name_hebrew?: string
  billing_unit: BillingUnit
  description?: string
  is_active: boolean
  created_at: string
}

export interface Truck {
  id: number
  org_id: number
  plate_number: string
  model?: string
  truck_type?: string
  type?: string
  capacity_ton?: number
  capacity_m3?: number
  insurance_expiry?: string
  test_expiry?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Driver {
  id: number
  org_id: number
  user_id: number
  name: string
  phone?: string
  license_type?: string
  license_expiry?: string
  is_active: boolean
  created_at: string
}

export interface Job {
  id: number
  org_id: number
  customer_id: number
  from_site_id: number
  to_site_id: number
  material_id: number
  scheduled_date: string
  priority: number
  driver_id?: number
  truck_id?: number
  trailer_id?: number
  subcontractor_id?: number
  is_subcontractor?: boolean
  subcontractor_billing_unit?: string  // TON, M3, TRIP, KM
  planned_qty: number
  actual_qty?: number
  unit: BillingUnit
  status: JobStatus
  pricing_total?: number
  pricing_breakdown_json?: any
  manual_override_total?: number
  manual_override_reason?: string
  subcontractor_price_total?: number
  subcontractor_price_breakdown_json?: any
  is_billable: boolean
  notes?: string
  created_by?: number
  created_at: string
  updated_at?: string
}

export interface JobCreate {
  customer_id: number
  from_site_id: number
  to_site_id: number
  material_id: number
  scheduled_date: string
  planned_qty: number
  unit: BillingUnit
  priority?: number
  driver_id?: number
  truck_id?: number
  trailer_id?: number
  subcontractor_id?: number
  is_subcontractor?: boolean
  subcontractor_billing_unit?: string  // TON, M3, TRIP, KM
  notes?: string
}

export interface JobUpdate {
  customer_id?: number
  from_site_id?: number
  to_site_id?: number
  material_id?: number
  scheduled_date?: string
  planned_qty?: string
  unit?: BillingUnit
  driver_id?: number | null
  truck_id?: number | null
  trailer_id?: number | null
  subcontractor_id?: number | null
  is_subcontractor?: boolean
  subcontractor_billing_unit?: string | null  // TON, M3, TRIP, KM
  status?: JobStatus
  actual_qty?: number
  notes?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface Expense {
  id: number
  org_id: string
  category: string  // דלק, תיקונים, צמיגים, ביטוח, רישוי, שכר, אחר
  amount: number
  expense_date: string
  vendor_name?: string
  truck_id?: number
  driver_id?: number
  job_id?: number
  note?: string
  created_by?: number
  created_at: string
  // Nested relations
  truck?: {
    id: number
    plate_number: string
  }
  driver?: {
    id: number
    name: string
  }
}

export interface ExpenseCreate {
  category: string
  amount: number
  expense_date: string
  vendor_name?: string
  truck_id?: number
  driver_id?: number
  job_id?: number
  note?: string
}

export interface ExpenseUpdate {
  category?: string
  amount?: number
  expense_date?: string
  vendor_name?: string
  truck_id?: number
  driver_id?: number
  job_id?: number
  note?: string
}

