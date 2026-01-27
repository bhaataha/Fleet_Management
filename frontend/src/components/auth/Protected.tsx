'use client'

import { useAuth } from '@/lib/stores/auth'
import { usePermissions } from '@/lib/stores/permissions'
import { ReactNode } from 'react'

interface ProtectedProps {
  children: ReactNode
  permission?: string
  anyPermission?: string[]
  allPermissions?: string[]
  fallback?: ReactNode
}

/**
 * Component to conditionally render children based on permissions
 * 
 * Usage:
 * <Protected permission="customers.view">
 *   <CustomersList />
 * </Protected>
 * 
 * <Protected anyPermission={["jobs.create", "jobs.edit"]}>
 *   <CreateJobButton />
 * </Protected>
 */
export function Protected({ 
  children, 
  permission, 
  anyPermission, 
  allPermissions,
  fallback = null 
}: ProtectedProps) {
  const { user } = useAuth()
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  // Super admins and system admins (owner/admin role) have all permissions
  if (user?.is_super_admin || user?.org_role === 'admin' || user?.org_role === 'owner') {
    return <>{children}</>
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  // Check any of permissions
  if (anyPermission && !hasAnyPermission(anyPermission)) {
    return <>{fallback}</>
  }

  // Check all permissions
  if (allPermissions && !hasAllPermissions(allPermissions)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Hook to check permissions programmatically
 * 
 * Usage:
 * const canEdit = useHasPermission('customers.edit')
 * if (canEdit) { ... }
 */
export function useHasPermission(permission: string): boolean {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  
  if (user?.is_super_admin || user?.org_role === 'admin' || user?.org_role === 'owner') return true
  return hasPermission(permission)
}

/**
 * Hook to check any of permissions
 */
export function useHasAnyPermission(permissions: string[]): boolean {
  const { user } = useAuth()
  const { hasAnyPermission } = usePermissions()
  
  if (user?.is_super_admin || user?.org_role === 'admin' || user?.org_role === 'owner') return true
  return hasAnyPermission(permissions)
}

/**
 * Hook to check all permissions
 */
export function useHasAllPermissions(permissions: string[]): boolean {
  const { user } = useAuth()
  const { hasAllPermissions } = usePermissions()
  
  if (user?.is_super_admin || user?.org_role === 'admin' || user?.org_role === 'owner') return true
  return hasAllPermissions(permissions)
}
