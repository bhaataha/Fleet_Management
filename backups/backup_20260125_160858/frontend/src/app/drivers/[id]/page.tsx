'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { driversApi } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowRight, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function EditDriverPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const driverId = parseInt(params.id as string)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license_type: 'C',
    is_active: true
  })

  useEffect(() => {
    loadDriver()
  }, [driverId])

  const loadDriver = async () => {
    try {
      const response = await driversApi.get(driverId)
      const driver = response.data
      setFormData({
        name: driver.name || '',
        phone: driver.phone || '',
        license_type: driver.license_type || 'C',
        is_active: driver.is_active !== false
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load driver')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      await driversApi.update(driverId, formData)
      router.push('/drivers')
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to update driver'
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הנהג? פעולה זו בלתי הפיכה.')) {
      return
    }

    try {
      await driversApi.delete(driverId)
      router.push('/drivers')
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to delete driver'
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
              href="/drivers"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ערוך נהג</h1>
              <p className="text-gray-600 mt-1">עדכן פרטי נהג #{driverId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            מחק נהג
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
              {t('fleet.driverName')} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('fleet.phone')}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="050-1234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('fleet.licenseType')}
            </label>
            <select
              value={formData.license_type}
              onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="B">B - רכב פרטי</option>
              <option value="C">C - משאית בינונית</option>
              <option value="C1">C1 - משאית קטנה</option>
              <option value="C+E">C+E - משאית + נגרר</option>
              <option value="CE">CE - משאית כבדה + נגרר</option>
            </select>
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
              נהג פעיל
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
              href="/drivers"
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center font-medium"
            >
              {t('common.cancel')}
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
