'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useI18n } from '@/lib/i18n'
import api, { customersApi, sitesApi, materialsApi, driversApi, trucksApi } from '@/lib/api'
import { 
  ArrowLeft, 
  MapPin, 
  Package, 
  Truck, 
  User, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Phone,
  Mail,
  Edit,
  DollarSign,
  Printer
} from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-gray-100 text-gray-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  ENROUTE_PICKUP: 'bg-yellow-100 text-yellow-800',
  LOADED: 'bg-orange-100 text-orange-800',
  ENROUTE_DROPOFF: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-600',
  CANCELED: 'bg-red-100 text-red-800',
}

// Print styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @media print {
      @page {
        size: A4;
        margin: 10mm 12mm;
      }
      
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
        font-size: 11px;
      }
      
      .print\\:hidden {
        display: none !important;
      }
      
      .print\\:border-2 {
        border-width: 1px !important;
      }
      
      .print\\:bg-white {
        background-color: white !important;
        background-image: none !important;
      }
      
      .print-header {
        display: block !important;
        border-bottom: 2px solid #2563eb;
        padding-bottom: 8px;
        margin-bottom: 12px;
      }
      
      .print-title {
        font-size: 20px;
        font-weight: bold;
        color: #1e40af;
        text-align: center;
        margin: 0;
      }
      
      .print-company {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
        text-align: center;
        margin-top: 4px;
      }
      
      .print-signature-area {
        display: block !important;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px dashed #9ca3af;
      }
      
      .print-signature-line {
        border-top: 1px solid #000;
        margin: 15px 40px 3px 40px;
      }
      
      /* Hide navigation and buttons */
      nav, .no-print, button, .print\\:hidden {
        display: none !important;
      }
      
      /* Compact spacing */
      .space-y-6 > * + * {
        margin-top: 0.75rem !important;
      }
      
      /* Reduce padding */
      .rounded-lg, .rounded-xl {
        padding: 8px !important;
      }
      
      /* Smaller fonts */
      h3, .text-lg {
        font-size: 14px !important;
      }
      
      .text-sm {
        font-size: 10px !important;
      }
      
      .text-xs {
        font-size: 9px !important;
      }
      
      /* Compact grid gaps */
      .gap-4 {
        gap: 0.5rem !important;
      }
      
      .gap-3 {
        gap: 0.4rem !important;
      }
      
      /* Reduce icon sizes */
      svg {
        width: 12px !important;
        height: 12px !important;
      }
      
      /* Compact pricing section */
      .text-2xl {
        font-size: 18px !important;
      }
      
      /* Single page fit */
      .max-w-6xl {
        max-width: 100% !important;
      }
    }
  `
  if (!document.getElementById('print-styles')) {
    style.id = 'print-styles'
    document.head.appendChild(style)
  }
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusEvents, setStatusEvents] = useState<any[]>([])
  const [pricingPreview, setPricingPreview] = useState<any>(null)
  const [loadingPricing, setLoadingPricing] = useState(false)
  
  // Reference data
  const [customer, setCustomer] = useState<any>(null)
  const [fromSite, setFromSite] = useState<any>(null)
  const [toSite, setToSite] = useState<any>(null)
  const [material, setMaterial] = useState<any>(null)
  const [driver, setDriver] = useState<any>(null)
  const [truck, setTruck] = useState<any>(null)

  useEffect(() => {
    if (params.id) {
      loadJobDetails()
    }
  }, [params.id])

  const loadJobDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/jobs/${params.id}`)
      const jobData = response.data
      setJob(jobData)
      
      // Load all related data in parallel
      const promises = []
      
      if (jobData.customer_id) {
        promises.push(
          customersApi.get(jobData.customer_id)
            .then(res => setCustomer(res.data))
            .catch(() => {})
        )
      }
      
      if (jobData.from_site_id) {
        promises.push(
          sitesApi.get(jobData.from_site_id)
            .then(res => setFromSite(res.data))
            .catch(() => {})
        )
      }
      
      if (jobData.to_site_id) {
        promises.push(
          sitesApi.get(jobData.to_site_id)
            .then(res => setToSite(res.data))
            .catch(() => {})
        )
      }
      
      if (jobData.material_id) {
        promises.push(
          materialsApi.get(jobData.material_id)
            .then(res => setMaterial(res.data))
            .catch(() => {})
        )
      }
      
      if (jobData.driver_id) {
        promises.push(
          driversApi.get(jobData.driver_id)
            .then(res => setDriver(res.data))
            .catch(() => {})
        )
      }
      
      if (jobData.truck_id) {
        promises.push(
          trucksApi.get(jobData.truck_id)
            .then(res => setTruck(res.data))
            .catch(() => {})
        )
      }
      
      await Promise.all(promises)
      
      // Load pricing if job has necessary data
      if (jobData.customer_id && jobData.material_id && jobData.planned_qty) {
        loadPricing(jobData)
      }
      
      // Try to load status events
      try {
        const eventsResponse = await api.get(`/jobs/${params.id}/status-events`)
        setStatusEvents(eventsResponse.data)
      } catch (err) {
        console.log('No status events endpoint')
      }
    } catch (error) {
      console.error('Failed to load job:', error)
      alert('שגיאה בטעינת הנסיעה')
      router.push('/jobs')
    } finally {
      setLoading(false)
    }
  }
  
  const loadPricing = async (jobData: any) => {
    try {
      setLoadingPricing(true)
      const response = await api.post('/pricing/quote', {
        customer_id: jobData.customer_id,
        material_id: jobData.material_id,
        from_site_id: jobData.from_site_id || null,
        to_site_id: jobData.to_site_id || null,
        unit: jobData.unit,
        quantity: parseFloat(jobData.planned_qty),
        wait_hours: 0,
        is_night: false
      })
      setPricingPreview(response.data)
    } catch (error: any) {
      console.error('Failed to fetch pricing:', error.response?.status)
      setPricingPreview(null)
    } finally {
      setLoadingPricing(false)
    }
  }
  
  const handlePrint = () => {
    window.print()
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`האם לשנות סטטוס ל-${t(`jobs.status.${newStatus}`)}?`)) {
      return
    }

    try {
      await api.post(`/jobs/${params.id}/status`, { status: newStatus })
      alert('הסטטוס עודכן בהצלחה!')
      loadJobDetails()
    } catch (error: any) {
      console.error('Failed to update status:', error)
      alert(error.response?.data?.detail || 'שגיאה בעדכון סטטוס')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (!job) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Print Header - Only visible when printing */}
        <div className="hidden print-header">
          <div className="print-title">תעודת משלוח</div>
          <div className="print-company">מערכת ניהול הובלות עפר</div>
          <div className="text-center text-gray-600 mt-2">
            תאריך: {new Date(job.scheduled_date).toLocaleDateString('he-IL')} | מספר נסיעה: {job.id}
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/jobs')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">נסיעה #{job.id}</h1>
              <p className="text-gray-600 mt-1">
                {new Date(job.scheduled_date).toLocaleDateString('he-IL')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2 print:hidden"
            >
              <Printer className="w-4 h-4" />
              הדפס תעודת משלוח
            </button>
            <button
              onClick={() => router.push(`/jobs/${job.id}/edit`)}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2 print:hidden"
            >
              <Edit className="w-4 h-4" />
              ערוך נסיעה
            </button>
            <span className={`px-4 py-2 text-sm font-medium rounded-full ${STATUS_COLORS[job.status]}`}>
              {t(`jobs.status.${job.status}`)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Route */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                מסלול
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">מאתר</p>
                    <p className="font-medium text-lg">{fromSite?.name || `אתר #${job.from_site_id}`}</p>
                    {fromSite?.address && (
                      <p className="text-sm text-gray-500 mt-1">{fromSite.address}</p>
                    )}
                  </div>
                  <div className="text-2xl text-blue-600 font-bold">←</div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">לאתר</p>
                    <p className="font-medium text-lg">{toSite?.name || `אתר #${job.to_site_id}`}</p>
                    {toSite?.address && (
                      <p className="text-sm text-gray-500 mt-1">{toSite.address}</p>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">לקוח</p>
                  <p className="font-medium text-lg">{customer?.name || `לקוח #${job.customer_id}`}</p>
                  {customer?.contact_name && (
                    <p className="text-sm text-gray-500 mt-1">
                      איש קשר: {customer.contact_name}
                      {customer.phone && ` • ${customer.phone}`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Material & Quantity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 print:border-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                חומר וכמות
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">חומר</p>
                  <p className="font-medium text-lg">{material?.name || `חומר #${job.material_id}`}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">כמות מתוכננת</p>
                  <p className="font-medium text-lg">{job.planned_qty} {t(`units.${job.unit}`)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">כמות בפועל</p>
                  <p className="font-medium text-lg">
                    {job.actual_qty ? `${job.actual_qty} ${t(`units.${job.unit}`)}` : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            {loadingPricing && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 print:bg-white print:border-2">
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span>מחשב מחיר...</span>
                </div>
              </div>
            )}

            {!loadingPricing && pricingPreview && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 print:bg-white print:border-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    מחיר משוער
                  </h3>
                </div>

                <div className="space-y-3">
                  {/* Base Price */}
                  {pricingPreview.details && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">מחיר בסיס ({pricingPreview.details.unit})</span>
                      <span className="font-medium text-gray-900">
                        ₪{Number(pricingPreview.details.unit_price || 0).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Quantity */}
                  {pricingPreview.details && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">כמות</span>
                      <span className="font-medium text-gray-900">
                        {Number(pricingPreview.details.quantity || 0).toFixed(2)} {pricingPreview.details.unit}
                      </span>
                    </div>
                  )}

                  {/* Subtotal */}
                  {pricingPreview.details && (
                    <div className="flex justify-between items-center text-sm pb-3 border-b border-blue-200">
                      <span className="text-gray-600">סכום ביניים</span>
                      <span className="font-medium text-gray-900">
                        ₪{Number(pricingPreview.details.base_amount || 0).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Min Charge Adjustment */}
                  {pricingPreview.min_charge_adjustment && pricingPreview.min_charge_adjustment > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-yellow-800 font-medium">תוספת מינימום חיוב</span>
                        <span className="font-semibold text-yellow-900">
                          +₪{Number(pricingPreview.min_charge_adjustment || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Wait Fee */}
                  {pricingPreview.wait_fee && pricingPreview.wait_fee > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">דמי המתנה</span>
                      <span className="font-medium text-orange-600">
                        +₪{Number(pricingPreview.wait_fee || 0).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Night Surcharge */}
                  {pricingPreview.night_surcharge && pricingPreview.night_surcharge > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">תוספת לילה</span>
                      <span className="font-medium text-purple-600">
                        +₪{Number(pricingPreview.night_surcharge || 0).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-blue-300">
                    <span className="text-lg font-semibold text-gray-900">סה״כ</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₪{Number(pricingPreview.total || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Price List Info */}
                  {pricingPreview.price_list_id && (
                    <div className="mt-4 pt-3 border-t border-blue-200">
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>מחירון מס׳: {pricingPreview.price_list_id}</div>
                        {pricingPreview.details?.from_site_name && pricingPreview.details?.to_site_name && (
                          <div className="text-blue-600 font-medium">
                            ✓ מחיר ספציפי למסלול: {pricingPreview.details.from_site_name} → {pricingPreview.details.to_site_name}
                          </div>
                        )}
                        {(!pricingPreview.details?.from_site_name || !pricingPreview.details?.to_site_name) && (
                          <div>מחיר כללי ללקוח</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fleet */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 print:border-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-600" />
                צי
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Driver */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">נהג</p>
                  {driver ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">{driver.name}</p>
                        {driver.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                            <Phone className="w-3 h-3" />
                            <span>{driver.phone}</span>
                          </div>
                        )}
                        {driver.license_type && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                            רישיון {driver.license_type}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic p-3 bg-gray-50 rounded-lg">
                      {job.driver_id ? `נהג #${job.driver_id}` : 'לא משובץ נהג'}
                    </p>
                  )}
                </div>
                
                {/* Truck */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">משאית</p>
                  {truck ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Truck className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">{truck.plate_number}</p>
                        {truck.model && (
                          <p className="text-sm text-gray-600">{truck.model}</p>
                        )}
                        {truck.capacity_ton && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded">
                            {truck.capacity_ton} טון
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic p-3 bg-gray-50 rounded-lg">
                      {job.truck_id ? `משאית #${job.truck_id}` : 'לא משובצת משאית'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            {statusEvents.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  ציר זמן
                </h3>
                <div className="space-y-4">
                  {statusEvents.map((event, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-1">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{t(`jobs.status.${event.status}`)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(event.event_time).toLocaleString('he-IL')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">פעולות</h3>
              <div className="space-y-2">
                {job.status === 'PLANNED' && (
                  <button
                    onClick={() => handleStatusChange('ASSIGNED')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    שבץ נסיעה
                  </button>
                )}
                {job.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handleStatusChange('ENROUTE_PICKUP')}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    יציאה לטעינה
                  </button>
                )}
                {job.status === 'ENROUTE_PICKUP' && (
                  <button
                    onClick={() => handleStatusChange('LOADED')}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    נטען
                  </button>
                )}
                {job.status === 'LOADED' && (
                  <button
                    onClick={() => handleStatusChange('ENROUTE_DROPOFF')}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    יציאה לפריקה
                  </button>
                )}
                {job.status === 'ENROUTE_DROPOFF' && (
                  <button
                    onClick={() => handleStatusChange('DELIVERED')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    נמסר
                  </button>
                )}
                {job.status === 'DELIVERED' && (
                  <button
                    onClick={() => handleStatusChange('CLOSED')}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    סגור נסיעה
                  </button>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 print:hidden">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">הערה</p>
                  <p>סטטוס הנסיעה יעודכן אוטומטית כשהנהג יעדכן באפליקציה</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Area - Only visible when printing */}
        <div className="hidden print-signature-area">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">חתימת נהג:</p>
              <div className="print-signature-line"></div>
              <p className="text-xs text-gray-600 text-center mt-1">שם הנהג וחתימה</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">חתימת מקבל:</p>
              <div className="print-signature-line"></div>
              <p className="text-xs text-gray-600 text-center mt-1">שם המקבל וחתימה</p>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>תעודה זו הופקה באמצעות מערכת ניהול הובלות עפר</p>
            <p className="mt-1">הודפס בתאריך: {new Date().toLocaleDateString('he-IL')} {new Date().toLocaleTimeString('he-IL')}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
