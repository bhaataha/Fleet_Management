'use client'

import { useState } from 'react'
import { Camera, Upload, X, Check } from 'lucide-react'

export default function MobileCameraPage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCapturedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    setUploading(true)
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 2000))
    setUploading(false)
    setCapturedImage(null)
    alert('התמונה הועלתה בהצלחה!')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">צילום מסמכים</h1>

      {!capturedImage ? (
        <div className="space-y-4">
          {/* Camera Button */}
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
              <h3 className="text-xl font-bold text-center mb-2">צלם תעודת שקילה</h3>
              <p className="text-center text-blue-100 text-sm">
                לחץ לפתיחת המצלמה
              </p>
            </div>
          </label>

          {/* Upload from Gallery */}
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

          {/* Recent Photos */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">תמונות אחרונות</h3>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-200 rounded-xl overflow-hidden"
                >
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Camera className="w-8 h-8" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative bg-black rounded-2xl overflow-hidden">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-auto"
            />
            <button
              onClick={() => setCapturedImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCapturedImage(null)}
              className="py-4 bg-gray-100 text-gray-900 rounded-xl font-semibold active:scale-95 transition-transform"
            >
              צלם שוב
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="py-4 bg-blue-600 text-white rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
