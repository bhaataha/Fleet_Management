'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { jobsApi, sitesApi, materialsApi, driversApi } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Plus, Truck, Calendar, Users, Package } from 'lucide-react'
import type { Job } from '@/types'
import { formatDate, jobStatusLabels, jobStatusColors } from '@/lib/utils'
import Link from 'next/link'

export default function DashboardPage() {
  const { t } = useI18n()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [pwaStatus, setPwaStatus] = useState({
    supported: false,
    installed: false,
    swRegistered: false,
    pushSupported: false,
    pushSubscribed: false,
    notificationPermission: 'default' as NotificationPermission,
    online: true,
  })
  
  // Reference data
  const [sites, setSites] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])

  useEffect(() => {
    loadReferenceData()
    loadTodayJobs()
    checkPwaStatus()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadTodayJobs()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const checkPwaStatus = async () => {
    if (typeof window === 'undefined') return

    const online = navigator.onLine
    const supported = 'serviceWorker' in navigator
    const pushSupported = 'PushManager' in window
    const installed = window.matchMedia('(display-mode: standalone)').matches
    const notificationPermission = 'Notification' in window ? Notification.permission : 'default'

    let swRegistered = false
    let pushSubscribed = false

    if (supported) {
      try {
        const reg = await navigator.serviceWorker.getRegistration()
        swRegistered = !!reg
        if (reg && pushSupported) {
          const sub = await reg.pushManager.getSubscription()
          pushSubscribed = !!sub
        }
      } catch (error) {
        console.error('Failed to check PWA status:', error)
      }
    }

    setPwaStatus({
      supported,
      installed,
      swRegistered,
      pushSupported,
      pushSubscribed,
      notificationPermission,
      online,
    })
  }

  const loadReferenceData = async () => {
    try {
      const [sitesRes, materialsRes, driversRes] = await Promise.all([
        sitesApi.getAll(),
        materialsApi.getAll(),
        driversApi.getAll()
      ])
      setSites(sitesRes.data)
      setMaterials(materialsRes.data)
      setDrivers(driversRes.data)
    } catch (error) {
      console.error('Failed to load reference data:', error)
    }
  }

  const loadTodayJobs = async () => {
    try {
      const response = await jobsApi.getAll()
      // Filter for today's jobs on the client side
      const now = new Date()
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const todayJobs = response.data.filter((job: Job) => {
        if (!job.scheduled_date) return false
        const jobDate = job.scheduled_date.split('T')[0]
        return jobDate === today
      })
      setJobs(todayJobs)
    } catch (error) {
      console.error('Failed to load jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSiteName = (siteId: number | null | undefined) => {
    if (!siteId) return '-'
    const site = sites.find(s => s.id === siteId)
    return site?.name || `אתר #${siteId}`
  }

  const getMaterialName = (materialId: number | null | undefined) => {
    if (!materialId) return '-'
    const material = materials.find(m => m.id === materialId)
    return material?.name || `חומר #${materialId}`
  }

  const getDriverName = (driverId: number | null | undefined) => {
    if (!driverId) return '-'
    const driver = drivers.find(d => d.id === driverId)
    return driver?.name || `נהג #${driverId}`
  }

  const stats = {
    total: jobs.length,
    planned: jobs.filter(j => j.status === 'PLANNED').length,
    active: jobs.filter(j => ['ASSIGNED', 'ENROUTE_PICKUP', 'LOADED', 'ENROUTE_DROPOFF'].includes(j.status)).length,
    completed: jobs.filter(j => j.status === 'DELIVERED' || j.status === 'CLOSED').length,
    canceled: jobs.filter(j => j.status === 'CANCELED').length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Quick Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
            <p className="text-gray-600 mt-2">{formatDate(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          </div>
          
          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/jobs/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              הוספת נסיעה
            </Link>
            <Link
              href="/dispatch"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Calendar className="w-5 h-5" />
              לוח שיבוץ
            </Link>
            <Link
              href="/customers/new"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Users className="w-5 h-5" />
              לקוח חדש
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Jobs */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('dashboard.todayJobs')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Jobs */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('dashboard.activeJobs')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Completed Jobs */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('dashboard.completedToday')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Planned Jobs */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('jobStatus.PLANNED')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.planned}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Jobs List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('dashboard.todayJobs')}
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500">{t('common.loading')}</div>
            ) : jobs.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                אין נסיעות מתוכננות להיום
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t('jobs.jobNumber')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t('jobs.fromSite')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t('jobs.toSite')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t('jobs.material')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t('jobs.driver')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t('common.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/jobs/${job.id}`}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{job.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{getSiteName(job.from_site_id)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{getSiteName(job.to_site_id)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{getMaterialName(job.material_id)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {getDriverName(job.driver_id)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${jobStatusColors[job.status]}`}>
                          {t(`jobStatus.${job.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* PWA Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">מצב PWA</h2>
          <button
            onClick={checkPwaStatus}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            רענן
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Service Worker</span>
            <span className={pwaStatus.swRegistered ? 'text-green-600 font-semibold' : 'text-gray-400'}>
              {pwaStatus.swRegistered ? 'פעיל' : 'לא פעיל'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Push</span>
            <span className={pwaStatus.pushSubscribed ? 'text-green-600 font-semibold' : 'text-gray-400'}>
              {pwaStatus.pushSubscribed ? 'מחובר' : 'לא מחובר'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">הרשאת התראות</span>
            <span className={pwaStatus.notificationPermission === 'granted' ? 'text-green-600 font-semibold' : 'text-gray-400'}>
              {pwaStatus.notificationPermission === 'granted' ? 'מאושר' : 'לא מאושר'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">התקנה</span>
            <span className={pwaStatus.installed ? 'text-green-600 font-semibold' : 'text-gray-400'}>
              {pwaStatus.installed ? 'מותקן' : 'לא מותקן'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">חיבור</span>
            <span className={pwaStatus.online ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              {pwaStatus.online ? 'אונליין' : 'אופליין'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">תמיכה בדפדפן</span>
            <span className={pwaStatus.supported ? 'text-green-600 font-semibold' : 'text-gray-400'}>
              {pwaStatus.supported ? 'נתמך' : 'לא נתמך'}
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
