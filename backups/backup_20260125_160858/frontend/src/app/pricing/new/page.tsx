'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useI18n } from '@/lib/i18n'
import { priceListsApi, customersApi, materialsApi, sitesApi } from '@/lib/api'
import { ArrowRight, Save, DollarSign, Calendar, MapPin } from 'lucide-react'
import type { Customer, Material, Site, BillingUnit } from '@/types'
import Link from 'next/link'

const BILLING_UNITS: { value: BillingUnit; label: string }[] = [
  { value: 'TON', label: 'טון' },
  { value: 'M3', label: 'מטר מעוקב (מ״ק)' },
  { value: 'TRIP', label: 'נסיעה' },
  { value: 'KM', label: 'קילומטר' },
]

export default function NewPriceListPage() {
  const router = useRouter()
  const { t } = useI18n()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    customer_id: undefined as number | undefined,
    material_id: 0,
    from_site_id: undefined as number | undefined,
    to_site_id: undefined as number | undefined,
    unit: 'TON' as BillingUnit,
    base_price: '',
    min_charge: '',
    wait_fee_per_hour: '',
    night_surcharge_pct: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [customersRes, materialsRes, sitesRes] = await Promise.all([
        customersApi.getAll(),
        materialsApi.getAll(),
        sitesApi.getAll(),
      ])
      setCustomers(customersRes.data)
      setMaterials(materialsRes.data)
      setSites(sitesRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
      setError('שגיאה בטעינת נתונים')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.material_id) {
      setError('יש לבחור חומר')
      return
    }

    if (!formData.base_price || Number(formData.base_price) <= 0) {
      setError('יש להזין מחיר בסיס תקין')
      return
    }

    setSaving(true)

    try {
      const payload = {
        customer_id: formData.customer_id || undefined,
        material_id: formData.material_id,
        from_site_id: formData.from_site_id || undefined,
        to_site_id: formData.to_site_id || undefined,
        unit: formData.unit,
        base_price: Number(formData.base_price),
        min_charge: formData.min_charge ? Number(formData.min_charge) : undefined,
        wait_fee_per_hour: formData.wait_fee_per_hour ? Number(formData.wait_fee_per_hour) : undefined,
        night_surcharge_pct: formData.night_surcharge_pct ? Number(formData.night_surcharge_pct) : undefined,
        valid_from: formData.valid_from,
        valid_to: formData.valid_to || undefined,
      }

      await priceListsApi.create(payload)
      router.push('/pricing')
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'שגיאה ביצירת מחירון'
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    } finally {
      setSaving(false)
    }
  }

  // Get filtered sites by customer
  const customerSites = formData.customer_id
    ? sites.filter(s => s.customer_id === formData.customer_id)
    : sites

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">מחירון חדש</h1>
            <p className="text-gray-600 mt-1">הגדרת מחיר לחומר ומסלול</p>
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

            {/* Customer Selection */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                הגדרות בסיסיות
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    לקוח
                  </label>
                  <select
                    value={formData.customer_id || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      customer_id: e.target.value ? Number(e.target.value) : undefined,
                      from_site_id: undefined,
                      to_site_id: undefined,
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">🌍 כללי - חל על כל הלקוחות</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    מחירון ללקוח ספציפי תמיד עדיף על מחירון כללי
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    חומר <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.material_id}
                    onChange={(e) => setFormData({ ...formData, material_id: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>בחר חומר</option>
                    {materials.map(material => (
                      <option key={material.id} value={material.id}>
                        {material.name_hebrew || material.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    יחידת חיוב <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as BillingUnit })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {BILLING_UNITS.map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Route Selection */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                מסלול (אופציונלי)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    אתר מקור
                  </label>
                  <select
                    value={formData.from_site_id || ''}
                    onChange={(e) => setFormData({ ...formData, from_site_id: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">כל האתרים</option>
                    {customerSites.map(site => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    אתר יעד
                  </label>
                  <select
                    value={formData.to_site_id || ''}
                    onChange={(e) => setFormData({ ...formData, to_site_id: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">כל האתרים</option>
                    {customerSites.map(site => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                השאר ריק אם המחיר חל על כל המסלולים
              </p>
            </div>

            {/* Pricing */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">מחירים ותוספות</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    מחיר בסיס <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="absolute left-3 top-2.5 text-gray-500">₪</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    מינימום חיוב
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.min_charge}
                      onChange={(e) => setFormData({ ...formData, min_charge: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="absolute left-3 top-2.5 text-gray-500">₪</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תוספת המתנה לשעה
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.wait_fee_per_hour}
                      onChange={(e) => setFormData({ ...formData, wait_fee_per_hour: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="absolute left-3 top-2.5 text-gray-500">₪</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תוספת לילה (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={formData.night_surcharge_pct}
                      onChange={(e) => setFormData({ ...formData, night_surcharge_pct: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="absolute left-3 top-2.5 text-gray-500">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Validity Period */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                תוקף
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תחילת תוקף <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    סיום תוקף
                  </label>
                  <input
                    type="date"
                    value={formData.valid_to}
                    onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                    min={formData.valid_from}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    השאר ריק למחירון ללא תאריך סיום
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">💡 הסבר:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>מחיר בסיס</strong> - המחיר ליחידה (טון/מ״ק/נסיעה/ק״מ)</li>
                <li>• <strong>מינימום חיוב</strong> - סכום מינימלי לנסיעה, גם אם הכמות קטנה יותר</li>
                <li>• <strong>תוספת המתנה</strong> - תוספת עבור זמן המתנה מעבר לסף מוגדר</li>
                <li>• <strong>תוספת לילה</strong> - אחוז תוספת לנסיעות בשעות לילה</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
            <Link
              href="/pricing"
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
              {saving ? 'שומר...' : 'שמור מחירון'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
