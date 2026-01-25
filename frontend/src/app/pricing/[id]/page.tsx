'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { priceListsApi } from '@/lib/api'
import api from '@/lib/api'
import type { PriceList, PriceListCreate } from '@/types'
import { ArrowRight, DollarSign, MapPin, Calendar, AlertCircle } from 'lucide-react'

const BILLING_UNITS = [
  { value: 'TON', label: 'טון' },
  { value: 'M3', label: 'מטר מעוקב (מ״ק)' },
  { value: 'TRIP', label: 'נסיעה' },
  { value: 'KM', label: 'קילומטר' },
]

export default function EditPriceListPage() {
  const router = useRouter()
  const params = useParams()
  const priceListId = parseInt(params.id as string)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [priceList, setPriceList] = useState<PriceList | null>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    customer_id: '',
    material_id: '',
    from_site_id: '',
    to_site_id: '',
    unit: 'TON',
    base_price: '',
    min_charge: '',
    wait_fee_per_hour: '',
    night_surcharge_pct: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
  })

  // Load price list and reference data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [priceListRes, customersRes, materialsRes, sitesRes] = await Promise.all([
          priceListsApi.get(priceListId),
          api.get('/customers'),
          api.get('/materials'),
          api.get('/sites'),
        ])
        
        const pl = priceListRes.data
        setPriceList(pl)
        setCustomers(customersRes.data || [])
        setMaterials(materialsRes.data || [])
        setSites(sitesRes.data || [])
        
        // Populate form with existing data
        setFormData({
          customer_id: pl.customer_id?.toString() || '',
          material_id: pl.material_id.toString(),
          from_site_id: pl.from_site_id?.toString() || '',
          to_site_id: pl.to_site_id?.toString() || '',
          unit: pl.unit,
          base_price: pl.base_price.toString(),
          min_charge: pl.min_charge?.toString() || '',
          wait_fee_per_hour: pl.wait_fee_per_hour?.toString() || '',
          night_surcharge_pct: pl.night_surcharge_pct?.toString() || '',
          valid_from: pl.valid_from ? new Date(pl.valid_from).toISOString().split('T')[0] : '',
          valid_to: pl.valid_to ? new Date(pl.valid_to).toISOString().split('T')[0] : '',
        })
      } catch (err: any) {
        console.error('Failed to load price list:', err)
        setError('שגיאה בטעינת מחירון: ' + (err.response?.data?.detail || err.message))
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [priceListId])

  // Filter sites by selected customer
  const customerSites = formData.customer_id
    ? sites.filter(s => s.customer_id === parseInt(formData.customer_id))
    : sites

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear sites if customer changes
    if (name === 'customer_id') {
      setFormData(prev => ({
        ...prev,
        from_site_id: '',
        to_site_id: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!formData.material_id || parseInt(formData.material_id) <= 0) {
      setError('חובה לבחור חומר')
      return
    }
    
    if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
      setError('חובה להזין מחיר בסיס')
      return
    }
    
    try {
      setSaving(true)
      
      const payload: Partial<PriceListCreate> = {
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : undefined,
        material_id: parseInt(formData.material_id),
        from_site_id: formData.from_site_id ? parseInt(formData.from_site_id) : undefined,
        to_site_id: formData.to_site_id ? parseInt(formData.to_site_id) : undefined,
        unit: formData.unit as any,
        base_price: parseFloat(formData.base_price),
        min_charge: formData.min_charge ? parseFloat(formData.min_charge) : undefined,
        wait_fee_per_hour: formData.wait_fee_per_hour ? parseFloat(formData.wait_fee_per_hour) : undefined,
        night_surcharge_pct: formData.night_surcharge_pct ? parseFloat(formData.night_surcharge_pct) : undefined,
        valid_from: formData.valid_from,
        valid_to: formData.valid_to || undefined,
      }
      
      await priceListsApi.update(priceListId, payload)
      
      alert('המחירון עודכן בהצלחה!')
      router.push('/pricing')
    } catch (err: any) {
      console.error('Failed to update price list:', err)
      setError('שגיאה בעדכון מחירון: ' + (err.response?.data?.detail || err.message))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">טוען מחירון...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!priceList) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">מחירון לא נמצא</h2>
          <button
            onClick={() => router.push('/pricing')}
            className="text-blue-600 hover:underline"
          >
            חזור לרשימת מחירונים
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/pricing')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">עריכת מחירון #{priceListId}</h1>
            <p className="text-gray-600 mt-1">עדכן פרטי מחירון קיים</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-8">
          
          {/* Section 1: Basic Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
              <DollarSign className="w-5 h-5 text-blue-600" />
              הגדרות בסיס
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  לקוח
                  <span className="text-gray-400 font-normal mr-2">(השאר ריק למחירון כללי)</span>
                </label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">🌍 כללי - חל על כל הלקוחות</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  חומר <span className="text-red-500">*</span>
                </label>
                <select
                  name="material_id"
                  value={formData.material_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">בחר חומר</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name_hebrew || m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  יחידת חיוב <span className="text-red-500">*</span>
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {BILLING_UNITS.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Route (Optional) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
              <MapPin className="w-5 h-5 text-green-600" />
              מסלול (אופציונלי)
            </h3>
            <p className="text-sm text-gray-600">
              השאר ריק למחיר כללי לכל המסלולים, או בחר מסלול ספציפי למחיר יותר מדויק
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מאתר
                </label>
                <select
                  name="from_site_id"
                  value={formData.from_site_id}
                  onChange={handleChange}
                  disabled={!formData.customer_id}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100"
                >
                  <option value="">כל האתרים</option>
                  {customerSites.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {formData.customer_id && customerSites.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">אין אתרים ללקוח זה</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  לאתר
                </label>
                <select
                  name="to_site_id"
                  value={formData.to_site_id}
                  onChange={handleChange}
                  disabled={!formData.customer_id}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100"
                >
                  <option value="">כל האתרים</option>
                  {customerSites.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Pricing & Surcharges */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">
              תמחור ותוספות
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מחיר בסיס <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                  <span className="absolute left-3 top-2 text-gray-500">₪</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  חיוב מינימום
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    name="min_charge"
                    value={formData.min_charge}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00 (אופציונלי)"
                  />
                  <span className="absolute left-3 top-2 text-gray-500">₪</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  דמי המתנה לשעה
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    name="wait_fee_per_hour"
                    value={formData.wait_fee_per_hour}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00 (אופציונלי)"
                  />
                  <span className="absolute left-3 top-2 text-gray-500">₪</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תוספת לילה (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    max="100"
                    name="night_surcharge_pct"
                    value={formData.night_surcharge_pct}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0 (אופציונלי)"
                  />
                  <span className="absolute left-3 top-2 text-gray-500">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Validity Period */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
              <Calendar className="w-5 h-5 text-purple-600" />
              תקופת תוקף
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תוקף מתאריך <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="valid_from"
                  value={formData.valid_from}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תוקף עד תאריך
                  <span className="text-gray-400 font-normal mr-2">(אופציונלי)</span>
                </label>
                <input
                  type="date"
                  name="valid_to"
                  value={formData.valid_to}
                  onChange={handleChange}
                  min={formData.valid_from}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Audit Info */}
          {priceList.created_at && (
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <div className="grid grid-cols-2 gap-2">
                <div>נוצר: {new Date(priceList.created_at).toLocaleString('he-IL')}</div>
                {priceList.updated_at && (
                  <div>עודכן: {new Date(priceList.updated_at).toLocaleString('he-IL')}</div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/pricing')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {saving ? 'שומר...' : 'שמור שינויים'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
