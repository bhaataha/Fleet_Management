'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { sitesApi, customersApi } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowRight, Save, MapPin, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { Customer } from '@/types'

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
    name: '',
    customer_id: 0,
    address: '',
    lat: null as number | null,
    lng: null as number | null,
    opening_hours: '',
    contact_name: '',
    contact_phone: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [siteRes, customersRes] = await Promise.all([
        sitesApi.get(siteId),
        customersApi.list()
      ])
      
      const site = siteRes.data
      setFormData({
        name: site.name || '',
        customer_id: site.customer_id || 0,
        address: site.address || '',
        lat: site.lat || null,
        lng: site.lng || null,
        opening_hours: site.opening_hours || '',
        contact_name: site.contact_name || '',
        contact_phone: site.contact_phone || ''
      })
      
      setCustomers(customersRes.data)
    } catch (error) {
      console.error('Failed to load site:', error)
      alert('שגיאה בטעינת פרטי אתר')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.customer_id) {
      setError('יש לבחור לקוח')
      return
    }

    setSaving(true)

    try {
      await sitesApi.update(siteId, {
        ...formData,
        lat: formData.lat || undefined,
        lng: formData.lng || undefined,
      })
      alert('האתר עודכן בהצלחה!')
      router.push('/sites')
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'שגיאה בעדכון אתר'
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את האתר?')) return
    
    try {
      await sitesApi.delete(siteId)
      alert('האתר נמחק בהצלחה!')
      router.push('/sites')
    } catch (error) {
      console.error('Failed to delete site:', error)
      alert('שגיאה במחיקת האתר')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/sites"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">עריכת אתר</h1>
            <p className="text-gray-600 mt-1">עדכון פרטי אתר עבודה</p>
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
                <MapPin className="w-5 h-5" />
                פרטי אתר
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שם האתר <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="פרויקט 1 / אתר בניה צפון"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    לקוח <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: parseInt(e.target.value) })}
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    כתובת
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="רחוב הבנאים 45, תל אביב"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    קו רוחב (Latitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lat || ''}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="32.0853"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    קו אורך (Longitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lng || ''}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="34.7818"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שעות פעילות
                  </label>
                  <input
                    type="text"
                    value={formData.opening_hours}
                    onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                    placeholder="א׳-ה׳ 07:00-17:00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">איש קשר באתר</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שם
                  </label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="דוד לוי"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    טלפון
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="052-9876543"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              מחק אתר
            </button>
            
            <div className="flex items-center gap-3">
              <Link
                href="/sites"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ביטול
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'שומר...' : 'שמור שינויים'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
