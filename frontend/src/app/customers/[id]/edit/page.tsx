'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { customersApi } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowRight, Save, Building2, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function EditCustomerPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const customerId = parseInt(params.id as string)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    vat_id: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    payment_terms: 'Net 30',
    is_active: true
  })

  useEffect(() => {
    loadCustomer()
  }, [])

  const loadCustomer = async () => {
    try {
      const response = await customersApi.get(customerId)
      const customer = response.data
      setFormData({
        name: customer.name || '',
        vat_id: customer.vat_id || '',
        contact_name: customer.contact_name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        payment_terms: customer.payment_terms || 'Net 30',
        is_active: customer.is_active !== undefined ? customer.is_active : true
      })
    } catch (error) {
      console.error('Failed to load customer:', error)
      alert('שגיאה בטעינת פרטי לקוח')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      await customersApi.update(customerId, formData)
      alert('הלקוח עודכן בהצלחה!')
      router.push('/customers')
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'שגיאה בעדכון לקוח'
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הלקוח?')) return
    
    try {
      await customersApi.delete(customerId)
      alert('הלקוח נמחק בהצלחה!')
      router.push('/customers')
    } catch (error) {
      console.error('Failed to delete customer:', error)
      alert('שגיאה במחיקת הלקוח')
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
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/customers"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">עריכת לקוח</h1>
            <p className="text-gray-600 mt-1">עדכון פרטי לקוח</p>
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
                <Building2 className="w-5 h-5" />
                פרטי לקוח
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שם החברה <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="שם החברה"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ח.פ / ע.מ
                  </label>
                  <input
                    type="text"
                    value={formData.vat_id}
                    onChange={(e) => setFormData({ ...formData, vat_id: e.target.value })}
                    placeholder="123456789"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תנאי תשלום
                  </label>
                  <select
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="Net 7">תשלום מיידי (7 ימים)</option>
                    <option value="Net 14">שבועיים (14 ימים)</option>
                    <option value="Net 30">30 יום</option>
                    <option value="Net 45">45 יום</option>
                    <option value="Net 60">60 יום</option>
                    <option value="Net 90">90 יום</option>
                    <option value="COD">תשלום במזומן בעת אספקה</option>
                    <option value="Prepaid">תשלום מראש</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">איש קשר</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שם
                  </label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="יוסי כהן"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    טלפון
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="050-1234567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    אימייל
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@company.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    כתובת
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="רחוב הראשי 123, תל אביב"
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
                <span className="text-sm font-medium text-gray-700">לקוח פעיל</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between rounded-b-lg">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              מחק לקוח
            </button>
            
            <div className="flex items-center gap-3">
              <Link
                href="/customers"
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
