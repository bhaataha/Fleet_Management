'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { materialsApi } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowRight, Save, Package } from 'lucide-react'
import Link from 'next/link'

const BILLING_UNITS = [
  { value: 'TON', label: 'טון' },
  { value: 'M3', label: 'מטר קוב' },
  { value: 'TRIP', label: 'נסיעה' },
  { value: 'KM', label: 'קילומטר' }
]

export default function NewMaterialPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    billing_unit: 'TON' as 'TON' | 'M3' | 'TRIP' | 'KM',
    description: '',
    is_active: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      await materialsApi.create(formData)
      router.push('/materials')
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'שגיאה ביצירת חומר'
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/materials"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">חומר חדש</h1>
            <p className="text-gray-600 mt-1">הוספת סוג חומר חדש למערכת</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                פרטי חומר
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שם החומר <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="עפר / חצץ / מצע / אספלט"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    לדוגמה: עפר, חצץ, מצע, חול, אספלט, פסולת בניין
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    יחידת חיוב <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.billing_unit}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      billing_unit: e.target.value as 'TON' | 'M3' | 'TRIP' | 'KM'
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {BILLING_UNITS.map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    יחידת המדידה לחישוב המחיר
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תיאור
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="פרטים נוספים על החומר..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">חומר פעיל</span>
              </label>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>טיפ:</strong> ניתן להגדיר מחירון ספציפי לחומר זה בדף "מחירונים"
              </p>
            </div>

            {/* Examples */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">דוגמאות נפוצות:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>• עפר - טון</div>
                <div>• חצץ - מטר קוב</div>
                <div>• מצע - טון</div>
                <div>• חול - מטר קוב</div>
                <div>• אספלט - טון</div>
                <div>• פסולת בניין - נסיעה</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
            <Link
              href="/materials"
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ביטול
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'שומר...' : 'שמור חומר'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
