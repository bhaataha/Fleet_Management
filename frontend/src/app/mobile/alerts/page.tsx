'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { alertsApi } from '@/lib/api'
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'

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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) {
          router.replace('/login')
          return
        }
        const res = await alertsApi.list({ status: 'UNREAD', limit: 50 })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">התראות</h1>

      {alerts.map(alert => (
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
              <div className="font-semibold text-gray-900 text-sm">{alert.title}</div>
              <div className="text-sm text-gray-600 mt-1">{alert.message}</div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                <Clock className="w-3 h-3" />
                {new Date(alert.created_at).toLocaleString('he-IL')}
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
