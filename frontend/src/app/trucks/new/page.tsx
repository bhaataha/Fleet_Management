'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { trucksApi } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowRight, Save, Truck } from 'lucide-react'
import Link from 'next/link'

import { useVehicleTypes } from '@/hooks/useVehicleTypes'

export default function NewTruckPage() {
  const router = useRouter()
  const { t } = useI18n()
  const { getVehicleTypeOptions, loading: vehicleTypesLoading } = useVehicleTypes()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    plate_number: '',
    model: '',
    truck_type: '',
    capacity_ton: null as number | null,
    capacity_m3: null as number | null,
    is_active: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      await trucksApi.create({
        ...formData,
        capacity_ton: formData.capacity_ton || undefined,
        capacity_m3: formData.capacity_m3 || undefined,
      })
      router.push('/fleet')
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'שגיאה ביצירת משאית'
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
            href="/fleet"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">משאית חדשה</h1>
            <p className="text-gray-600 mt-1">הוספת משאית לצי</p>
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
                <Truck className="w-5 h-5" />
                פרטי משאית
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    מספר רישוי <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.plate_number}
                    onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                    placeholder="12-345-67"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    דגם
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="מרצדס אקטרוס"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    סוג משאית
                  </label>
                  <select
                    value={formData.truck_type}
                    onChange={(e) => setFormData({ ...formData, truck_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={vehicleTypesLoading}
                  >
                    <option value="">
                      {vehicleTypesLoading ? 'טוען סוגי רכב...' : 'בחר סוג משאית'}
                    </option>
                    {getVehicleTypeOptions().map(type => (
                      <option key={type.value} value={type.value} title={type.description}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    קיבולת (טון)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.capacity_ton || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      capacity_ton: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                    placeholder="25"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    קיבולת (מ"ק)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.capacity_m3 || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      capacity_m3: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                    placeholder="15"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <span className="text-sm font-medium text-gray-700">משאית פעילה</span>
              </label>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>טיפ:</strong> ניתן להוסיף פרטי ביטוח וטסט בעריכת המשאית לאחר השמירה
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
            <Link
              href="/fleet"
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
              {saving ? 'שומר...' : 'שמור משאית'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
