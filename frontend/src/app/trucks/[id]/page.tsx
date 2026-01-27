'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { trucksApi } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DocumentManager from '@/components/fleet/DocumentManager'
import { useVehicleTypes } from '@/hooks/useVehicleTypes'
import { ArrowRight, Save, Trash2, Shield, Wrench } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function EditTruckPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const { getVehicleTypeOptions, getVehicleTypeLabel, loading: vehicleTypesLoading } = useVehicleTypes()
  const truckId = parseInt(params.id as string)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    plate_number: '',
    model: '',
    truck_type: '',
    capacity_ton: '',
    capacity_m3: '',
    insurance_expiry: '',
    test_expiry: '',
    is_active: true
  })

  const [documents, setDocuments] = useState([
    { id: 1, name: 'ביטוח חובה 2024', type: 'insurance' as const, expiry_date: '2024-12-31', notes: 'מנורה מבטחים' },
    { id: 2, name: 'טסט תקני 2024', type: 'test' as const, expiry_date: '2024-06-15', notes: 'עבר בהצלחה' },
    { id: 3, name: 'רישוי רכב', type: 'registration' as const, expiry_date: '2024-11-20', notes: 'משרד התחבורה' }
  ])

  useEffect(() => {
    loadTruck()
  }, [truckId])

  const loadTruck = async () => {
    try {
      const response = await trucksApi.get(truckId)
      const truck = response.data
      setFormData({
        plate_number: truck.plate_number || '',
        model: truck.model || '',
        truck_type: truck.truck_type || '',
        capacity_ton: truck.capacity_ton?.toString() || '',
        capacity_m3: truck.capacity_m3?.toString() || '',
        insurance_expiry: truck.insurance_expiry || '',
        test_expiry: truck.test_expiry || '',
        is_active: truck.is_active !== false
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load truck')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      await trucksApi.update(truckId, {
        ...formData,
        capacity_ton: formData.capacity_ton ? parseFloat(formData.capacity_ton) : undefined,
        capacity_m3: formData.capacity_m3 ? parseFloat(formData.capacity_m3) : undefined,
      })
      router.push('/fleet')
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to update truck'
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המשאית? פעולה זו בלתי הפיכה.')) {
      return
    }

    try {
      await trucksApi.delete(truckId)
      router.push('/fleet')
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to delete truck'
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">{t('common.loading')}</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/fleet"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ערוך משאית</h1>
              <p className="text-gray-600 mt-1">עדכן פרטי משאית #{truckId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            מחק משאית
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('fleet.plateNumber')} *
            </label>
            <input
              type="text"
              required
              value={formData.plate_number}
              onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="12-345-67"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('fleet.model')}
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="מרצדס, וולוו, סקניה..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סוג רכב
            </label>
            <select
              value={formData.truck_type}
              onChange={(e) => setFormData({ ...formData, truck_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={vehicleTypesLoading}
            >
              <option value="">בחר סוג משאית</option>
              {getVehicleTypeOptions().map(type => (
                <option key={type.value} value={type.value} title={type.description}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fleet.capacityTon')}
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.capacity_ton}
                onChange={(e) => setFormData({ ...formData, capacity_ton: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="30.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fleet.capacityM3')}
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.capacity_m3}
                onChange={(e) => setFormData({ ...formData, capacity_m3: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="20.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                תוקף ביטוח
              </label>
              <input
                type="date"
                value={formData.insurance_expiry}
                onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {formData.insurance_expiry && (
                <p className="text-xs text-gray-600 mt-1">
                  פג בתאריך: {formatDate(formData.insurance_expiry)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-green-500" />
                תוקף טסט
              </label>
              <input
                type="date"
                value={formData.test_expiry}
                onChange={(e) => setFormData({ ...formData, test_expiry: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {formData.test_expiry && (
                <p className="text-xs text-gray-600 mt-1">
                  פג בתאריך: {formatDate(formData.test_expiry)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              משאית פעילה
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Save className="w-5 h-5" />
              {saving ? t('common.saving') : t('common.save')}
            </button>
            <Link
              href="/fleet"
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center font-medium"
            >
              {t('common.cancel')}
            </Link>
          </div>
        </form>
      </div>

      {/* Document Management Section */}
      <DocumentManager
        entityType="truck"
        entityId={truckId}
        entityName={formData.plate_number}
        documents={documents}
        onDocumentAdd={(doc) => {
          const newDoc = { ...doc, id: Date.now() }
          setDocuments([...documents, newDoc])
        }}
        onDocumentUpdate={(id, updatedDoc) => {
          setDocuments(documents.map(doc => 
            doc.id === id ? { ...doc, ...updatedDoc } : doc
          ))
        }}
        onDocumentDelete={(id) => {
          setDocuments(documents.filter(doc => doc.id !== id))
        }}
      />

    </DashboardLayout>
  )
}
