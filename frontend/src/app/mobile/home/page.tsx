'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Truck, MapPin, Clock, AlertCircle, ChevronLeft, Download, RefreshCw } from 'lucide-react'
import { authApi, driversApi, jobsApi } from '@/lib/api'
import { jobStatusLabels, jobStatusColors, billingUnitLabels, formatDate } from '@/lib/utils'
import { usePWA } from '@/lib/hooks/usePWA'
import { usePullToRefresh } from '@/lib/hooks/usePullToRefresh'
import type { Job } from '@/types'

type MobileJob = Job & {
  customer?: { name?: string }
  from_site?: { name?: string }
  to_site?: { name?: string }
  material?: { name?: string }
}

export default function MobileHomePage() {
  const router = useRouter()
  const { isInstallable, isInstalled, promptInstall } = usePWA()
  const [jobs, setJobs] = useState<MobileJob[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('נהג')
  const [driverId, setDriverId] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        console.log('[Home] No token, redirecting to login')
        router.replace('/login')
        return
      }

      try {
        // Always fetch fresh user data from server
        console.log('[Home] Fetching fresh user from /auth/me...')
        const me = await authApi.me()
        const user = me.data
        
        console.log('[Home] Fresh user from /auth/me:', {
          id: user.id,
          name: user.name,
          driver_id: user.driver_id,
          org_role: user.org_role,
          roles: user.roles
        })
        
        // Update local storage with fresh data
        localStorage.setItem('user', JSON.stringify(user))
        
        setUserName(user.name || 'נהג')
        
        // If user has driver_id, use it immediately
        if (user.driver_id) {
          console.log('[Home] User has driver_id:', user.driver_id)
          setDriverId(user.driver_id)
        } else {
          // Try to find driver by user_id
          console.log('[Home] No driver_id, searching via /drivers API...')
          try {
            const driversRes = await driversApi.list({ limit: 500 })
            const match = (driversRes.data || []).find((d: any) => d.user_id === user.id)
            
            if (match?.id) {
              console.log('[Home] Found driver via search:', match.id)
              setDriverId(match.id)
              // Update user object with driver_id
              const updatedUser = { ...user, driver_id: match.id }
              localStorage.setItem('user', JSON.stringify(updatedUser))
            } else {
              console.error('[Home] ❌ No driver profile found for user_id:', user.id)
              setDriverId(null)
            }
          } catch (driverError) {
            console.error('[Home] Failed to search for driver:', driverError)
            setDriverId(null)
          }
        }
      } catch (error) {
        console.error('[Home] Failed to refresh user from /auth/me:', error)
        router.replace('/login')
      }
    }

    bootstrap()
  }, [router])

  useEffect(() => {
    const load = async () => {
      if (driverId === null) {
        console.log('[Home] No driver_id yet, skipping jobs load')
        setLoading(false)
        return
      }
      
      console.log('[Home] Loading jobs for driver_id:', driverId)
      
      try {
        const today = getLocalDateString()
        console.log('[Home] Today date:', today)
        
        // Load jobs for this driver filtered by date
        const res = await jobsApi.list({
          from_date: today,
          to_date: today,
          driver_id: driverId,
          limit: 500
        })
        
        const result = res.data || []
        console.log('[Home] Loaded jobs:', result.length, result)
        
        if (result.length === 0) {
          console.log('[Home] No jobs for today, checking all jobs for this driver...')
          // Fallback: load all jobs and filter locally
          const fallback = await jobsApi.list({ driver_id: driverId, limit: 500 })
          const allJobs = fallback.data || []
          console.log('[Home] Total jobs for driver:', allJobs.length)
          
          const filtered = allJobs.filter((job: any) => isSameLocalDate(job.scheduled_date, today))
          console.log('[Home] Filtered jobs for today:', filtered.length)
          setJobs(filtered)
        } else {
          setJobs(result)
        }
      } catch (error) {
        console.error('[Home] Failed to load driver jobs:', error)
        setJobs([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [driverId])

  // Refresh function for pull-to-refresh
  const handleRefresh = useCallback(async () => {
    if (driverId === null || refreshing) return
    
    console.log('[Home] Pull-to-refresh triggered')
    setRefreshing(true)
    
    try {
      const today = getLocalDateString()
      console.log('[Home] Refreshing jobs for date:', today)
      
      // Load fresh jobs
      const res = await jobsApi.list({
        from_date: today,
        to_date: today,
        driver_id: driverId,
        limit: 500
      })
      
      const result = res.data || []
      console.log('[Home] Refreshed jobs:', result.length)
      
      if (result.length === 0) {
        // Fallback: load all jobs and filter locally
        const fallback = await jobsApi.list({ driver_id: driverId, limit: 500 })
        const allJobs = fallback.data || []
        const filtered = allJobs.filter((job: any) => isSameLocalDate(job.scheduled_date, today))
        setJobs(filtered)
      } else {
        setJobs(result)
      }
      
      console.log('[Home] ✅ Refresh completed successfully')
    } catch (error) {
      console.error('[Home] ❌ Refresh failed:', error)
    } finally {
      setRefreshing(false)
    }
  }, [driverId, refreshing])

  // Pull-to-refresh hook
  const {
    containerRef,
    isRefreshing: isPullRefreshing,
    shouldShowIndicator,
    refreshIndicatorStyle,
    containerStyle
  } = usePullToRefresh({ onRefresh: handleRefresh })

  // Remove the old useEffect that tried to resolve driver - it's now handled in bootstrap
  // useEffect(() => { ... }, [driverId])

  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

  const counts = useMemo(() => {
    const active = jobs.filter(j => ['ASSIGNED', 'ENROUTE_PICKUP', 'LOADED', 'ENROUTE_DROPOFF'].includes(j.status)).length
    const completed = jobs.filter(j => j.status === 'DELIVERED' || j.status === 'CLOSED').length
    return { active, completed }
  }, [jobs])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Pull-to-refresh indicator */}
      {shouldShowIndicator && (
        <div 
          className="absolute top-0 left-0 right-0 flex justify-center items-center h-16 z-10"
          style={refreshIndicatorStyle}
        >
          <div className="bg-white rounded-full p-3 shadow-lg border">
            <RefreshCw 
              className={`w-5 h-5 text-blue-600 ${(isPullRefreshing || refreshing) ? 'animate-spin' : ''}`} 
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="space-y-4" style={containerStyle}>
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">שלום, {userName}! 👋</h2>
        <p className="text-blue-100">יש לך {jobs.length} משימות להיום</p>

        {!isInstalled && (isInstallable || isIOS) && (
          <div className="mt-4 bg-white/15 rounded-xl p-3 text-sm flex items-center justify-between">
            <span>
              {isInstallable ? 'התקן את האפליקציה לגישה מהירה' : 'ב‑iPhone: שתף → הוסף למסך הבית'}
            </span>
            {isInstallable && (
              <button
                onClick={promptInstall}
                className="flex items-center gap-1 bg-white text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold"
              >
                <Download className="w-4 h-4" />
                התקן
              </button>
            )}
          </div>
        )}
        
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <div className="text-3xl font-bold">{counts.active}</div>
            <div className="text-sm text-blue-100">פעילות</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <div className="text-3xl font-bold">{counts.completed}</div>
            <div className="text-sm text-blue-100">הושלמו</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/mobile/jobs" className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col items-center gap-2 active:scale-95 transition-transform">
          <MapPin className="w-6 h-6 text-blue-600" />
          <span className="text-xs font-medium text-gray-700">ניווט</span>
        </Link>
        <Link href="/mobile/profile" className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col items-center gap-2 active:scale-95 transition-transform">
          <Truck className="w-6 h-6 text-blue-600" />
          <span className="text-xs font-medium text-gray-700">המשאית שלי</span>
        </Link>
        <Link href="/mobile/alerts" className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col items-center gap-2 active:scale-95 transition-transform">
          <AlertCircle className="w-6 h-6 text-blue-600" />
          <span className="text-xs font-medium text-gray-700">דווח בעיה</span>
        </Link>
      </div>

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
        className="w-full bg-yellow-50 rounded-xl p-4 border border-yellow-200 text-yellow-700 text-sm font-semibold"
      >
        איפוס אפליקציה (ניקוי קאש)
      </button>

      {/* Jobs List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">משימות להיום</h3>
          <Link href="/mobile/jobs" className="text-sm text-blue-600 font-medium flex items-center gap-1">
            כל המשימות
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
        
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:scale-98 transition-transform"
          >
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${jobStatusColors[job.status] || 'bg-gray-100 text-gray-700'}`}>
                {jobStatusLabels[job.status] || job.status}
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(job.scheduled_date).toLocaleTimeString('he-IL', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>

            {/* Customer */}
            <div className="mb-2">
              <div className="text-sm font-semibold text-gray-900">
                {job.customer?.name || 'לקוח לא ידוע'}
              </div>
              <div className="text-xs text-gray-500 mt-1">{formatDate(job.scheduled_date, 'dd/MM/yyyy')}</div>
            </div>

            {/* Route */}
            <div className="flex items-start gap-2 mb-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <div className="text-gray-900 font-medium">{job.from_site?.name || 'לא צוין'}</div>
                <div className="text-gray-400 my-1">↓</div>
                <div className="text-gray-900 font-medium">{job.to_site?.name || 'לא צוין'}</div>
              </div>
            </div>

            {/* Material */}
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                <span className="font-medium text-gray-900">{job.material?.name || 'חומר לא ידוע'}</span>
              </div>
              <div className="text-blue-600 font-semibold">
                {job.planned_qty} {billingUnitLabels[job.unit] || job.unit}
              </div>
            </div>

            {/* Action Button */}
            <Link href={`/mobile/jobs?highlight=${job.id}`} className="block w-full mt-3 bg-blue-600 text-white text-center py-2.5 rounded-lg font-medium active:bg-blue-700 transition-colors">
              פתח משימה
            </Link>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center text-gray-500">
            אין משימות להיום
          </div>
        )}
      </div>
    </div>
  )
}
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSameLocalDate(dateValue: string, localDate: string) {
  if (!dateValue) return false
  const date = new Date(dateValue)
  const value = getLocalDateString(date)
  return value === localDate
}
