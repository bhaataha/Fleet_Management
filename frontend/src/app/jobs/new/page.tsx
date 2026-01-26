'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Combobox from '@/components/ui/Combobox'
import { useI18n } from '@/lib/i18n'
import api from '@/lib/api'
import { ArrowLeft, MapPin, Package, Truck, DollarSign } from 'lucide-react'
import { billingUnitLabels } from '@/lib/utils'

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
  
  // Pricing preview
  const [pricingPreview, setPricingPreview] = useState<any>(null)
  const [loadingPricing, setLoadingPricing] = useState(false)

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

  // Filter sites: Always show general sites + customer sites if customer selected
  const availableSites = sites.filter(s => {
    // Always show general sites (no customer_id)
    if (!s.customer_id) return true
    // Show customer sites only if customer is selected and matches
    if (formData.customer_id && s.customer_id === parseInt(formData.customer_id)) return true
    return false
  })
    
  // Auto-calculate pricing when relevant fields change
  useEffect(() => {
    const fetchPricing = async () => {
      // Check if we have all required data for pricing
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
        console.error('Pricing fetch error:', error.response?.status, error.response?.data?.detail)
        // Silently fail for 404 (no price list found)
        if (error.response?.status !== 404) {
          console.error('Unexpected pricing API error:', error.message)
        }
        setPricingPreview(null)
      } finally {
        setLoadingPricing(false)
      }
    }
    
    // Debounce the API call
    const timer = setTimeout(fetchPricing, 500)
    return () => clearTimeout(timer)
  }, [formData.customer_id, formData.material_id, formData.from_site_id, formData.to_site_id, formData.unit, formData.planned_qty])

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
                  onChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    customer_id: value.toString(),
                    from_site_id: '', // Reset sites when customer changes
                    to_site_id: ''
                  }))}
                />
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
                <Combobox
                  label="מאתר"
                  required
                  placeholder="חפש אתר מקור..."
                  options={availableSites.map(s => ({
                    value: s.id,
                    label: s.name + (s.customer_id ? '' : ' 🏭'),
                    subLabel: s.address
                  }))}
                  value={formData.from_site_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, from_site_id: value.toString() }))}
                />
                <p className="text-xs text-gray-500 mt-1">🏭 = אתר כללי</p>
              </div>

              <div>
                <Combobox
                  label="לאתר"
                  required
                  placeholder="חפש אתר יעד..."
                  options={availableSites.map(s => ({
                    value: s.id,
                    label: s.name + (s.customer_id ? '' : ' 🏭'),
                    subLabel: s.address
                  }))}
                  value={formData.to_site_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, to_site_id: value.toString() }))}
                />
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
                  onChange={(value) => setFormData(prev => ({ ...prev, material_id: value.toString() }))}
                />
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

          {/* Pricing Preview */}
          {(pricingPreview || loadingPricing) && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                תצוגה מקדימה של מחיר
              </h3>
              
              {loadingPricing ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="mr-3 text-gray-600">מחשב מחיר...</span>
                </div>
              ) : pricingPreview ? (
                <div className="space-y-3">
                  {/* Base Price */}
                  <div className="flex justify-between items-center py-2 border-b border-blue-200">
                    <span className="text-gray-700">מחיר בסיס ({billingUnitLabels[pricingPreview.details?.unit || formData.unit] || pricingPreview.details?.unit || formData.unit})</span>
                    <span className="font-semibold text-gray-900">
                      ₪{Number(pricingPreview.details?.unit_price || 0).toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Quantity */}
                  <div className="flex justify-between items-center py-2 border-b border-blue-200">
                    <span className="text-gray-700">כמות</span>
                    <span className="font-semibold text-gray-900">
                      {pricingPreview.details?.quantity || formData.planned_qty} {billingUnitLabels[pricingPreview.details?.unit || formData.unit] || pricingPreview.details?.unit || formData.unit}
                    </span>
                  </div>
                  
                  {/* Subtotal (base amount before adjustments) */}
                  <div className="flex justify-between items-center py-2 border-b border-blue-200">
                    <span className="text-gray-700">סכום חלקי</span>
                    <span className="font-semibold text-gray-900">
                      ₪{Number(pricingPreview.base_amount || 0).toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Min Charge Adjustment */}
                  {pricingPreview.min_charge_adjustment && Number(pricingPreview.min_charge_adjustment) > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        ⚠️ תוספת חיוב מינימום: ₪{Number(pricingPreview.min_charge_adjustment).toFixed(2)}
                      </p>
                    </div>
                  )}
                  
                  {/* Wait Fee */}
                  {pricingPreview.wait_fee && Number(pricingPreview.wait_fee) > 0 && (
                    <div className="flex justify-between items-center py-1 pr-4">
                      <span className="text-sm text-gray-600">• דמי המתנה</span>
                      <span className="text-sm font-medium text-gray-900">
                        ₪{Number(pricingPreview.wait_fee).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {/* Night Surcharge */}
                  {pricingPreview.night_surcharge && Number(pricingPreview.night_surcharge) > 0 && (
                    <div className="flex justify-between items-center py-1 pr-4">
                      <span className="text-sm text-gray-600">• תוספת לילה</span>
                      <span className="text-sm font-medium text-gray-900">
                        ₪{Number(pricingPreview.night_surcharge).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {/* Total */}
                  <div className="flex justify-between items-center py-3 border-t-2 border-blue-300 mt-2">
                    <span className="text-lg font-bold text-gray-900">סה״כ לחיוב</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₪{Number(pricingPreview.total || 0).toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Info */}
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
                  לא נמצא מחירון מתאים - נא להוסיף מחירון למוצר/לקוח זה
                </div>
              )}
            </div>
          )}

          {/* Fleet Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-600" />
              שיבוץ צי (אופציונלי)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Combobox
                  label="נהג"
                  placeholder="חפש נהג..."
                  options={drivers.map(d => ({
                    value: d.id,
                    label: d.name,
                    subLabel: d.phone
                  }))}
                  value={formData.driver_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, driver_id: value.toString() }))}
                />
              </div>

              <div>
                <Combobox
                  label="משאית"
                  placeholder="חפש משאית..."
                  options={trucks.map(t => ({
                    value: t.id,
                    label: t.plate_number,
                    subLabel: t.model
                  }))}
                  value={formData.truck_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, truck_id: value.toString() }))}
                />
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
