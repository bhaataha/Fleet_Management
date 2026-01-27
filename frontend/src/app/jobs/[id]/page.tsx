'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useI18n } from '@/lib/i18n'
import api, { customersApi, sitesApi, materialsApi, driversApi, trucksApi, subcontractorsApi } from '@/lib/api'
import { billingUnitLabels } from '@/lib/utils'
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
  Printer,
  MessageCircle
} from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8001'

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
        margin: 15mm;
      }
      
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
        font-size: 10px;
        line-height: 1.3;
      }
      
      * {
        box-shadow: none !important;
      }
      
      .print\\:hidden, .no-print, nav, button:not(.print-only) {
        display: none !important;
      }
      
      .print-header {
        display: block !important;
        border-bottom: 3px solid #2563eb;
        padding-bottom: 10px;
        margin-bottom: 15px;
        page-break-after: avoid;
      }
      
      .print-title {
        font-size: 24px;
        font-weight: bold;
        color: #1e40af;
        text-align: center;
        margin: 0;
      }
      
      .print-company {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        text-align: center;
        margin-top: 5px;
      }
      
      .print-signature-area {
        display: block !important;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 2px dashed #9ca3af;
        page-break-inside: avoid;
      }
      
      .print-signature-line {
        border-top: 2px solid #000;
        margin-top: 45px;
        padding-top: 8px;
        text-align: center;
        font-weight: 600;
        min-height: 15px;
      }
      
      /* Compact layout */
      .space-y-6 > * + * {
        margin-top: 6px !important;
      }
      
      .gap-6 {
        gap: 6px !important;
      }
      
      .gap-4 {
        gap: 6px !important;
      }
      
      .gap-3 {
        gap: 5px !important;
      }
      
      .rounded-lg, .rounded-xl {
        padding: 6px !important;
        border-radius: 4px !important;
      }
      
      /* Typography */
      h1 {
        font-size: 20px !important;
      }
      
      h2 {
        font-size: 16px !important;
      }
      
      h3, .text-lg {
        font-size: 13px !important;
        font-weight: 700 !important;
      }
      
      .text-sm {
        font-size: 9px !important;
      }
      
      .text-xs {
        font-size: 8px !important;
      }
      
      .text-2xl {
        font-size: 16px !important;
      }
      
      /* Icons */
      svg {
        width: 11px !important;
        height: 11px !important;
      }
      
      /* Borders */
      .border {
        border-width: 1px !important;
      }
      
      .border-2 {
        border-width: 1.5px !important;
      }
      
      /* Grid layout */
      .lg\\:col-span-2 {
        grid-column: span 2 !important;
      }
      
      .lg\\:grid-cols-3 {
        grid-template-columns: repeat(3, 1fr) !important;
      }
      
      /* Padding adjustments */
      .p-6 {
        padding: 6px !important;
      }
      
      .p-4 {
        padding: 4px !important;
      }
      
      .px-6 {
        padding-left: 8px !important;
        padding-right: 8px !important;
      }
      
      .py-4 {
        padding-top: 6px !important;
        padding-bottom: 6px !important;
      }
      
      /* Max width */
      .max-w-6xl {
        max-width: 100% !important;
      }
      
      /* Photo grid compact */
      .grid-cols-2 {
        grid-template-columns: repeat(4, 1fr) !important;
        gap: 3px !important;
      }
      
      .grid-cols-3 {
        grid-template-columns: repeat(5, 1fr) !important;
        gap: 3px !important;
      }
      
      /* Photo size */
      .h-48 {
        height: 80px !important;
      }
      
      /* Hide less important sections on print if space is tight */
      .status-events-section {
        max-height: 80px;
        overflow: hidden;
      }
      
      /* Ensure single page */
      .page-break-avoid {
        page-break-inside: avoid;
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
  const [jobFiles, setJobFiles] = useState<any[]>([])
  const [editingActualQty, setEditingActualQty] = useState(false)
  const [actualQtyInput, setActualQtyInput] = useState('')
  
  // Reference data
  const [customer, setCustomer] = useState<any>(null)
  const [fromSite, setFromSite] = useState<any>(null)
  const [toSite, setToSite] = useState<any>(null)
  const [material, setMaterial] = useState<any>(null)
  const [driver, setDriver] = useState<any>(null)
  const [truck, setTruck] = useState<any>(null)
  const [subcontractor, setSubcontractor] = useState<any>(null)

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
      
      if (jobData.subcontractor_id) {
        promises.push(
          subcontractorsApi.get(jobData.subcontractor_id)
            .then(res => setSubcontractor(res.data))
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
      
      // Load job files
      try {
        const filesResponse = await api.get(`/jobs/${params.id}/files`)
        console.log('📸 Files loaded:', filesResponse.data)
        setJobFiles(filesResponse.data.files || [])
      } catch (err) {
        console.error('❌ Failed to load files:', err)
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
  
  const handleSavePDF = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        alert('אנא התחבר מחדש למערכת')
        router.push('/login')
        return
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'}/jobs/${params.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to download PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `delivery_note_${params.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF download failed:', error)
      alert('שגיאה בהורדת PDF')
    }
  }
  
  const handleOpenPDFInBrowser = () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      alert('אנא התחבר מחדש למערכת')
      router.push('/login')
      return
    }
    const pdfUrl = `http://truckflow.site:8001/api/jobs/${params.id}/pdf?token=${token}`
    window.open(pdfUrl, '_blank')
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

  const handleActualQtyUpdate = async () => {
    try {
      const newQty = parseFloat(actualQtyInput)
      if (isNaN(newQty) || newQty <= 0) {
        alert('יש להזין כמות תקינה')
        return
      }

      await api.patch(`/jobs/${params.id}`, { actual_qty: newQty })
      alert('הכמות בפועל עודכנה בהצלחה!')
      setEditingActualQty(false)
      loadJobDetails()
    } catch (error: any) {
      console.error('Failed to update actual quantity:', error)
      alert(error.response?.data?.detail || 'שגיאה בעדכון כמות')
    }
  }

  const startEditingActualQty = () => {
    setActualQtyInput(job?.actual_qty?.toString() || job?.planned_qty?.toString() || '')
    setEditingActualQty(true)
  }

  const handleSendWhatsApp = async () => {
    // Get token for authenticated PDF access
    const token = localStorage.getItem('access_token')
    if (!token) {
      alert('אנא התחבר מחדש למערכת')
      router.push('/login')
      return
    }
    
    try {
      // Create share URL via API
      const response = await fetch(`/api/jobs/${params.id}/share`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to create share link')
      }
      
      const data = await response.json()
      const shareUrl = data.short_url
      
      const message = `🚛 *תעודת משלוח #${job.id}*

📄 צפה כאן: ${shareUrl}

_נשלח מ-TruckFlow_`

      // Get customer phone if available
      const phone = customer?.phone?.replace(/[^0-9]/g, '') || ''
      
      // Open WhatsApp Web
      const whatsappUrl = phone && phone.length >= 9
        ? `https://wa.me/972${phone.replace(/^0/, '')}?text=${encodeURIComponent(message)}`
        : `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`
      
      window.open(whatsappUrl, '_blank')
      
    } catch (error) {
      console.error('Error creating share link:', error)
      alert('שגיאה ביצירת קישור שיתוף')
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
              onClick={handleSendWhatsApp}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2 print:hidden"
              title="שלח ב-WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              שלח ב-WhatsApp
            </button>
            <button
              onClick={handleOpenPDFInBrowser}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 print:hidden"
              title="פתח PDF בדפדפן"
            >
              <FileText className="w-4 h-4" />
              צפה ב-PDF
            </button>
            <button
              onClick={handleSavePDF}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 print:hidden"
              title="הורד PDF"
            >
              <FileText className="w-4 h-4" />
              הורד PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2 print:hidden"
            >
              <Printer className="w-4 h-4" />
              הדפס
            </button>
            <button
              onClick={() => router.push(`/jobs/${job.id}/edit`)}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2 print:hidden"
            >
              <Edit className="w-4 h-4" />
              ערוך
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
                  <p className="font-medium text-lg">{job.planned_qty} {billingUnitLabels[job.unit] || t(`units.${job.unit}`)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">כמות בפועל</p>
                  {editingActualQty ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={actualQtyInput}
                        onChange={(e) => setActualQtyInput(e.target.value)}
                        className="w-24 px-2 py-1 border border-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleActualQtyUpdate()
                          if (e.key === 'Escape') setEditingActualQty(false)
                        }}
                      />
                      <button
                        onClick={handleActualQtyUpdate}
                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingActualQty(false)}
                        className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-xs"
                      >
                        ✗
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-lg">
                        {job.actual_qty ? `${job.actual_qty} ${billingUnitLabels[job.unit] || t(`units.${job.unit}`)}` : '-'}
                      </p>
                      <button
                        onClick={startEditingActualQty}
                        className="print:hidden px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        ערוך
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            {/* Display Price (manual override takes priority if exists) */}
            {job.manual_override_total && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 print:bg-white print:border-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      מחיר
                    </h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Final Price */}
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">סה"כ לחיוב</span>
                      <span className="text-3xl font-bold text-blue-600">
                        ₪{Number(job.manual_override_total).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Reason if provided (internal note only) */}
                  {job.manual_override_reason && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                      <p className="font-medium mb-1">הערה:</p>
                      <p>{job.manual_override_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Calculated Pricing - Only show if no manual override */}
            {!job.manual_override_total && loadingPricing && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 print:bg-white print:border-2">
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span>מחשב מחיר...</span>
                </div>
              </div>
            )}

            {!job.manual_override_total && !loadingPricing && pricingPreview && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 print:bg-white print:border-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      מחיר ממחירון
                    </h3>
                    <p className="text-xs text-blue-600 font-medium mt-0.5">
                      מחושב לפי מחירון הלקוח
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Base Price */}
                  {pricingPreview.details && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">מחיר בסיס ({billingUnitLabels[pricingPreview.details.unit] || pricingPreview.details.unit})</span>
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
                        {Number(pricingPreview.details.quantity || 0).toFixed(2)} {billingUnitLabels[pricingPreview.details.unit] || pricingPreview.details.unit}
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
              <div className="space-y-4">
                {job.is_subcontractor && subcontractor ? (
                  /* Subcontractor - Alternative to truck/driver */
                  <div>
                    <p className="text-sm text-gray-600 mb-2 font-semibold">👷 קבלן משנה</p>
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-300">
                      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-2xl">
                        👷
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-2xl text-purple-900">{subcontractor.name}</p>
                        {subcontractor.company_name && (
                          <p className="text-sm text-purple-700 font-medium mt-1">{subcontractor.company_name}</p>
                        )}
                        {subcontractor.phone && (
                          <div className="flex items-center gap-1 text-sm text-purple-600 mt-2">
                            <Phone className="w-4 h-4" />
                            <span>{subcontractor.phone}</span>
                          </div>
                        )}
                        {subcontractor.contact_person && (
                          <p className="text-xs text-purple-600 mt-1">איש קשר: {subcontractor.contact_person}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Company truck + driver (default) */
                  <>
                    {/* Truck - PRIMARY */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2 font-semibold">🚛 משאית</p>
                      {truck ? (
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-orange-300">
                          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                            <Truck className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-2xl text-orange-900">{truck.plate_number}</p>
                            {truck.model && (
                              <p className="text-sm text-orange-700 font-medium">{truck.model}</p>
                            )}
                            {truck.capacity_ton && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-orange-200 text-orange-900 rounded font-semibold">
                                {truck.capacity_ton} טון
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          {job.truck_id ? `משאית #${job.truck_id}` : 'לא משובצת משאית'}
                        </p>
                      )}
                    </div>

                    {/* Driver - SECONDARY */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2">👤 נהג (משני)</p>
                      {driver ? (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{driver.name}</p>
                            {driver.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Phone className="w-3 h-3" />
                                <span>{driver.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 italic text-xs p-2 bg-gray-50 rounded">
                          לא משובץ נהג
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 print:hidden">
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

            {/* Timeline */}
            {statusEvents.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 status-events-section">
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

            {/* Files/Photos Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 print:p-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-600" />
                קבצים ותמונות ({jobFiles.length})
              </h3>
              {jobFiles.length > 0 ? (
                <div className="space-y-3">
                  {jobFiles.map((file: any) => (
                    <div key={file.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {file.file_type === 'PHOTO' && (
                        <div className="relative group">
                          <img 
                            src={`${API_BASE_URL}${file.url}`}
                            alt={file.filename}
                            className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(`${API_BASE_URL}${file.url}`, '_blank')}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs">
                            <p className="truncate">{file.filename}</p>
                            <p className="text-gray-300 text-[10px]">
                              {new Date(file.uploaded_at).toLocaleString('he-IL')} • {file.uploaded_by_name}
                            </p>
                          </div>
                        </div>
                      )}
                      {file.file_type !== 'PHOTO' && (
                        <a 
                          href={`${API_BASE_URL}${file.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{file.filename}</p>
                              <p className="text-xs text-gray-500">
                                {file.file_type} • {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">אין קבצים מצורפים</p>
                  <p className="text-xs mt-1">הנהג יכול להעלות תמונות דרך האפליקציה</p>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 print:hidden no-print">
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
        <div className="hidden print-signature-area" style={{ display: 'none' }}>
          <div className="text-xs text-gray-600 mb-3">
            <p><strong>הערות נוספות:</strong></p>
            <div className="border border-gray-300 rounded p-2 mt-1 min-h-[40px]"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-12">
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-3">חתימת נהג:</p>
              <div className="print-signature-line">
                <span className="text-xs text-gray-600">{driver?.name || 'שם הנהג'}</span>
              </div>
              <p className="text-xs text-gray-500 text-center mt-1">שם וחתימה</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-3">חתימת מקבל באתר:</p>
              <div className="print-signature-line">
                <span className="text-xs text-gray-600">שם מלא</span>
              </div>
              <p className="text-xs text-gray-500 text-center mt-1">שם וחתימה + חותמת (אם יש)</p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
            <p className="font-medium">מסמך זה משמש כאישור קבלת חומרים באתר</p>
            <p className="mt-1">הודפס מ: מערכת ניהול הובלות עפר | {new Date().toLocaleDateString('he-IL', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
