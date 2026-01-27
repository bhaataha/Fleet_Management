'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import api from '@/lib/api'

interface QuickAddSiteModalProps {
  show: boolean
  customerId?: number
  onSuccess: (site: any) => void
  onCancel: () => void
}

export default function QuickAddSiteModal({ 
  show, 
  customerId, 
  onSuccess, 
  onCancel 
}: QuickAddSiteModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    customer_id: customerId || null,
    site_type: customerId ? 'customer_project' : 'general',
    is_generic: !customerId,
    contact_name: '',
    contact_phone: ''
  })

  if (!show) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const response = await api.post('/sites', {
        ...formData,
        customer_id: formData.is_generic ? null : formData.customer_id
      })
      
      onSuccess(response.data)
    } catch (error: any) {
      console.error('Failed to create site:', error)
      alert(error.response?.data?.detail || 'שגיאה ביצירת אתר')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">🏗️ הוספת אתר מהירה</h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם האתר *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="לדוגמה: פרויקט רמת גן"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              כתובת *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="רחוב, עיר"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {!customerId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_generic}
                  onChange={(e) => setFormData({
                    ...formData,
                    is_generic: e.target.checked,
                    site_type: e.target.checked ? 'general' : 'customer_project',
                    customer_id: e.target.checked ? null : formData.customer_id
                  })}
                  className="mt-1"
                />
                <div>
                  <span className="font-medium text-gray-900">🏭 אתר כללי</span>
                  <p className="text-xs text-gray-600 mt-1">
                    אתר שאינו משויך ללקוח ספציפי (מחצבה, תחנת דלק, מזבלה)
                  </p>
                </div>
              </label>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                איש קשר
              </label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="שם"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                טלפון
              </label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="050-1234567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 font-medium"
            >
              {loading ? '⏳ שומר...' : '💾 שמור והמשך'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
