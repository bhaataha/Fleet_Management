'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Phone, Mail, Truck, LogOut, Settings, Bell, RefreshCw } from 'lucide-react'
import { authApi, jobsApi, driversApi } from '@/lib/api'
import type { Driver, Job } from '@/types'

export default function MobileProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id?: number; name?: string; phone?: string; email?: string; driver_id?: number } | null>(null)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [tripsToday, setTripsToday] = useState(0)
  const [tripsMonth, setTripsMonth] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }

      try {
        // Always fetch fresh user data from server
        const res = await authApi.me()
        const me = res.data
        
        // Clear old cache and save fresh data
        localStorage.removeItem('user')
        localStorage.setItem('user', JSON.stringify(me))
        
        console.log('[Profile] Fresh user from /auth/me:', me)
        
        if (!me.driver_id) {
          setError('חשבון זה אינו משויך לנהג')
          setLoading(false)
          return
        }
        
        setUser(me)
        
        // Load driver details immediately
        try {
          const [driverRes, jobsRes] = await Promise.all([
            driversApi.get(me.driver_id),
            jobsApi.list({ driver_id: me.driver_id, limit: 500 }),
          ])
          
          console.log('[Profile] Driver data:', driverRes.data)
          setDriver(driverRes.data)

          const jobs = jobsRes.data as Job[]
          const today = getLocalDateString()
          const monthKey = today.slice(0, 7)
          setTripsToday(jobs.filter(j => j.scheduled_date?.startsWith(today)).length)
          setTripsMonth(jobs.filter(j => j.scheduled_date?.startsWith(monthKey)).length)
        } catch (error) {
          console.error('[Profile] Failed to load driver details:', error)
          setError('שגיאה בטעינת פרטי הנהג')
        } finally {
          setLoading(false)
        }
        
      } catch (err) {
        console.error('[Profile] Failed to refresh user from /auth/me:', err)
        router.replace('/login')
      }
    }

    bootstrap()
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
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.name || 'נהג'}</h2>
            <p className="text-blue-100">{driver?.name ? 'נהג פעיל' : 'לא נמצא פרופיל נהג'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <div className="text-3xl font-bold">{tripsToday}</div>
            <div className="text-sm text-blue-100">נסיעות היום</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <div className="text-3xl font-bold">{tripsMonth}</div>
            <div className="text-sm text-blue-100">החודש</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
          {error}
        </div>
      )}

      {/* Contact Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-200">
        <div className="p-4 flex items-center gap-3">
          <Phone className="w-5 h-5 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">טלפון</div>
            <div className="font-medium text-gray-900">{driver?.phone || user?.phone || '-'}</div>
          </div>
        </div>
        <div className="p-4 flex items-center gap-3">
          <Mail className="w-5 h-5 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">דואר אלקטרוני</div>
            <div className="font-medium text-gray-900">{user?.email || '-'}</div>
          </div>
        </div>
        <div className="p-4 flex items-center gap-3">
          <Truck className="w-5 h-5 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">משאית</div>
            <div className="font-medium text-gray-900">יוקצה בהמשך</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900">הגדרות מהירות</h3>

        <button className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center justify-between active:scale-98 transition-transform">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-900">התראות</span>
          </div>
          <div className="text-sm text-gray-500">פעיל</div>
        </button>

        <button className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center justify-between active:scale-98 transition-transform">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-900">הגדרות אפליקציה</span>
          </div>
        </button>

        <button
          onClick={async () => {
            if ('serviceWorker' in navigator) {
              const regs = await navigator.serviceWorker.getRegistrations()
              await Promise.all(regs.map(r => r.unregister()))
            }
            if ('caches' in window) {
              const keys = await caches.keys()
              await Promise.all(keys.map(k => caches.delete(k)))
            }
            localStorage.clear()
            sessionStorage.clear()
            window.location.href = '/login'
          }}
          className="w-full bg-yellow-50 rounded-xl p-4 border border-yellow-200 flex items-center justify-between active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-yellow-700" />
            <span className="font-medium text-yellow-700">איפוס אפליקציה (ניקוי קאש)</span>
          </div>
        </button>

        <button
          onClick={() => {
            localStorage.removeItem('access_token')
            localStorage.removeItem('user')
            window.location.href = '/login'
          }}
          className="w-full bg-red-50 rounded-xl p-4 border border-red-200 flex items-center justify-between active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-600">התנתק</span>
          </div>
        </button>
      </div>

      {/* App Info */}
      <div className="text-center text-sm text-gray-500 pt-4">
        <p>TruckFlow גרסה 2.0.0</p>
        <p className="mt-1">© 2026 כל הזכויות שמורות</p>
      </div>
    </div>
  )
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
