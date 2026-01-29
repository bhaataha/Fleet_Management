'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import SignatureCapture from '@/components/SignatureCapture'
import { jobsApi } from '@/lib/api'

async function getLocation(): Promise<{ lat?: number; lng?: number }> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return {}
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

export default function MobileSignaturePage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params?.id as string

  const [receiverName, setReceiverName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSaveSignature = async (signatureData: string) => {
    if (!jobId) {
      setError('לא נמצא מזהה נסיעה')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Convert base64 to blob
      const base64Data = signatureData.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })
      
      // Create file
      const file = new File([blob], `signature_${Date.now()}.png`, { type: 'image/png' })

      // Upload signature
      const location = await getLocation()
      await jobsApi.updateStatus(Number(jobId), {
        status: 'DELIVERED',
        note: `תעודת משלוח - מקבל: ${receiverName}`,
        lat: location.lat,
        lng: location.lng,
      })

      // Navigate back with success
      router.push(`/mobile/jobs/${jobId}?success=signature`)
    } catch (error: any) {
      console.error('Failed to save signature:', error)
      setError(error.response?.data?.detail || 'שגיאה בשמירת החתימה')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">חתימת מקבל</h1>
            <p className="text-sm text-gray-600">נסיעה #{jobId}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {saving ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">שומר חתימה...</h3>
            <p className="text-sm text-gray-600">אנא המתן</p>
          </div>
        ) : (
          <SignatureCapture
            onSave={handleSaveSignature}
            onCancel={handleCancel}
            receiverName={receiverName}
            onReceiverNameChange={setReceiverName}
            title="חתימת מקבל"
            subtitle="החתימה תאושר את קבלת המשלוח"
            required={true}
          />
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
            {error}
          </div>
        )}
      </div>

      {/* Instructions */}
      {!saving && (
        <div className="p-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">הוראות:</h4>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>הזן את שם המקבל בשדה למעלה</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>בקש מהמקבל לחתום בתיבה</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>לחץ "אישור" לשמירת החתימה</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span>הסטטוס יעודכן אוטומטית ל-"נמסר"</span>
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
