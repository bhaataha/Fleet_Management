'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Combobox from '@/components/ui/Combobox'
import QuickAddSiteModal from '@/components/modals/QuickAddSiteModal'
import QuickAddCustomerModal from '@/components/modals/QuickAddCustomerModal'
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
    assignment_type: 'driver', // 'driver' or 'subcontractor'
    driver_id: '',
    truck_id: '',
    subcontractor_id: '',
    priority: 1,
    notes: '',
    manual_override_total: undefined as number | undefined,
    manual_override_reason: ''
  })

  // Lists for autocomplete
  const [customers, setCustomers] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [trucks, setTrucks] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [subcontractors, setSubcontractors] = useState<any[]>([])
  
  // Modals
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false)
  const [showQuickAddSite, setShowQuickAddSite] = useState(false)
  
  // Pricing preview
  const [pricingPreview, setPricingPreview] = useState<any>(null)
  const [loadingPricing, setLoadingPricing] = useState(false)
  const [subcontractorPricing, setSubcontractorPricing] = useState<any>(null)
  const [loadingSubcontractorPricing, setLoadingSubcontractorPricing] = useState(false)
  
  // Manual pricing
  const [manualPricingEnabled, setManualPricingEnabled] = useState(false)
  const [manualPrice, setManualPrice] = useState('')
  const [overrideReason, setOverrideReason] = useState('')

  // Load data for selects
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersRes, sitesRes, materialsRes, trucksRes, driversRes, subcontractorsRes] = await Promise.all([
          api.get('/customers'),
          api.get('/sites'),
          api.get('/materials'),
          api.get('/trucks'),
          api.get('/drivers'),
          api.get('/subcontractors')
        ])
        setCustomers(customersRes.data || [])
        setSites(sitesRes.data || [])
        setMaterials(materialsRes.data || [])
        setTrucks(trucksRes.data || [])
        setDrivers(driversRes.data || [])
        setSubcontractors(subcontractorsRes.data || [])
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

  // Auto-calculate subcontractor pricing when subcontractor is selected
  useEffect(() => {
    const fetchSubcontractorPricing = async () => {
      if (formData.assignment_type !== 'subcontractor' || !formData.subcontractor_id || !formData.planned_qty) {
        setSubcontractorPricing(null)
        return
      }
      
      try {
        setLoadingSubcontractorPricing(true)
        const response = await api.post(`/subcontractors/${formData.subcontractor_id}/pricing-preview`, {
          qty: parseFloat(formData.planned_qty),
          unit: formData.unit
        })
        setSubcontractorPricing(response.data)
      } catch (error: any) {
        console.error('Subcontractor pricing fetch error:', error)
        setSubcontractorPricing(null)
      } finally {
        setLoadingSubcontractorPricing(false)
      }
    }
    
    const timer = setTimeout(fetchSubcontractorPricing, 500)
    return () => clearTimeout(timer)
  }, [formData.subcontractor_id, formData.planned_qty, formData.unit, formData.assignment_type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate manual pricing if enabled
    if (manualPricingEnabled) {
      if (!manualPrice || parseFloat(manualPrice) <= 0) {
        alert('נא להזין מחיר ידני תקין')
        return
      }
    }
    
    try {
      setLoading(true)
      
      // Convert date to datetime with fixed time at noon UTC to avoid timezone issues
      const scheduledDateTime = formData.scheduled_date + 'T12:00:00Z'
      
      const payload: any = {
        customer_id: parseInt(formData.customer_id),
        from_site_id: parseInt(formData.from_site_id),
        to_site_id: parseInt(formData.to_site_id),
        material_id: parseInt(formData.material_id),
        scheduled_date: scheduledDateTime,
        planned_qty: parseFloat(formData.planned_qty),
        unit: formData.unit,
        driver_id: formData.assignment_type === 'driver' && formData.driver_id ? parseInt(formData.driver_id) : null,
        truck_id: formData.assignment_type === 'driver' && formData.truck_id ? parseInt(formData.truck_id) : null,
        subcontractor_id: formData.assignment_type === 'subcontractor' && formData.subcontractor_id ? parseInt(formData.subcontractor_id) : null,
        is_subcontractor: formData.assignment_type === 'subcontractor',
        priority: formData.priority,
        notes: formData.notes || null
      }
      
      // Add manual pricing if enabled
      if (manualPricingEnabled && manualPrice) {
        payload.manual_override_total = parseFloat(manualPrice)
        payload.manual_override_reason = overrideReason.trim() || null
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
                <button
                  type="button"
                  onClick={() => setShowQuickAddCustomer(true)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>➕</span>
                  <span>לקוח חדש</span>
                </button>
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
                <button
                  type="button"
                  onClick={() => setShowQuickAddSite(true)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>➕</span>
                  <span>אתר חדש</span>
                </button>
                <p className="text-xs text-gray-500 mt-1">🏭 = אתר כללי (מחצבה, מזבלה וכו')</p>
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
                <button
                  type="button"
                  onClick={() => setShowQuickAddSite(true)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>➕</span>
                  <span>אתר חדש</span>
                </button>
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

          {/* Manual Price Override */}
          {(pricingPreview || formData.manual_override_total) && (
            <div className="bg-yellow-50 rounded-lg border-2 border-yellow-300 p-6 space-y-4">
              <div className="flex items-start gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={manualPricingEnabled}
                    onChange={(e) => {
                      setManualPricingEnabled(e.target.checked)
                      if (!e.target.checked) {
                        setManualPrice('')
                        setOverrideReason('')
                      }
                    }}
                    className="w-5 h-5 rounded text-yellow-600 focus:ring-2 focus:ring-yellow-500"
                  />
                  <span className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    🖊️ מחיר ידני (Override)
                  </span>
                </label>
              </div>
              
              {manualPricingEnabled && (
                <div className="space-y-4 pt-2">
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      מחיר מותאם אישית *
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-gray-600">₪</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={manualPrice}
                        onChange={(e) => setManualPrice(e.target.value)}
                        required={manualPricingEnabled}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="0.00"
                      />
                    </div>
                    {pricingPreview && manualPrice && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span>הפרש: </span>
                        <span className={
                          Number(manualPrice) > Number(pricingPreview.total) 
                            ? 'text-green-600 font-medium' 
                            : 'text-red-600 font-medium'
                        }>
                          {Number(manualPrice) > Number(pricingPreview.total) ? '+' : ''}
                          ₪{(Number(manualPrice) - Number(pricingPreview.total || 0)).toFixed(2)}
                        </span>
                        <span className="mr-2">
                          ({((Number(manualPrice) / Number(pricingPreview.total || 1) - 1) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      סיבה לשינוי מחיר (אופציונלי)
                    </label>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="למה המחיר שונה מהמחירון? (לתיעוד)"
                    />
                  </div>
                  
                  <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ שינוי מחיר ידני יתועד במערכת ויוצג בתעודת המשלוח
                    </p>
                  </div>
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
            
            {/* Assignment Type Selection */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                סוג שיבוץ
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assignment_type"
                    value="driver"
                    checked={formData.assignment_type === 'driver'}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      assignment_type: e.target.value,
                      subcontractor_id: '' // Reset subcontractor when switching
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">נהג חברה</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="assignment_type"
                    value="subcontractor"
                    checked={formData.assignment_type === 'subcontractor'}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      assignment_type: e.target.value,
                      driver_id: '', // Reset driver when switching
                      truck_id: ''
                    }))}
                    className="w-4 h-4 text-orange-600"
                  />
                  <span className="text-gray-700">קבלן משנה</span>
                </label>
              </div>
            </div>
            
            {/* Company Driver Assignment */}
            {formData.assignment_type === 'driver' && (
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
            )}
            
            {/* Subcontractor Assignment */}
            {formData.assignment_type === 'subcontractor' && (
              <div>
                <Combobox
                  label="קבלן משנה"
                  placeholder="חפש קבלן משנה..."
                  options={subcontractors.map(s => ({
                    value: s.id,
                    label: s.name,
                    subLabel: s.truck_plate_number ? `משאית: ${s.truck_plate_number}` : s.phone
                  }))}
                  value={formData.subcontractor_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, subcontractor_id: value.toString() }))}
                />
                
                {/* Subcontractor Pricing Preview */}
                {(subcontractorPricing || loadingSubcontractorPricing) && (
                  <div className="mt-4 bg-orange-50 rounded-lg border border-orange-200 p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-orange-600" />
                      מחיר קבלן משנה
                    </h4>
                    {loadingSubcontractorPricing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                        <span className="text-sm text-gray-600">מחשב...</span>
                      </div>
                    ) : subcontractorPricing ? (
                      <div className="space-y-2">
                        {subcontractorPricing.price_per_trip && (
                          <div className="flex justify-between text-sm">
                            <span>מחיר לנסיעה:</span>
                            <span className="font-medium">₪{Number(subcontractorPricing.price_per_trip).toFixed(2)}</span>
                          </div>
                        )}
                        {subcontractorPricing.price_per_ton && (
                          <div className="flex justify-between text-sm">
                            <span>מחיר לטון:</span>
                            <span className="font-medium">₪{Number(subcontractorPricing.price_per_ton).toFixed(2)}</span>
                          </div>
                        )}
                        {subcontractorPricing.total_estimated && (
                          <div className="flex justify-between text-base font-bold border-t border-orange-300 pt-2 mt-2">
                            <span>סה״כ משוער:</span>
                            <span className="text-orange-600">₪{Number(subcontractorPricing.total_estimated).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">לא נמצא מחירון לקבלן זה</p>
                    )}
                  </div>
                )}
              </div>
            )}
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
        
        {/* Quick Add Modals */}
        <QuickAddCustomerModal
          show={showQuickAddCustomer}
          onSuccess={(newCustomer) => {
            setCustomers(prev => [...prev, newCustomer])
            setFormData(prev => ({ 
              ...prev, 
              customer_id: newCustomer.id.toString() 
            }))
            setShowQuickAddCustomer(false)
          }}
          onCancel={() => setShowQuickAddCustomer(false)}
        />
        
        <QuickAddSiteModal
          show={showQuickAddSite}
          customerId={formData.customer_id ? parseInt(formData.customer_id) : undefined}
          onSuccess={(newSite) => {
            setSites(prev => [...prev, newSite])
            // Optionally set as selected site
            if (!formData.from_site_id) {
              setFormData(prev => ({ ...prev, from_site_id: newSite.id.toString() }))
            } else if (!formData.to_site_id) {
              setFormData(prev => ({ ...prev, to_site_id: newSite.id.toString() }))
            }
            setShowQuickAddSite(false)
          }}
          onCancel={() => setShowQuickAddSite(false)}
        />
      </div>
    </DashboardLayout>
  )
}
