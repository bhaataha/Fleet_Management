'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, X, Check, Loader2, RotateCcw, SwitchCamera, Image as ImageIcon } from 'lucide-react'
import { authApi, filesApi, jobsApi } from '@/lib/api'
import type { Job } from '@/types'
import {
  isCameraAvailable,
  requestCameraPermission,
  openCameraStream,
  capturePhotoFromStream,
  compressImage,
  formatFileSize,
  validateImageFile,
  blobToFile
} from '@/lib/camera-utils'

type FileType = 'PHOTO' | 'WEIGH_TICKET' | 'DELIVERY_NOTE' | 'OTHER'

type MobileJob = Job & {
  from_site?: { name?: string }
  to_site?: { name?: string }
}

export default function MobileCameraEnhancedPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // File states
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Job selection
  const [jobs, setJobs] = useState<MobileJob[]>([])
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('')
  const [fileType, setFileType] = useState<FileType>('DELIVERY_NOTE')

  // UI states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Camera states
  const [cameraMode, setCameraMode] = useState<'off' | 'preview' | 'active'>('off')
  const [cameraAvailable, setCameraAvailable] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [compressing, setCompressing] = useState(false)

  useEffect(() => {
    loadJobs()
    checkCamera()

    return () => {
      stopCamera()
    }
  }, [])

  useEffect(() => {
    if (!capturedFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(capturedFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [capturedFile])

  const checkCamera = async () => {
    const available = await isCameraAvailable()
    setCameraAvailable(available)
  }

  const loadJobs = async () => {
    try {
      setError(null)
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }

      const me = await authApi.me()
      const user = me.data

      localStorage.removeItem('user')
      localStorage.setItem('user', JSON.stringify(user))

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

  const startCamera = async () => {
    try {
      setError(null)
      setCameraMode('active')

      // Request permission
      await requestCameraPermission()

      // Open camera stream
      const stream = await openCameraStream({ facingMode })
      streamRef.current = stream

      // Attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (error: any) {
      console.error('[Camera] Failed to start camera:', error)
      setError(error.message || 'שגיאה בפתיחת המצלמה')
      setCameraMode('off')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraMode('off')
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !streamRef.current) {
      setError('המצלמה לא פעילה')
      return
    }

    try {
      setCompressing(true)
      setError(null)

      // Capture photo from video stream
      const photoBlob = await capturePhotoFromStream(videoRef.current, { quality: 0.92 })

      // Convert to file
      const timestamp = new Date().getTime()
      const filename = `photo_${timestamp}.jpg`
      let photoFile = blobToFile(photoBlob, filename)

      // Compress image
      photoFile = await compressImage(photoFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        quality: 0.85
      })

      // Validate
      const validation = validateImageFile(photoFile)
      if (!validation.valid) {
        setError(validation.error || 'קובץ לא תקין')
        return
      }

      // Set captured file
      setCapturedFile(photoFile)

      // Stop camera
      stopCamera()

      setSuccess(`תמונה נשמרה (${formatFileSize(photoFile.size)})`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('[Camera] Failed to capture photo:', error)
      setError('שגיאה בצילום התמונה')
    } finally {
      setCompressing(false)
    }
  }

  const switchCamera = async () => {
    stopCamera()
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
    setTimeout(() => startCamera(), 100)
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setCompressing(true)
      setError(null)

      // Validate original file
      const validation = validateImageFile(file)
      if (!validation.valid) {
        setError(validation.error || 'קובץ לא תקין')
        return
      }

      // Compress image
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        quality: 0.85
      })

      setCapturedFile(compressedFile)
      setSuccess(`תמונה נבחרה (${formatFileSize(compressedFile.size)})`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('[Camera] Failed to process file:', error)
      setError('שגיאה בעיבוד הקובץ')
    } finally {
      setCompressing(false)
    }
  }

  const handleUpload = async () => {
    if (!capturedFile || !selectedJobId) {
      setError('נא לבחור נסיעה ותמונה')
      return
    }

    setUploading(true)
    setError(null)

    try {
      await filesApi.uploadJobFile(Number(selectedJobId), {
        file: capturedFile,
        file_type: fileType
      })

      setSuccess('התמונה הועלתה בהצלחה!')
      setCapturedFile(null)
      setSelectedJobId('')

      // Refresh after success
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (error: any) {
      console.error('[Camera] Upload failed:', error)
      setError(error.response?.data?.detail || 'העלאה נכשלה, נסה שוב')
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
    <div className="space-y-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-900">צילום מסמכים מתקדם</h1>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 flex items-start gap-2">
          <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-3 flex items-start gap-2">
          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Camera mode: Active camera stream */}
      {cameraMode === 'active' && (
        <div className="space-y-4">
          <div className="relative bg-black rounded-2xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto"
            />

            {/* Camera controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={stopCamera}
                  className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white"
                >
                  <X className="w-6 h-6" />
                </button>

                <button
                  onClick={capturePhoto}
                  disabled={compressing}
                  className="p-6 bg-white rounded-full shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                >
                  {compressing ? (
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-blue-600" />
                  )}
                </button>

                <button
                  onClick={switchCamera}
                  className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white"
                >
                  <SwitchCamera className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            מכוון את המצלמה ולחץ על הכפתור לצילום
          </div>
        </div>
      )}

      {/* No photo captured yet */}
      {cameraMode === 'off' && !capturedFile && (
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

          {/* Native camera button */}
          {cameraAvailable && (
            <button
              onClick={startCamera}
              className="w-full bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-lg active:scale-98 transition-transform"
            >
              <Camera className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-center mb-2">פתח מצלמה</h3>
              <p className="text-center text-blue-100 text-sm">
                צלם תעודה עם המצלמה הנייטיבית
              </p>
            </button>
          )}

          {/* File input fallback */}
          <label className="block">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileInput}
              disabled={compressing}
              className="hidden"
            />
            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-dashed border-gray-300 cursor-pointer active:scale-98 transition-transform">
              {compressing ? (
                <Loader2 className="w-12 h-12 mx-auto mb-3 text-blue-600 animate-spin" />
              ) : (
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              )}
              <h3 className="text-lg font-semibold text-center text-gray-900 mb-1">
                {compressing ? 'מעבד תמונה...' : 'העלה מהגלריה'}
              </h3>
              <p className="text-center text-gray-500 text-sm">
                {compressing ? 'אנא המתן' : 'בחר תמונה קיימת מהמכשיר'}
              </p>
            </div>
          </label>

          {jobs.length === 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center text-gray-500">
              אין משימות להיום להצמדת תמונה
            </div>
          )}
        </div>
      )}

      {/* Photo captured - preview and upload */}
      {capturedFile && previewUrl && (
        <div className="space-y-4">
          <div className="relative bg-black rounded-2xl overflow-hidden">
            <img
              src={previewUrl}
              alt="Captured"
              className="w-full h-auto"
            />
            <button
              onClick={() => setCapturedFile(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white"
            >
              <X className="w-6 h-6" />
            </button>

            {/* File info */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
              <div className="flex items-center justify-between">
                <span>גודל: {formatFileSize(capturedFile.size)}</span>
                <ImageIcon className="w-5 h-5" />
              </div>
            </div>
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
              onClick={() => {
                setCapturedFile(null)
                if (cameraAvailable) {
                  startCamera()
                }
              }}
              className="py-4 bg-gray-100 text-gray-900 rounded-xl font-semibold active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>צלם שוב</span>
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
