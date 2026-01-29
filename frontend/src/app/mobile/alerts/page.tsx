'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { alertsApi } from '@/lib/api'
import { usePullToRefresh } from '@/lib/hooks/usePullToRefresh'
import { AlertCircle, CheckCircle2, Clock, RefreshCw, X, Check } from 'lucide-react'

type AlertItem = {
  id: number
  title: string
  message: string
  created_at: string
  status: string
  severity?: string
  category?: string
}

export default function MobileAlertsPage() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) {
          router.replace('/login')
          return
        }
        const res = await alertsApi.list({ limit: 50 })
        setAlerts(res.data?.items || [])
      } catch (error) {
        console.error('Failed to load alerts:', error)
        setError('שגיאה בטעינת התראות')
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()
  }, [router])

  const handleRefresh = useCallback(async () => {
    if (refreshing) return
    
    setRefreshing(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }
      const res = await alertsApi.list({ limit: 50 })
      setAlerts(res.data?.items || [])
      setError(null)
    } catch (error) {
      console.error('Failed to refresh alerts:', error)
      setError('שגיאה בטעינת התראות')
    } finally {
      setRefreshing(false)
    }
  }, [refreshing, router])

  const handleMarkAsRead = async (alertId: number) => {
    try {
      const res = await alertsApi.markAsRead(alertId)
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? res.data : a)))
    } catch (err) {
      console.error('Failed to mark alert as read:', err)
    }
  }

  const handleDismiss = async (alertId: number) => {
    try {
      await alertsApi.dismiss(alertId)
      setAlerts((prev) => prev.filter((a) => a.id !== alertId))
    } catch (err) {
      console.error('Failed to dismiss alert:', err)
    }
  }

  const {
    containerRef,
    isRefreshing,
    refreshIndicatorStyle,
    containerStyle,
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    resistance: 2.5
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div ref={containerRef} style={containerStyle} className="space-y-4">
      {/* Pull-to-refresh indicator */}
      {isRefreshing && (
        <div style={refreshIndicatorStyle} className="flex items-center justify-center py-4">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-blue-600">מרענן התראות...</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">התראות</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-50"
        >
          {refreshing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
        </button>
      </div>

      {alerts.map((alert) => (
        <div key={alert.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {alert.status === 'UNREAD' ? (
                <AlertCircle className="w-5 h-5 text-orange-500" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-gray-900 text-sm">{alert.title}</div>
                <div className="flex items-center gap-1">
                  {alert.status === 'UNREAD' && (
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
                      title="סמן כנקראה"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
                    title="הסר"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {alert.message && (
                <div className="text-sm text-gray-700 mt-1 whitespace-pre-line">{alert.message}</div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                <Clock className="w-4 h-4" />
                <span>{new Date(alert.created_at).toLocaleString('he-IL')}</span>
                {alert.status && (
                  <span
                    className={
                      alert.status === 'UNREAD'
                        ? 'text-orange-600 font-semibold'
                        : 'text-green-600 font-semibold'
                    }
                  >
                    {alert.status === 'UNREAD' ? 'לא נקראה' : 'נקראה'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {alerts.length === 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center text-gray-500">
          {error || 'אין התראות חדשות'}
        </div>
      )}
    </div>
  )
}
