'use client'

import { useState } from 'react'
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react'

interface JobFile {
  id: number
  filename: string
  file_type: string
  size: number
  uploaded_at: string
  uploaded_by_name: string
  url: string
}

interface JobFilesViewerProps {
  files: JobFile[]
  isOpen: boolean
  onClose: () => void
  jobId: number
}

export default function JobFilesViewer({
  files,
  isOpen,
  onClose,
  jobId
}: JobFilesViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!isOpen) return null

  const currentFile = files[currentIndex]
  const isImage = currentFile?.file_type === 'PHOTO' || currentFile?.filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % files.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + files.length) % files.length)
  }

  const downloadFile = () => {
    if (currentFile) {
      window.open(currentFile.url, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black/50 text-white p-4 flex items-center justify-between z-10">
        <h3 className="text-lg font-bold">קבצי משימה #{jobId}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm">{currentIndex + 1} מתוך {files.length}</span>
          <button
            onClick={downloadFile}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      {files.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="flex items-center justify-center h-full p-16">
        {isImage ? (
          <img
            src={currentFile.url}
            alt={currentFile.filename}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <div className="bg-white rounded-xl p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Download className="w-8 h-8 text-gray-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">{currentFile.filename}</h4>
            <p className="text-gray-600 mb-4">
              סוג: {currentFile.file_type} | גודל: {(currentFile.size / 1024).toFixed(1)} KB
            </p>
            <button
              onClick={downloadFile}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              הורד קובץ
            </button>
          </div>
        )}
      </div>

      {/* File info */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4">
        <div className="text-center">
          <p className="font-medium">{currentFile?.filename}</p>
          <p className="text-sm text-gray-300">
            הועלה ב-{new Date(currentFile?.uploaded_at).toLocaleDateString('he-IL')} על ידי {currentFile?.uploaded_by_name}
          </p>
        </div>
      </div>

      {/* Click to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  )
}