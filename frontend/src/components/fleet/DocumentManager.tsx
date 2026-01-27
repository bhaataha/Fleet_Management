'use client'

import { useState } from 'react'
import { FileText, Upload, Download, Trash2, Plus, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Document {
  id?: number
  name: string
  type: 'insurance' | 'test' | 'license' | 'registration' | 'other'
  expiry_date?: string
  file_url?: string
  notes?: string
  uploaded_at?: string
}

interface DocumentManagerProps {
  entityType: 'truck' | 'driver'
  entityId: number
  entityName: string
  documents?: Document[]
  onDocumentAdd?: (document: Document) => void
  onDocumentUpdate?: (id: number, document: Document) => void
  onDocumentDelete?: (id: number) => void
}

const DOCUMENT_TYPES = {
  insurance: { label: 'ביטוח', icon: '🛡️', color: 'blue' },
  test: { label: 'טסט רכב', icon: '🔧', color: 'green' },
  license: { label: 'רישיון נהיגה', icon: '📄', color: 'purple' },
  registration: { label: 'רישוי רכב', icon: '📋', color: 'orange' },
  other: { label: 'אחר', icon: '📄', color: 'gray' }
}

export default function DocumentManager({
  entityType,
  entityId,
  entityName,
  documents = [],
  onDocumentAdd,
  onDocumentUpdate,
  onDocumentDelete
}: DocumentManagerProps) {
  const [isAddingDoc, setIsAddingDoc] = useState(false)
  const [newDoc, setNewDoc] = useState<Document>({
    name: '',
    type: 'other',
    expiry_date: '',
    notes: ''
  })

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { status: 'none', color: 'text-gray-500', days: 0 }
    
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { status: 'expired', color: 'text-red-600', days: Math.abs(diffDays) }
    } else if (diffDays <= 30) {
      return { status: 'expiring', color: 'text-yellow-600', days: diffDays }
    } else {
      return { status: 'valid', color: 'text-green-600', days: diffDays }
    }
  }

  const handleAddDocument = () => {
    if (newDoc.name.trim()) {
      onDocumentAdd?.(newDoc)
      setNewDoc({ name: '', type: 'other', expiry_date: '', notes: '' })
      setIsAddingDoc(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          מסמכים ורישיונות - {entityName}
        </h3>
        <button
          onClick={() => setIsAddingDoc(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          הוספת מסמך
        </button>
      </div>

      {/* Add Document Form */}
      {isAddingDoc && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-900 mb-3">הוספת מסמך חדש</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם המסמך</label>
              <input
                type="text"
                value={newDoc.name}
                onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                placeholder="למשל: ביטוח חובה 2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סוג מסמך</label>
              <select
                value={newDoc.type}
                onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value as Document['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(DOCUMENT_TYPES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תאריך פקיעה</label>
              <input
                type="date"
                value={newDoc.expiry_date}
                onChange={(e) => setNewDoc({ ...newDoc, expiry_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
              <input
                type="text"
                value={newDoc.notes}
                onChange={(e) => setNewDoc({ ...newDoc, notes: e.target.value })}
                placeholder="הערות נוספות..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddDocument}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              שמירה
            </button>
            <button
              onClick={() => {
                setIsAddingDoc(false)
                setNewDoc({ name: '', type: 'other', expiry_date: '', notes: '' })
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>אין מסמכים רשומים</p>
          <p className="text-sm">לחץ על "הוספת מסמך" כדי להתחיל</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc, index) => {
            const docType = DOCUMENT_TYPES[doc.type] || DOCUMENT_TYPES.other
            const expiryStatus = getExpiryStatus(doc.expiry_date)
            
            return (
              <div
                key={doc.id || index}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{docType.icon}</span>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{doc.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-${docType.color}-100 text-${docType.color}-800`}>
                        {docType.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {doc.expiry_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>פג: {formatDate(doc.expiry_date)}</span>
                          <span className={`font-medium ${expiryStatus.color}`}>
                            {expiryStatus.status === 'expired' 
                              ? `(פג לפני ${expiryStatus.days} יום)`
                              : expiryStatus.status === 'expiring'
                              ? `(פג בעוד ${expiryStatus.days} יום)`
                              : expiryStatus.status === 'valid'
                              ? `(תקף עוד ${expiryStatus.days} יום)`
                              : ''}
                          </span>
                        </div>
                      )}
                      {doc.notes && (
                        <span>הערות: {doc.notes}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-500 hover:text-blue-600 transition-colors" title="הורד מסמך">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-green-600 transition-colors" title="החלף קובץ">
                    <Upload className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDocumentDelete?.(doc.id!)}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors" 
                    title="מחק מסמך"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p><strong>טיפ:</strong> המערכת תתריע אוטומטית על מסמכים שפוגים בעוד 30 יום או פחות.</p>
        <p>מסמכים שפגו יופיעו באדום בלוח הבקרה הראשי.</p>
      </div>
    </div>
  )
}