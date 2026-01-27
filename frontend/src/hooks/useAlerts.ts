'use client'

import { useState, useEffect, useCallback } from 'react'
import { alertsApi } from '@/lib/api'
import type { Alert, AlertListResponse } from '@/types/alert'

interface UseAlertsOptions {
  status?: string
  category?: string
  severity?: string
  limit?: number
  pollingInterval?: number // milliseconds, default 30000 (30 seconds)
  enabled?: boolean // enable/disable polling
}

export function useAlerts(options: UseAlertsOptions = {}) {
  const {
    status,
    category,
    severity,
    limit = 50,
    pollingInterval = 30000,
    enabled = true,
  } = options

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await alertsApi.list({
        status,
        category,
        severity,
        limit,
      })

      setAlerts(response.data.items)
      setTotal(response.data.total)
      setUnreadCount(response.data.unread)
      setError(null)
    } catch (err: any) {
      console.error('Failed to fetch alerts:', err)
      setError(err.response?.data?.detail || 'Failed to fetch alerts')
    } finally {
      setLoading(false)
    }
  }, [status, category, severity, limit])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await alertsApi.getUnreadCount()
      setUnreadCount(response.data.count)
    } catch (err) {
      console.error('Failed to fetch unread count:', err)
    }
  }, [])

  const markAsRead = useCallback(async (alertId: number) => {
    try {
      const response = await alertsApi.markAsRead(alertId)
      
      // Update local state
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? response.data : alert
        )
      )
      
      // Decrease unread count
      setUnreadCount((prev) => Math.max(0, prev - 1))
      
      return response.data
    } catch (err) {
      console.error('Failed to mark alert as read:', err)
      throw err
    }
  }, [])

  const dismiss = useCallback(async (alertId: number) => {
    try {
      const response = await alertsApi.dismiss(alertId)
      
      // Remove from local state
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
      setTotal((prev) => prev - 1)
      
      // Decrease unread count if it was unread
      const alert = alerts.find((a) => a.id === alertId)
      if (alert && !alert.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
      
      return response.data
    } catch (err) {
      console.error('Failed to dismiss alert:', err)
      throw err
    }
  }, [alerts])

  const resolve = useCallback(async (alertId: number) => {
    try {
      const response = await alertsApi.resolve(alertId)
      
      // Remove from local state
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
      setTotal((prev) => prev - 1)
      
      // Decrease unread count if it was unread
      const alert = alerts.find((a) => a.id === alertId)
      if (alert && !alert.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
      
      return response.data
    } catch (err) {
      console.error('Failed to resolve alert:', err)
      throw err
    }
  }, [alerts])

  const refresh = useCallback(() => {
    setLoading(true)
    fetchAlerts()
  }, [fetchAlerts])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchAlerts()
    }
  }, [fetchAlerts, enabled])

  // Polling for real-time updates
  useEffect(() => {
    if (!enabled || pollingInterval <= 0) return

    const interval = setInterval(() => {
      fetchAlerts()
    }, pollingInterval)

    return () => clearInterval(interval)
  }, [fetchAlerts, pollingInterval, enabled])

  return {
    alerts,
    total,
    unreadCount,
    loading,
    error,
    markAsRead,
    dismiss,
    resolve,
    refresh,
    fetchUnreadCount,
  }
}

/**
 * Hook for unread count only (lightweight, for badge)
 */
export function useUnreadCount(pollingInterval = 30000) {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchCount = useCallback(async () => {
    try {
      const response = await alertsApi.getUnreadCount()
      setCount(response.data.count)
    } catch (err) {
      console.error('Failed to fetch unread count:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  useEffect(() => {
    if (pollingInterval <= 0) return

    const interval = setInterval(fetchCount, pollingInterval)
    return () => clearInterval(interval)
  }, [fetchCount, pollingInterval])

  return { count, loading, refresh: fetchCount }
}
