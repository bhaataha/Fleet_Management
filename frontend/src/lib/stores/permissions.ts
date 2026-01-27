'use client'

import { create } from 'zustand'

interface Permission {
  permission_id: number
  permission_name: string
  permission_description: string
  granted: boolean
}

interface PermissionsStore {
  permissions: Permission[]
  isLoading: boolean
  isLoaded: boolean
  loadPermissions: (userId: number) => Promise<void>
  hasPermission: (permissionName: string) => boolean
  hasAnyPermission: (permissionNames: string[]) => boolean
  hasAllPermissions: (permissionNames: string[]) => boolean
  clearPermissions: () => void
}

export const usePermissions = create<PermissionsStore>()((set, get) => ({
  permissions: [],
  isLoading: false,
  isLoaded: false,

  loadPermissions: async (userId: number) => {
    console.log('🔐 Loading permissions for current user')
    set({ isLoading: true })
    try {
      // Use auth/my-permissions endpoint instead of admin endpoint
      // This allows non-admin users to load their own permissions
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'}/auth/my-permissions`, {
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('access_token') : ''}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to load permissions: ${response.statusText}`)
      }
      
      const permissions = await response.json()
      console.log('✅ Permissions loaded:', permissions.length, 'permissions')
      console.log('📋 Granted permissions:', permissions.filter((p: any) => p.granted).map((p: any) => p.permission_name))
      set({ permissions, isLoaded: true, isLoading: false })
    } catch (error) {
      console.error('❌ Failed to load permissions:', error)
      set({ permissions: [], isLoaded: true, isLoading: false })
    }
  },

  hasPermission: (permissionName: string) => {
    const state = get()
    const permission = state.permissions.find(p => p.permission_name === permissionName)
    return permission?.granted || false
  },

  hasAnyPermission: (permissionNames: string[]) => {
    const state = get()
    return permissionNames.some(name => state.hasPermission(name))
  },

  hasAllPermissions: (permissionNames: string[]) => {
    const state = get()
    return permissionNames.every(name => state.hasPermission(name))
  },

  clearPermissions: () => {
    set({ permissions: [], isLoaded: false })
  },
}))

// Permission constants for easy reference
export const Permissions = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  
  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_FINANCIAL: 'reports.financial',
  
  // Jobs
  JOBS_VIEW: 'jobs.view',
  JOBS_CREATE: 'jobs.create',
  JOBS_EDIT: 'jobs.edit',
  JOBS_DELETE: 'jobs.delete',
  JOBS_ASSIGN: 'jobs.assign',
  JOBS_CLOSE: 'jobs.close',
  
  // Customers
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_EDIT: 'customers.edit',
  
  // Sites
  SITES_VIEW: 'sites.view',
  SITES_CREATE: 'sites.create',
  
  // Fleet
  FLEET_VIEW: 'fleet.view',
  FLEET_CREATE: 'fleet.create',
  FLEET_EDIT: 'fleet.edit',
  FLEET_DRIVERS: 'fleet.drivers',
  FLEET_TRUCKS: 'fleet.trucks',
  
  // Billing
  BILLING_VIEW: 'billing.view',
  BILLING_CREATE: 'billing.create',
  BILLING_EDIT: 'billing.edit',
  BILLING_SEND: 'billing.send',
  
  // Pricing
  PRICING_VIEW: 'pricing.view',
  PRICING_EDIT: 'pricing.edit',
  
  // System
  SYSTEM_SETTINGS: 'system.settings',
  SYSTEM_USERS: 'system.users',
  SYSTEM_BACKUP: 'system.backup',
  SYSTEM_AUDIT: 'system.audit',
  
  // Payments
  PAYMENTS_VIEW: 'payments.view',
} as const
