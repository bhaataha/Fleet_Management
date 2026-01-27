/**
 * Alert Types
 */

export type AlertType =
  | 'JOB_NOT_ASSIGNED'
  | 'JOB_NOT_STARTED'
  | 'JOB_DELAYED'
  | 'JOB_MISSING_DOCS'
  | 'JOB_STUCK'
  | 'INSURANCE_EXPIRY'
  | 'TEST_EXPIRY'
  | 'LICENSE_EXPIRY'
  | 'INVOICE_OVERDUE'
  | 'DEBT_30_DAYS'
  | 'HIGH_EXPENSE'
  | 'SUBCONTRACTOR_UNBILLED'
  | 'TRIAL_ENDING'
  | 'TRUCK_LIMIT'
  | 'DRIVER_LIMIT'
  | 'STORAGE_LIMIT'
  | 'JOB_ASSIGNED_TO_DRIVER'
  | 'JOB_STATUS_CHANGED'
  | 'JOB_COMPLETED'
  | 'STATEMENT_CREATED'
  | 'SYSTEM_UPDATE'

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'SUCCESS'

export type AlertCategory = 'OPERATIONAL' | 'MAINTENANCE' | 'FINANCIAL' | 'SYSTEM' | 'REALTIME'

export type AlertStatus = 'UNREAD' | 'READ' | 'DISMISSED' | 'RESOLVED'

export interface Alert {
  id: number
  org_id: string
  alert_type: AlertType
  severity: AlertSeverity
  category: AlertCategory
  title: string
  message: string
  action_url?: string
  entity_type?: string
  entity_id?: number
  status: AlertStatus
  read_at?: string
  dismissed_at?: string
  resolved_at?: string
  resolved_by?: number
  created_for_user_id?: number
  created_for_role?: string
  created_at: string
  expires_at?: string
  alert_metadata?: Record<string, any>
  is_read: boolean
  is_active: boolean
  is_expired: boolean
}

export interface AlertListResponse {
  total: number
  unread: number
  items: Alert[]
}

export interface UnreadCountResponse {
  count: number
}

export interface AlertStatsResponse {
  total: number
  unread: number
  by_severity: Record<string, number>
  by_category: Record<string, number>
}
