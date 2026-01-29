'use client'

import { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Check, X, RotateCcw, Pen } from 'lucide-react'

interface SignatureCaptureProps {
  onSave: (signature: string) => void
  onCancel?: () => void
  receiverName?: string
  onReceiverNameChange?: (name: string) => void
  title?: string
  subtitle?: string
  required?: boolean
}

export default function SignatureCapture({
  onSave,
  onCancel,
  receiverName = '',
  onReceiverNameChange,
  title = 'חתימת מקבל',
  subtitle = 'אנא חתום בתיבה למטה',
  required = true
}: SignatureCaptureProps) {
  const signatureRef = useRef<SignatureCanvas>(null)
  const [isEmpty, setIsEmpty] = useState(true)
  const [localReceiverName, setLocalReceiverName] = useState(receiverName)
  const [error, setError] = useState<string | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  // Responsive canvas size
  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById('signature-container')
      if (container) {
        const width = container.clientWidth
        const height = Math.min(250, width * 0.6) // Aspect ratio 5:3
        setCanvasSize({ width, height })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Resize canvas when size changes
  useEffect(() => {
    if (signatureRef.current && canvasSize.width > 0) {
      const canvas = signatureRef.current.getCanvas()
      const data = signatureRef.current.toData()
      
      canvas.width = canvasSize.width
      canvas.height = canvasSize.height
      
      if (data && data.length > 0) {
        signatureRef.current.fromData(data)
      }
    }
  }, [canvasSize])

  const handleBegin = () => {
    setIsEmpty(false)
    setError(null)
  }

  const handleClear = () => {
    signatureRef.current?.clear()
    setIsEmpty(true)
    setError(null)
  }

  const handleSave = () => {
    if (!signatureRef.current) {
      setError('שגיאה בטעינת החתימה')
      return
    }

    // Validate signature
    if (isEmpty || signatureRef.current.isEmpty()) {
      setError('נא לחתום בתיבה')
      return
    }

    // Validate receiver name if required
    if (required && !localReceiverName.trim()) {
      setError('נא להזין שם מקבל')
      return
    }

    // Get signature as base64 PNG
    const signatureData = signatureRef.current.toDataURL('image/png')

    // Call parent callback
    onSave(signatureData)
  }

  const handleReceiverNameChange = (name: string) => {
    setLocalReceiverName(name)
    if (onReceiverNameChange) {
      onReceiverNameChange(name)
    }
    setError(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Pen className="w-6 h-6 text-blue-600" />
          {title}
        </h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>

      {/* Receiver Name Input */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          שם מקבל {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={localReceiverName}
          onChange={(e) => handleReceiverNameChange(e.target.value)}
          placeholder="הזן שם מקבל"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          required={required}
        />
      </div>

      {/* Signature Canvas */}
      <div
        id="signature-container"
        className="bg-white rounded-xl shadow-sm border-2 border-gray-300 overflow-hidden"
      >
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <p className="text-xs text-gray-600 text-center">חתום כאן עם האצבע או העכבר</p>
        </div>
        
        <div className="relative bg-white">
          {canvasSize.width > 0 && (
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                width: canvasSize.width,
                height: canvasSize.height,
                className: 'signature-canvas cursor-crosshair',
                style: { touchAction: 'none' }
              }}
              backgroundColor="white"
              penColor="black"
              minWidth={1}
              maxWidth={3}
              velocityFilterWeight={0.7}
              onBegin={handleBegin}
            />
          )}

          {/* Empty State */}
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <Pen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">התחל לחתום</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex items-start gap-2">
          <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {/* Clear */}
        <button
          onClick={handleClear}
          disabled={isEmpty}
          className="py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="hidden sm:inline">נקה</span>
        </button>

        {/* Cancel */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="py-3 bg-gray-200 text-gray-900 rounded-xl font-semibold active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">ביטול</span>
          </button>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isEmpty}
          className={`py-3 bg-blue-600 text-white rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
            !onCancel ? 'col-span-2' : ''
          }`}
        >
          <Check className="w-5 h-5" />
          <span>אישור</span>
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-700 text-center">
          💡 החתימה נשמרת בפורמט PNG ונשלחת יחד עם תעודת המשלוח
        </p>
      </div>
    </div>
  )
}
