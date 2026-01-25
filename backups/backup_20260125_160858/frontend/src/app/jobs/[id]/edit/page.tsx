'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { jobsApi, customersApi, sitesApi, materialsApi, driversApi, trucksApi } from '@/lib/api'
import api from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Combobox from '@/components/ui/Combobox'
import { ArrowRight, Save, Trash2, DollarSign } from 'lucide-react'
import type { Customer, Site, Material, Driver, Truck, BillingUnit, JobStatus } from '@/types'

export default function EditJobPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const jobId = parseInt(params.id as string)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Pricing preview
  const [pricingPreview, setPricingPreview] = useState<any>(null)
  const [loadingPricing, setLoadingPricing] = useState(false)
  
  // Data lists
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  
  // Form data
  const [formData, setFormData] = useState({
    customer_id: '',
    from_site_id: '',
    to_site_id: '',
    material_id: '',
    planned_qty: '',
    unit: 'TON' as BillingUnit,
    scheduled_date: new Date().toISOString().split('T')[0],
    driver_id: '',
    truck_id: '',
    status: 'PLANNED' as JobStatus,
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [jobRes, customersRes, sitesRes, materialsRes, driversRes, trucksRes] = await Promise.all([
        jobsApi.get(jobId),
        customersApi.getAll(),
        sitesApi.getAll(),
        materialsApi.getAll(),
        driversApi.getAll(),
        trucksApi.getAll(),
      ])
      
      const job = jobRes.data
      setFormData({
        customer_id: job.customer_id?.toString() || '',
        from_site_id: job.from_site_id?.toString() || '',
        to_site_id: job.to_site_id?.toString() || '',
        material_id: job.material_id?.toString() || '',
        planned_qty: job.planned_qty?.toString() || '',
        unit: job.unit || 'TON',
        scheduled_date: job.scheduled_date ? new Date(job.scheduled_date).toISOString().split('T')[0] : '',
        driver_id: job.driver_id?.toString() || '',
        truck_id: job.truck_id?.toString() || '',
        status: job.status || 'PLANNED',
        notes: job.notes || ''
      })
      
      setCustomers(customersRes.data)
      setSites(sitesRes.data)
      setMaterials(materialsRes.data)
      setDrivers(driversRes.data)
      setTrucks(trucksRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
      alert('שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }
  
  // Auto-calculate pricing when relevant fields change
  useEffect(() => {
    const fetchPricing = async () => {
      if (!formData.customer_id || !formData.material_id || !formData.planned_qty) {
        setPricingPreview(null)
        return
      }
      
      try {
        setLoadingPricing(true)
        const response = await api.post('/pricing/quote', {
          customer_id: parseInt(formData.customer_id),
          material_id: parseInt(formData.material_id),
          from_site_id: formData.from_site_id ? parseInt(formData.from_site_id) : null,
          to_site_id: formData.to_site_id ? parseInt(formData.to_site_id) : null,
          unit: formData.unit,
          quantity: parseFloat(formData.planned_qty),
          wait_hours: 0,
          is_night: false
        })
        setPricingPreview(response.data)
      } catch (error: any) {
        console.error('Failed to fetch pricing:', error.response?.status, error.response?.data)
        // Only show error if it's not a "no price list found" error
        if (error.response?.status !== 404) {
          console.error('Pricing API error:', error.message)
        }
        setPricingPreview(null)
      } finally {
        setLoadingPricing(false)
      }
    }
    
    const timer = setTimeout(fetchPricing, 500)
    return () => clearTimeout(timer)
  }, [formData.customer_id, formData.material_id, formData.from_site_id, formData.to_site_id, formData.unit, formData.planned_qty])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      await jobsApi.update(jobId, {
        customer_id: parseInt(formData.customer_id),
        from_site_id: parseInt(formData.from_site_id),
        to_site_id: parseInt(formData.to_site_id),
        material_id: parseInt(formData.material_id),
        planned_qty: parseFloat(formData.planned_qty),
        unit: formData.unit,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
        driver_id: formData.driver_id ? parseInt(formData.driver_id) : null,
        truck_id: formData.truck_id ? parseInt(formData.truck_id) : null,
        status: formData.status,
        notes: formData.notes || null
      })
      
      alert('הנסיעה עודכנה בהצלחה!')
      router.push(`/jobs/${jobId}`)
    } catch (error) {
      console.error('Failed to update job:', error)
      alert('שגיאה בעדכון הנסיעה')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הנסיעה?')) return
    
    try {
      await jobsApi.delete(jobId)
      alert('הנסיעה נמחקה בהצלחה!')
      router.push('/jobs')
    } catch (error) {
      console.error('Failed to delete job:', error)
      alert('שגיאה במחיקת הנסיעה')
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">עריכת נסיעה #{jobId}</h1>
              <p className="text-gray-600 text-sm mt-1">עדכן פרטי הנסיעה</p>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            מחק נסיעה
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Customer and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Combobox
                label="לקוח"
                required
                placeholder="חפש לקוח..."
                options={customers.map(c => ({
                  value: c.id,
                  label: c.name,
                  subLabel: c.vat_id || c.contact_name
                }))}
                value={formData.customer_id}
                onChange={(value) => setFormData({ ...formData, customer_id: value.toString() })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תאריך <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Route */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Combobox
                label="מאתר"
                required
                placeholder="חפש אתר מוצא..."
                options={sites.map(s => ({
                  value: s.id,
                  label: s.name,
                  subLabel: s.address
                }))}
                value={formData.from_site_id}
                onChange={(value) => setFormData({ ...formData, from_site_id: value.toString() })}
              />
            </div>

            <div>
              <Combobox
                label="לאתר"
                required
                placeholder="חפש אתר יעד..."
                options={sites.map(s => ({
                  value: s.id,
                  label: s.name,
                  subLabel: s.address
                }))}
                value={formData.to_site_id}
                onChange={(value) => setFormData({ ...formData, to_site_id: value.toString() })}
              />
            </div>
          </div>

          {/* Material and Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Combobox
                label="חומר"
                required
                placeholder="חפש חומר..."
                options={materials.map(m => ({
                  value: m.id,
                  label: m.name_hebrew || m.name,
                  subLabel: m.billing_unit
                }))}
                value={formData.material_id}
                onChange={(value) => setFormData({ ...formData, material_id: value.toString() })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כמות <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.planned_qty}
                onChange={(e) => setFormData({ ...formData, planned_qty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                יחידה <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as BillingUnit })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="TON">טון</option>
                <option value="M3">מ״ק</option>
                <option value="TRIP">נסיעה</option>
                <option value="KM">ק״מ</option>
              </select>
            </div>
          </div>

          {/* Pricing Preview */}
          {(pricingPreview || loadingPricing) && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                מחיר משוער
              </h3>
              
              {loadingPricing ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="mr-3 text-gray-600">מחשב מחיר...</span>
                </div>
              ) : pricingPreview ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-blue-200">
                    <span className="text-gray-700">מחיר בסיס ({pricingPreview.details?.unit || formData.unit})</span>
                    <span className="font-semibold text-gray-900">
                      ₪{Number(pricingPreview.details?.unit_price || 0).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-blue-200">
                    <span className="text-gray-700">כמות</span>
                    <span className="font-semibold text-gray-900">
                      {pricingPreview.details?.quantity || formData.planned_qty} {pricingPreview.details?.unit || formData.unit}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-blue-200">
                    <span className="text-gray-700">סכום חלקי</span>
                    <span className="font-semibold text-gray-900">
                      ₪{Number(pricingPreview.base_amount || 0).toFixed(2)}
                    </span>
                  </div>
                  
                  {pricingPreview.min_charge_adjustment && Number(pricingPreview.min_charge_adjustment) > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        ⚠️ תוספת חיוב מינימום: ₪{Number(pricingPreview.min_charge_adjustment).toFixed(2)}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-3 border-t-2 border-blue-300 mt-2">
                    <span className="text-lg font-bold text-gray-900">סה״כ לחיוב</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₪{Number(pricingPreview.total || 0).toFixed(2)}
                    </span>
                  </div>
                  
                  {pricingPreview.details && (
                    <div className="text-xs text-gray-500 pt-2">
                      מחושב לפי מחירון #{pricingPreview.details.price_list_id}
                      {pricingPreview.details.is_customer_specific && ' (ספציפי ללקוח)'}
                      {pricingPreview.details.is_route_specific && ' (ספציפי למסלול)'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  לא נמצא מחירון מתאים
                </div>
              )}
            </div>
          )}

          {/* Driver and Truck */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Combobox
                label="נהג"
                placeholder="חפש נהג..."
                options={drivers.filter(d => d.is_active).map(d => ({
                  value: d.id,
                  label: d.name,
                  subLabel: d.phone
                }))}
                value={formData.driver_id}
                onChange={(value) => setFormData({ ...formData, driver_id: value.toString() })}
              />
            </div>

            <div>
              <Combobox
                label="משאית"
                placeholder="חפש משאית..."
                options={trucks.filter(t => t.is_active).map(t => ({
                  value: t.id,
                  label: t.plate_number,
                  subLabel: t.model
                }))}
                value={formData.truck_id}
                onChange={(value) => setFormData({ ...formData, truck_id: value.toString() })}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סטטוס <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as JobStatus })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="PLANNED">מתוכנן</option>
              <option value="ASSIGNED">משובץ</option>
              <option value="ENROUTE_PICKUP">בדרך לטעינה</option>
              <option value="LOADED">נטען</option>
              <option value="ENROUTE_DROPOFF">בדרך לפריקה</option>
              <option value="DELIVERED">נמסר</option>
              <option value="CLOSED">סגור</option>
              <option value="CANCELED">מבוטל</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              הערות
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="הערות נוספות לנסיעה..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'שומר...' : 'שמור שינויים'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
