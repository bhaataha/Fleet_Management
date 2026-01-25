'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useI18n } from '@/lib/i18n'
import api from '@/lib/api'
import { ArrowLeft, MapPin, Package, Truck } from 'lucide-react'

export default function NewJobPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customer_id: '',
    from_site_id: '',
    to_site_id: '',
    material_id: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    planned_qty: '',
    unit: 'TON',
    driver_id: '',
    truck_id: '',
    priority: 1,
    notes: ''
  })

  // Lists for autocomplete
  const [customers, setCustomers] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [trucks, setTrucks] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])

  // Load data for selects
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersRes, sitesRes, materialsRes, trucksRes, driversRes] = await Promise.all([
          api.get('/customers'),
          api.get('/sites'),
          api.get('/materials'),
          api.get('/trucks'),
          api.get('/drivers')
        ])
        setCustomers(customersRes.data || [])
        setSites(sitesRes.data || [])
        setMaterials(materialsRes.data || [])
        setTrucks(trucksRes.data || [])
        setDrivers(driversRes.data || [])
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }
    loadData()
  }, [])

  // Filter sites by selected customer
  const availableSites = formData.customer_id 
    ? sites.filter(s => s.customer_id === parseInt(formData.customer_id))
    : sites

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Convert date to datetime with default time
      const scheduledDateTime = new Date(formData.scheduled_date + 'T08:00:00').toISOString()
      
      const payload = {
        customer_id: parseInt(formData.customer_id),
        from_site_id: parseInt(formData.from_site_id),
        to_site_id: parseInt(formData.to_site_id),
        material_id: parseInt(formData.material_id),
        scheduled_date: scheduledDateTime,
        planned_qty: parseFloat(formData.planned_qty),
        unit: formData.unit,
        driver_id: formData.driver_id ? parseInt(formData.driver_id) : null,
        truck_id: formData.truck_id ? parseInt(formData.truck_id) : null,
        priority: formData.priority,
        notes: formData.notes || null
      }
      
      const response = await api.post('/jobs', payload)
      
      alert('נסיעה נוצרה בהצלחה!')
      router.push(`/jobs/${response.data.id}`)
    } catch (error: any) {
      console.error('Failed to create job:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'שגיאה ביצירת נסיעה'
      alert(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'priority' ? parseInt(value) : value
    }))
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">נסיעה חדשה</h1>
            <p className="text-gray-600 mt-1">צור נסיעה חדשה במערכת</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          {/* Customer & Sites */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              פרטי הנסיעה
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  לקוח *
                </label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                  תאריך מתוכנן *
                </label>
                <input
                  type="date"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מאתר *
                </label>
                <select
                  name="from_site_id"
                  value={formData.from_site_id}
                  onChange={handleChange}
                  required
                  disabled={!formData.customer_id}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100"
                >
                  <option value="">בחר אתר מקור</option>
                  {availableSites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
                {!formData.customer_id && (
                  <p className="text-xs text-gray-500 mt-1">תחילה בחר לקוח</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  לאתר *
                </label>
                <select
                  name="to_site_id"
                  value={formData.to_site_id}
                  onChange={handleChange}
                  required
                  disabled={!formData.customer_id}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100"
                >
                  <option value="">בחר אתר יעד</option>
                  {availableSites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
                {!formData.customer_id && (
                  <p className="text-xs text-gray-500 mt-1">תחילה בחר לקוח</p>
                )}
              </div>
            </div>
          </div>

          {/* Material & Quantity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              חומר וכמות
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  חומר *
                </label>
                <select
                  name="material_id"
                  value={formData.material_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">בחר חומר</option>
                  {materials.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.name_hebrew || material.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  כמות מתוכננת *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="planned_qty"
                  value={formData.planned_qty}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  יחידה *
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="TON">טון</option>
                  <option value="M3">מ״ק</option>
                  <option value="TRIP">נסיעה</option>
                  <option value="KM">ק״מ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fleet Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-600" />
              שיבוץ צי (אופציונלי)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  נהג
                </label>
                <select
                  name="driver_id"
                  value={formData.driver_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">בחר נהג (אופציונלי)</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  משאית
                </label>
                <select
                  name="truck_id"
                  value={formData.truck_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">בחר משאית (אופציונלי)</option>
                  {trucks.map(truck => (
                    <option key={truck.id} value={truck.id}>
                      {truck.plate_number} {truck.model && `- ${truck.model}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Priority & Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">עדיפות והערות</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  עדיפות
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="1">רגילה</option>
                  <option value="2">גבוהה</option>
                  <option value="3">דחופה</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                הערות
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="הערות נוספות..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'שומר...' : 'צור נסיעה'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
