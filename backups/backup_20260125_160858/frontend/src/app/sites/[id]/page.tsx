'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { sitesApi, customersApi } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowRight, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { Site, Customer } from '@/types'

export default function EditSitePage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const siteId = parseInt(params.id as string)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [formData, setFormData] = useState({
    customer_id: '',
    name: '',
    address: '',
    contact_name: '',
    contact_phone: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [siteId])

  const loadData = async () => {
    try {
      const [siteRes, customersRes] = await Promise.all([
        sitesApi.get(siteId),
        customersApi.getAll()
      ])
      
      const site = siteRes.data
      setFormData({
        customer_id: site.customer_id?.toString() || '',
        name: site.name || '',
        address: site.address || '',
        contact_name: site.contact_name || '',
        contact_phone: site.contact_phone || '',
        notes: site.notes || ''
      })
      setCustomers(customersRes.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load site')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      await sitesApi.update(siteId, {
        ...formData,
        customer_id: parseInt(formData.customer_id)
      })
      router.push('/sites')
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to update site'
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את האתר? פעולה זו בלתי הפיכה.')) {
      return
    }

    try {
      await sitesApi.delete(siteId)
      router.push('/sites')
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to delete site'
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
              href="/sites"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ערוך אתר</h1>
              <p className="text-gray-600 mt-1">עדכן פרטי אתר #{siteId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            מחק אתר
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
              {t('sites.customer')} *
            </label>
            <select
              required
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">בחר לקוח</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('sites.name')} *
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
              {t('sites.address')}
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('sites.contactName')}
            </label>
            <input
              type="text"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('sites.contactPhone')}
            </label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('sites.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
              href="/sites"
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
