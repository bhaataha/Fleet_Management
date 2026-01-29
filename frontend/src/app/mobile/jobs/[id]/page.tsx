'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { 
  ArrowRight, 
  MapPin, 
  Package, 
  Truck, 
  User, 
  Calendar,
  CheckCircle,
  Clock,
  PenLine,
  Camera,
  Loader2
} from 'lucide-react'
import { jobsApi } from '@/lib/api'
import type { Job } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'מתוכנן',
  ASSIGNED: 'משובץ',
  ENROUTE_PICKUP: 'בדרך לטעינה',
  LOADED: 'נטען',
  ENROUTE_DROPOFF: 'בדרך לפריקה',
  DELIVERED: 'נמסר',
  CLOSED: 'סגור',
  CANCELED: 'בוטל'
}

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-gray-100 text-gray-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  ENROUTE_PICKUP: 'bg-yellow-100 text-yellow-700',
  LOADED: 'bg-purple-100 text-purple-700',
  ENROUTE_DROPOFF: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  CANCELED: 'bg-red-100 text-red-700'
}

type MobileJob = Job & {
  from_site?: { name?: string; address?: string }
  to_site?: { name?: string; address?: string }
  material?: { name?: string }
  driver?: { name?: string }
  truck?: { plate_number?: string }
}

export default function MobileJobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const jobId = params?.id as string

  const [job, setJob] = useState<MobileJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadJob()

    // Check for success message
    if (searchParams?.get('success') === 'signature') {
      setSuccess('החתימה נשמרה בהצלחה!')
      setTimeout(() => setSuccess(null), 3000)
    }
  }, [jobId, searchParams])

  const loadJob = async () => {
    if (!jobId) return

    try {
      setLoading(true)
      setError(null)
      const res = await jobsApi.get(Number(jobId))
      setJob(res.data)
    } catch (error: any) {
      console.error('Failed to load job:', error)
      if (error?.response?.status === 401) {
        router.replace('/login')
      } else {
        setError('שגיאה בטעינת פרטי הנסיעה')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!jobId) return

    try {
      await jobsApi.updateStatus(Number(jobId), { status: newStatus })
      await loadJob()
      setSuccess('הסטטוס עודכן בהצלחה!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Failed to update status:', error)
      setError(error.response?.data?.detail || 'שגיאה בעדכון הסטטוס')
    }
  }

  const handleGoToSignature = () => {
    router.push(`/mobile/jobs/${jobId}/signature`)
  }

  const handleGoToCamera = () => {
    router.push(`/mobile/camera?job_id=${jobId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-gray-600">טוען פרטי נסיעה...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          {error || 'נסיעה לא נמצאה'}
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 w-full py-3 bg-gray-200 text-gray-900 rounded-xl font-semibold"
        >
          חזור
        </button>
      </div>
    )
  }

  const canSign = job.status === 'ENROUTE_DROPOFF' || job.status === 'LOADED'
  const canPhoto = job.status !== 'CLOSED' && job.status !== 'CANCELED'

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">נסיעה #{job.id}</h1>
            <p className={`text-sm px-2 py-0.5 rounded-full inline-block ${STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-700'}`}>
              {STATUS_LABELS[job.status] || job.status}
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="m-4 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Route Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            מסלול
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-3 h-3 bg-green-600 rounded-full" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{job.from_site?.name || 'לא צוין'}</p>
                <p className="text-sm text-gray-600">{job.from_site?.address || ''}</p>
              </div>
            </div>

            <div className="mr-4 border-r-2 border-dashed border-gray-300 h-8" />

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{job.to_site?.name || 'לא צוין'}</p>
                <p className="text-sm text-gray-600">{job.to_site?.address || ''}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 space-y-3">
          <h3 className="font-semibold text-gray-900 mb-3">פרטים</h3>

          <div className="flex items-center gap-3 text-gray-700">
            <Package className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">חומר</p>
              <p className="font-medium">{job.material?.name || 'לא צוין'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">תאריך</p>
              <p className="font-medium">
                {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString('he-IL') : 'לא צוין'}
              </p>
            </div>
          </div>

          {job.truck && (
            <div className="flex items-center gap-3 text-gray-700">
              <Truck className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">משאית</p>
                <p className="font-medium">{job.truck.plate_number}</p>
              </div>
            </div>
          )}

          {job.driver && (
            <div className="flex items-center gap-3 text-gray-700">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">נהג</p>
                <p className="font-medium">{job.driver.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">פעולות</h3>
          
          <div className="space-y-2">
            {/* Signature Button */}
            {canSign && (
              <button
                onClick={handleGoToSignature}
                className="w-full py-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl font-semibold active:scale-98 transition-transform flex items-center justify-center gap-2"
              >
                <PenLine className="w-5 h-5" />
                <span>חתימת מקבל</span>
              </button>
            )}

            {/* Camera Button */}
            {canPhoto && (
              <button
                onClick={handleGoToCamera}
                className="w-full py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-semibold active:scale-98 transition-transform flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                <span>צילום מסמכים</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        {job.status_events && job.status_events.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              היסטוריית סטטוסים
            </h3>
            <div className="space-y-3">
              {job.status_events.map((event: any, index: number) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {STATUS_LABELS[event.status] || event.status}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.event_time).toLocaleString('he-IL')}
                    </p>
                    {event.note && (
                      <p className="text-sm text-gray-700 mt-1">{event.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
