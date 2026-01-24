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

export interface User {
  id: number
  name: string
  email: string
  org_id: number
  roles: UserRole[]
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
  customer_id: number
  name: string
  address?: string
  lat?: number
  lng?: number
  opening_hours?: string
  access_notes?: string
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
  is_active: boolean
  created_at: string
}

export interface Truck {
  id: number
  org_id: number
  plate_number: string
  model?: string
  truck_type?: string
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
  planned_qty: number
  actual_qty?: number
  unit: BillingUnit
  status: JobStatus
  pricing_total?: number
  is_billable: boolean
  notes?: string
  created_at: string
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
  notes?: string
}

export interface JobUpdate {
  driver_id?: number
  truck_id?: number
  trailer_id?: number
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
