'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, Clock, Navigation, Loader2, RefreshCw, Camera, Image, Eye } from 'lucide-react'
import { authApi, driversApi, jobsApi, filesApi } from '@/lib/api'
import { jobStatusLabels, jobStatusColors, billingUnitLabels, formatDate } from '@/lib/utils'
import { usePullToRefresh } from '@/lib/hooks/usePullToRefresh'
import JobFilesViewer from '@/components/JobFilesViewer'
import type { Job, JobStatus } from '@/types'

type MobileJob = Job & {
  customer?: { name?: string }
  from_site?: { name?: string; address?: string }
  to_site?: { name?: string; address?: string }
  material?: { name?: string }
}

type StatusUpdate = {
  job_id: number
  status: JobStatus
  note?: string
  lat?: number
  lng?: number
  created_at: string
}

const STATUS_FLOW: Record<JobStatus, JobStatus | null> = {
  PLANNED: 'ASSIGNED',
  ASSIGNED: 'ENROUTE_PICKUP',
  ENROUTE_PICKUP: 'LOADED',
  LOADED: 'ENROUTE_DROPOFF',
  ENROUTE_DROPOFF: 'DELIVERED',
  DELIVERED: 'CLOSED',
  CLOSED: null,
  CANCELED: null,
}

const STATUS_ACTION_LABELS: Record<JobStatus, string> = {
  PLANNED: 'שובץ',
  ASSIGNED: 'יציאה לטעינה',
  ENROUTE_PICKUP: 'נטען',
  LOADED: 'יציאה לפריקה',
  ENROUTE_DROPOFF: 'נמסר',
  DELIVERED: 'סגירה',
  CLOSED: 'סגור',
  CANCELED: 'מבוטל',
}

function getQueue(): StatusUpdate[] {
  try {
    return JSON.parse(localStorage.getItem('driver_status_queue') || '[]')
  } catch {
    return []
  }
}

function setQueue(queue: StatusUpdate[]) {
  localStorage.setItem('driver_status_queue', JSON.stringify(queue))
}

async function getLocation(): Promise<{ lat?: number; lng?: number }> {
  if (!navigator.geolocation) return {}
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        try {
          const cached = localStorage.getItem('last_known_gps')
          if (cached) {
            const parsed = JSON.parse(cached)
            if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
              return resolve({ lat: parsed.lat, lng: parsed.lng })
            }
          }
        } catch {}
        resolve({})
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  })
}

export default function MobileJobsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const highlightId = Number(searchParams.get('highlight') || '') || null
  const [jobs, setJobs] = useState<MobileJob[]>([])
  const [loading, setLoading] = useState(true)
  const [driverId, setDriverId] = useState<number | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string>('נהג')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [range, setRange] = useState<'today' | 'tomorrow' | 'week' | 'all'>('today')
  const [searchTerm, setSearchTerm] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null)
  const [jobFiles, setJobFiles] = useState<Record<number, any[]>>({})
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerJobId, setViewerJobId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }

      try {
        // Always fetch fresh user data from server
        const me = await authApi.me()
        const user = me.data
        
        // Clear old cache and save fresh data
        localStorage.removeItem('user')
        localStorage.setItem('user', JSON.stringify(user))
        
        console.log('[Jobs] Fresh user from /auth/me:', user)
        
        setUserId(user.id || null)
        setUserName(user.name || 'נהג')
        setDriverId(user.driver_id || null)
        
        if (!user.driver_id) {
          console.warn('[Jobs] User has no driver_id')
        }
      } catch (error) {
        console.error('[Jobs] Failed to refresh user from /auth/me:', error)
        router.replace('/login')
      }
    }

    bootstrap()
  }, [router])

  useEffect(() => {
    // Removed resolveDriver - we now only trust driver_id from /auth/me
  }, [])

  const loadJobs = async () => {
    try {
      setError(null)
      setLoading(true)
      if (!driverId) {
        setJobs([])
        setError('לא נמצא מזהה נהג. נסה להתנתק ולהתחבר מחדש.')
        return
      }

      const { fromDate, toDate } = getDateRange(range)
      const params: Record<string, string | number | undefined> = {
        driver_id: driverId || undefined,
        limit: 500
      }
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate

      const res = await jobsApi.list(params)
      const result = res.data || []
      setJobs(result)
      setLastUpdated(new Date().toISOString())
    } catch (error) {
      console.error('Failed to load driver jobs:', error)
      setError('שגיאה בטעינת המשימות')
    } finally {
      setLoading(false)
    }
  }

  const flushQueue = async () => {
    if (!navigator.onLine) return
    const queue = getQueue()
    if (queue.length === 0) return
    setSyncing(true)
    try {
      for (const item of queue) {
        await jobsApi.updateStatus(item.job_id, {
          status: item.status,
          note: item.note,
          lat: item.lat,
          lng: item.lng,
        })
      }
      setQueue([])
      await loadJobs()
    } catch (error) {
      console.error('Failed to sync queue:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleRefresh = useCallback(async () => {
    if (driverId === null || refreshing) return
    
    setRefreshing(true)
    try {
      // First flush queue to sync any pending status updates
      if (navigator.onLine) {
        await flushQueue()
      }
      // Then reload all jobs
      await loadJobs()
    } catch (error) {
      console.error('Failed to refresh jobs:', error)
    } finally {
      setRefreshing(false)
    }
  }, [driverId, refreshing, loadJobs, flushQueue])

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

  useEffect(() => {
    if (driverId !== null) {
      loadJobs()
    }
  }, [driverId, range])

  useEffect(() => {
    const handleOnline = () => flushQueue()
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  const filteredJobs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const scoped = jobs.filter(job => {
      if (filter === 'active') {
        return ['ASSIGNED', 'ENROUTE_PICKUP', 'LOADED', 'ENROUTE_DROPOFF'].includes(job.status)
      }
      if (filter === 'completed') {
        return ['DELIVERED', 'CLOSED'].includes(job.status)
      }
      return true
    })

    const searched = normalizedSearch
      ? scoped.filter(job => {
          const fields = [
            job.customer?.name,
            job.from_site?.name,
            job.to_site?.name,
            job.material?.name,
            job.notes,
          ]
            .filter(Boolean)
            .map(value => String(value).toLowerCase())
          return fields.some(value => value.includes(normalizedSearch))
        })
      : scoped

    return searched.sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
  }, [jobs, filter, searchTerm])

  const handleNavigation = (job: MobileJob) => {
    const destination = job.to_site?.address || job.to_site?.name || ''
    if (!destination) return
    const url = `https://waze.com/ul?q=${encodeURIComponent(destination)}`
    window.open(url, '_blank')
  }

  const handleStatusUpdate = async (job: MobileJob) => {
    const nextStatus = STATUS_FLOW[job.status]
    if (!nextStatus) return

    const location = await getLocation()
    const updatePayload: StatusUpdate = {
      job_id: job.id,
      status: nextStatus,
      lat: location.lat,
      lng: location.lng,
      created_at: new Date().toISOString(),
    }

    if (!navigator.onLine) {
      const queue = getQueue()
      setQueue([...queue, updatePayload])
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: nextStatus } : j))
      return
    }

    try {
      await jobsApi.updateStatus(job.id, {
        status: nextStatus,
        lat: location.lat,
        lng: location.lng,
      })
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: nextStatus } : j))
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const loadJobFiles = async (jobId: number) => {
    try {
      const response = await filesApi.listJobFiles(jobId)
      setJobFiles(prev => ({
        ...prev,
        [jobId]: response.data.files || []
      }))
    } catch (error) {
      console.error('Failed to load job files:', error)
    }
  }

  const handleTakePhoto = async (jobId: number) => {
    try {
      setUploadingPhoto(jobId)
      
      // Create file input to capture photo
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = 'environment' // Use back camera
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        
        try {
          await filesApi.uploadJobFile(jobId, {
            file,
            file_type: 'PHOTO'
          })
          
          // Reload files for this job
          await loadJobFiles(jobId)
          
          console.log('Photo uploaded successfully')
        } catch (error) {
          console.error('Failed to upload photo:', error)
          alert('שגיאה בהעלאת התמונה')
        } finally {
          setUploadingPhoto(null)
        }
      }
      
      input.click()
    } catch (error) {
      console.error('Failed to take photo:', error)
      setUploadingPhoto(null)
    }
  }

  const handleViewFiles = async (jobId: number) => {
    // Load files if not loaded
    if (!jobFiles[jobId]) {
      await loadJobFiles(jobId)
    }
    
    const files = jobFiles[jobId] || []
    if (files.length === 0) {
      alert('אין תמונות למשימה זו')
      return
    }
    
    // Open files viewer modal
    setViewerJobId(jobId)
    setViewerOpen(true)
  }

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
          <span className="ml-2 text-sm text-blue-600">מרענן...</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">הנסיעות שלי</h1>
        <button
          onClick={() => {
            flushQueue()
            loadJobs()
          }}
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600"
        >
          {syncing || refreshing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {[
            { key: 'today', label: 'היום' },
            { key: 'tomorrow', label: 'מחר' },
            { key: 'week', label: '7 ימים' },
            { key: 'all', label: 'הכל' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRange(tab.key as typeof range)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                range === tab.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="חיפוש לפי לקוח, אתר או חומר"
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        {[
          { key: 'all', label: 'הכל' },
          { key: 'active', label: 'פעיל' },
          { key: 'completed', label: 'הושלם' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
              filter === tab.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {lastUpdated && (
        <div className="text-xs text-gray-400">עודכן לאחרונה: {new Date(lastUpdated).toLocaleTimeString('he-IL')}</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
          {error}
        </div>
      )}

      {getQueue().length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-xl p-3">
          יש עדכונים שממתינים לסנכרון. הם יישלחו כשיש חיבור.
        </div>
      )}

      <div className="space-y-3">
        {filteredJobs.map((job) => {
          const nextStatus = STATUS_FLOW[job.status]
          const highlight = highlightId === job.id
          const files = jobFiles[job.id] || []
          const hasFiles = files.length > 0
          
          // Load files on first render
          if (!jobFiles[job.id] && job.id) {
            loadJobFiles(job.id)
          }
          
          return (
            <div
              key={job.id}
              className={`bg-white rounded-xl p-4 shadow-sm border ${highlight ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'} transition`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${jobStatusColors[job.status] || 'bg-gray-100 text-gray-700'}`}>
                  {jobStatusLabels[job.status] || job.status}
                </span>
                <div className="flex items-center gap-2">
                  {hasFiles && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <Image className="w-3 h-3" />
                      <span>{files.length}</span>
                    </div>
                  )}
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {job.scheduled_date
                      ? new Date(job.scheduled_date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </span>
                </div>
              </div>

              <div className="text-sm font-semibold text-gray-900 mb-1">
                {job.customer?.name || 'לקוח לא ידוע'}
              </div>
              <div className="text-xs text-gray-500 mb-3">{formatDate(job.scheduled_date, 'dd/MM/yyyy')}</div>

              <div className="flex items-start gap-2 mb-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm">
                  <div className="text-gray-900 font-medium">{job.from_site?.name || 'לא צוין'}</div>
                  <div className="text-gray-400 my-1">↓</div>
                  <div className="text-gray-900 font-medium">{job.to_site?.name || 'לא צוין'}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  <span className="font-medium text-gray-900">{job.material?.name || 'חומר לא ידוע'}</span>
                </div>
                <div className="text-blue-600 font-semibold">
                  {job.planned_qty} {billingUnitLabels[job.unit] || job.unit}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => handleStatusUpdate(job)}
                  disabled={!nextStatus}
                  className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                    nextStatus ? 'bg-blue-600 text-white active:bg-blue-700' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {nextStatus ? STATUS_ACTION_LABELS[job.status] : 'סגור'}
                </button>
                <button
                  onClick={() => handleNavigation(job)}
                  className="px-3 py-2.5 rounded-lg border border-gray-200 text-gray-700 bg-white flex items-center justify-center"
                >
                  <Navigation className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleTakePhoto(job.id)}
                  disabled={uploadingPhoto === job.id}
                  className="px-3 py-2.5 rounded-lg border border-gray-200 text-gray-700 bg-white flex items-center justify-center disabled:opacity-50"
                >
                  {uploadingPhoto === job.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                {hasFiles && (
                  <button
                    onClick={() => handleViewFiles(job.id)}
                    className="px-3 py-2.5 rounded-lg border border-green-200 text-green-700 bg-green-50 flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
              </div>

              {nextStatus && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <Navigation className="w-4 h-4" />
                  עדכון סטטוס הבא: {jobStatusLabels[nextStatus] || nextStatus}
                </div>
              )}

              {job.notes && (
                <div className="mt-2 text-xs text-gray-500">הערות: {job.notes}</div>
              )}
            </div>
          )
        })}

        {filteredJobs.length === 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center text-gray-500">
            אין משימות להצגה
          </div>
        )}
      </div>

      {/* Files Viewer Modal */}
      {viewerOpen && viewerJobId && (
        <JobFilesViewer
          files={jobFiles[viewerJobId] || []}
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false)
            setViewerJobId(null)
          }}
          jobId={viewerJobId}
        />
      )}
    </div>
  )
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDateRange(range: 'today' | 'tomorrow' | 'week' | 'all') {
  const today = new Date()
  const start = new Date(today)
  const end = new Date(today)

  if (range === 'tomorrow') {
    start.setDate(start.getDate() + 1)
    end.setDate(end.getDate() + 1)
  }

  if (range === 'week') {
    end.setDate(end.getDate() + 6)
  }

  if (range === 'all') {
    return { fromDate: undefined, toDate: undefined }
  }

  return {
    fromDate: getLocalDateString(start),
    toDate: getLocalDateString(end),
  }
}
