'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, X, Check, Loader2 } from 'lucide-react'
import { authApi, driversApi, filesApi, jobsApi } from '@/lib/api'
import type { Job } from '@/types'

type FileType = 'PHOTO' | 'WEIGH_TICKET' | 'DELIVERY_NOTE' | 'OTHER'

type MobileJob = Job & {
  from_site?: { name?: string }
  to_site?: { name?: string }
}

export default function MobileCameraPage() {
  const router = useRouter()
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [jobs, setJobs] = useState<MobileJob[]>([])
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('')
  const [fileType, setFileType] = useState<FileType>('DELIVERY_NOTE')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setError(null)
        const token = localStorage.getItem('access_token')
        if (!token) {
          router.replace('/login')
          return
        }

        // Always fetch fresh user data from server
        const me = await authApi.me()
        const user = me.data
        
        // Clear old cache and save fresh data
        localStorage.removeItem('user')
        localStorage.setItem('user', JSON.stringify(user))
        
        console.log('[Camera] Fresh user from /auth/me:', user)
        
        if (!user.driver_id) {
          setError('חשבון זה אינו משויך לנהג')
          setJobs([])
          setLoading(false)
          return
        }

        const today = getLocalDateString()
        const res = await jobsApi.list({
          from_date: today,
          to_date: today,
          driver_id: user.driver_id,
          limit: 500
        })
        const result = res.data || []
        setJobs(result)
      } catch (error: any) {
        console.error('[Camera] Failed to load jobs:', error)
        if (error?.response?.status === 401) {
          router.replace('/login')
        } else {
          setError('שגיאה בטעינת משימות')
        }
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [router])

  useEffect(() => {
    if (!capturedFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(capturedFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [capturedFile])

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCapturedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!capturedFile || !selectedJobId) return
    setUploading(true)
    try {
      await filesApi.uploadJobFile(Number(selectedJobId), {
        file: capturedFile,
        file_type: fileType
      })
      setCapturedFile(null)
      setSelectedJobId('')
      alert('התמונה הועלתה בהצלחה!')
    } catch (error) {
      console.error('Upload failed:', error)
      alert('העלאה נכשלה, נסה שוב')
    } finally {
      setUploading(false)
    }
  }

  const jobOptions = useMemo(() => jobs.map(job => ({
    id: job.id,
    label: `#${job.id} • ${job.from_site?.name || 'לא צוין'} → ${job.to_site?.name || 'לא צוין'}`
  })), [jobs])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">צילום מסמכים</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
          {error}
        </div>
      )}

      {!capturedFile ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">בחר נסיעה</label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value ? Number(e.target.value) : '')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">בחר נסיעה להעלאה</option>
              {jobOptions.map(job => (
                <option key={job.id} value={job.id}>{job.label}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">סוג תעודה</label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as FileType)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="DELIVERY_NOTE">תעודת משלוח</option>
              <option value="WEIGH_TICKET">תעודת שקילה</option>
              <option value="PHOTO">צילום כללי</option>
              <option value="OTHER">אחר</option>
            </select>
          </div>

          <label className="block">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCapture}
              className="hidden"
            />
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-lg cursor-pointer active:scale-98 transition-transform">
              <Camera className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-center mb-2">צלם תעודה</h3>
              <p className="text-center text-blue-100 text-sm">
                לחץ לפתיחת המצלמה
              </p>
            </div>
          </label>

          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={handleCapture}
              className="hidden"
            />
            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-dashed border-gray-300 cursor-pointer active:scale-98 transition-transform">
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <h3 className="text-lg font-semibold text-center text-gray-900 mb-1">
                העלה מהגלריה
              </h3>
              <p className="text-center text-gray-500 text-sm">
                בחר תמונה קיימת מהמכשיר
              </p>
            </div>
          </label>

          {jobs.length === 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center text-gray-500">
              אין משימות להיום להצמדת תמונה
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative bg-black rounded-2xl overflow-hidden">
            <img
              src={previewUrl || ''}
              alt="Captured"
              className="w-full h-auto"
            />
            <button
              onClick={() => setCapturedFile(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">בחר נסיעה</label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value ? Number(e.target.value) : '')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">בחר נסיעה להעלאה</option>
              {jobOptions.map(job => (
                <option key={job.id} value={job.id}>{job.label}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">סוג תעודה</label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as FileType)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="DELIVERY_NOTE">תעודת משלוח</option>
              <option value="WEIGH_TICKET">תעודת שקילה</option>
              <option value="PHOTO">צילום כללי</option>
              <option value="OTHER">אחר</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCapturedFile(null)}
              className="py-4 bg-gray-100 text-gray-900 rounded-xl font-semibold active:scale-95 transition-transform"
            >
              צלם שוב
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedJobId}
              className="py-4 bg-blue-600 text-white rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>מעלה...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>אשר והעלה</span>
                </>
              )}
            </button>
          </div>
        </div>
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
