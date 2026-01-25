'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { jobsApi, customersApi, sitesApi, materialsApi, driversApi, trucksApi } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { ArrowRight, Save, Trash2 } from 'lucide-react'
import type { Customer, Site, Material, Driver, Truck, BillingUnit, JobStatus } from '@/types'

export default function EditJobPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const jobId = parseInt(params.id as string)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      await jobsApi.update(jobId, {
        customer_id: parseInt(formData.customer_id),
        from_site_id: parseInt(formData.from_site_id),
        to_site_id: parseInt(formData.to_site_id),
        material_id: parseInt(formData.material_id),
        planned_qty: formData.planned_qty,
        unit: formData.unit,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
        driver_id: formData.driver_id ? parseInt(formData.driver_id) : undefined,
        truck_id: formData.truck_id ? parseInt(formData.truck_id) : undefined,
        status: formData.status,
        notes: formData.notes || undefined
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                לקוח <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">בחר לקוח</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מאתר <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.from_site_id}
                onChange={(e) => setFormData({ ...formData, from_site_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">בחר אתר מוצא</option>
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                לאתר <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.to_site_id}
                onChange={(e) => setFormData({ ...formData, to_site_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">בחר אתר יעד</option>
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Material and Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                חומר <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.material_id}
                onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">בחר חומר</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>{m.name_hebrew || m.name}</option>
                ))}
              </select>
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

          {/* Driver and Truck */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                נהג
              </label>
              <select
                value={formData.driver_id}
                onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ללא נהג</option>
                {drivers.filter(d => d.is_active).map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                משאית
              </label>
              <select
                value={formData.truck_id}
                onChange={(e) => setFormData({ ...formData, truck_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ללא משאית</option>
                {trucks.filter(t => t.is_active).map(t => (
                  <option key={t.id} value={t.id}>{t.plate_number}</option>
                ))}
              </select>
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
