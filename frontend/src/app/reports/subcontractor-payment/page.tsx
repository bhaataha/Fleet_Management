'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { jobsApi, subcontractorsApi } from '@/lib/api'
import { Download, Printer } from 'lucide-react'

export default function SubcontractorPaymentReport() {
  // Calculate default dates: first and last day of current month
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  const [subcontractors, setSubcontractors] = useState<any[]>([])
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState<number | null>(null)
  const [priceLists, setPriceLists] = useState<any[]>([])
  const [dateFrom, setDateFrom] = useState(firstDay.toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(lastDay.toISOString().split('T')[0])
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({
    total_jobs: 0,
    total_quantity: 0,
    total_amount: 0,
    total_to_pay: 0
  })

  useEffect(() => {
    loadSubcontractors()
  }, [])

  const loadSubcontractors = async () => {
    try {
      const response = await subcontractorsApi.getAll()
      setSubcontractors(response.data)
    } catch (error) {
      console.error('Error loading subcontractors:', error)
    }
  }

  const calculateJobPrice = (job: any, priceLists: any[]) => {
    // If job already has subcontractor_price_total, use it
    if (job.subcontractor_price_total) {
      return job.subcontractor_price_total
    }

    console.log('Calculating price for job:', job.id, 'Material:', job.material?.name, 'Unit:', job.unit, 'Billing unit:', job.subcontractor_billing_unit)
    console.log('Available price lists:', priceLists)

    // Determine which billing unit to use: job's override or job's default unit
    const billingUnit = job.subcontractor_billing_unit || job.unit

    // Find matching price lists for this job (may be multiple)
    const matchingPriceLists = priceLists.filter(p => {
      if (!p.is_active) return false

      // Check if this price list has the right price field for the billing unit
      let hasPriceForUnit = false
      if (billingUnit === 'TON' && p.price_per_ton) hasPriceForUnit = true
      else if (billingUnit === 'M3' && p.price_per_m3) hasPriceForUnit = true
      else if (billingUnit === 'TRIP' && p.price_per_trip) hasPriceForUnit = true
      else if (billingUnit === 'KM' && p.price_per_km) hasPriceForUnit = true

      if (!hasPriceForUnit) return false

      // Material match (if specified in price list)
      const matchesMaterial = !p.material_id || p.material_id === job.material_id
      
      // Route match (if specified in price list)
      const matchesRoute = (!p.from_site_id || p.from_site_id === job.from_site_id) &&
                          (!p.to_site_id || p.to_site_id === job.to_site_id)
      
      // Date validation (if specified in price list)
      const jobDate = new Date(job.scheduled_date)
      const matchesDates = (!p.valid_from || jobDate >= new Date(p.valid_from)) &&
                          (!p.valid_to || jobDate <= new Date(p.valid_to))

      return matchesMaterial && matchesRoute && matchesDates
    })

    // Priority 1: Price list with matching material_id (most specific)
    let priceList = matchingPriceLists.find(p => p.material_id === job.material_id)
    
    // Priority 2: General price list (no material_id = applies to all materials)
    if (!priceList) {
      priceList = matchingPriceLists.find(p => !p.material_id)
    }

    if (priceList) {
      console.log('Found matching price list:', priceList, priceList.material_id ? `(specific for material ${job.material?.name})` : '(general)')
    }

    if (!priceList) {
      console.log('No price list found for job', job.id)
      return 0
    }

    const quantity = job.actual_qty || job.planned_qty || 0
    console.log('Quantity:', quantity, 'Billing unit:', billingUnit)

    // Calculate price based on billing unit (not job.unit!)
    let calculatedPrice = 0
    
    // Use the billing unit to match with price list
    if (billingUnit === 'TON' && priceList.price_per_ton) {
      calculatedPrice = quantity * parseFloat(priceList.price_per_ton)
      console.log(`TON: ${quantity} × ${priceList.price_per_ton} = ${calculatedPrice}`)
    } else if (billingUnit === 'M3' && priceList.price_per_m3) {
      calculatedPrice = quantity * parseFloat(priceList.price_per_m3)
      console.log(`M3: ${quantity} × ${priceList.price_per_m3} = ${calculatedPrice}`)
    } else if (billingUnit === 'TRIP' && priceList.price_per_trip) {
      calculatedPrice = parseFloat(priceList.price_per_trip)
      console.log(`TRIP (flat rate): ${priceList.price_per_trip}`)
    } else if (billingUnit === 'KM' && priceList.price_per_km) {
      calculatedPrice = quantity * parseFloat(priceList.price_per_km)
      console.log(`KM: ${quantity} × ${priceList.price_per_km} = ${calculatedPrice}`)
    }

    // Apply minimum charge if exists
    if (priceList.min_charge && calculatedPrice < parseFloat(priceList.min_charge)) {
      console.log(`Applying min charge: ${priceList.min_charge} (was ${calculatedPrice})`)
      calculatedPrice = parseFloat(priceList.min_charge)
    }

    console.log('Final calculated price:', calculatedPrice)
    return calculatedPrice
  }

  const generateReport = async () => {
    if (!selectedSubcontractorId || !dateFrom || !dateTo) {
      alert('נא למלא את כל השדות')
      return
    }

    setLoading(true)
    try {
      // Get price lists for this subcontractor
      const priceListsRes = await subcontractorsApi.getPriceLists(selectedSubcontractorId)
      console.log('Loaded price lists for subcontractor:', selectedSubcontractorId, priceListsRes.data)
      setPriceLists(priceListsRes.data)

      // Get all jobs for this subcontractor in date range
      const response = await jobsApi.list({
        skip: 0,
        limit: 200
      })
      
      const subcontractorJobs = response.data.filter((job: any) => 
        job.is_subcontractor && 
        job.subcontractor_id === selectedSubcontractorId &&
        job.scheduled_date >= dateFrom &&
        job.scheduled_date <= dateTo &&
        job.status !== 'CANCELED'
      )

      // Calculate price for each job
      const jobsWithCalculatedPrice = subcontractorJobs.map((job: any) => ({
        ...job,
        calculated_price: calculateJobPrice(job, priceListsRes.data)
      }))

      setJobs(jobsWithCalculatedPrice)

      // Calculate summary
      const totalJobs = jobsWithCalculatedPrice.length
      const totalQuantity = jobsWithCalculatedPrice.reduce((sum: number, job: any) => 
        sum + (job.actual_qty || job.planned_qty || 0), 0
      )
      const totalAmount = jobsWithCalculatedPrice.reduce((sum: number, job: any) => 
        sum + (job.calculated_price || 0), 0
      )

      setSummary({
        total_jobs: totalJobs,
        total_quantity: totalQuantity,
        total_amount: totalAmount,
        total_to_pay: totalAmount
      })
    } catch (error) {
      console.error('Error generating report:', error)
      alert('שגיאה ביצירת הדוח')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    // Export to CSV
    const selectedSub = subcontractors.find(s => s.id === selectedSubcontractorId)
    const csvContent = [
      ['דוח תשלום לקבלן משנה'],
      [`קבלן: ${selectedSub?.truck_plate_number || selectedSub?.name || ''}`],
      [`מתאריך: ${dateFrom} עד תאריך: ${dateTo}`],
      [],
      ['תאריך', 'נסיעה #', 'לקוח', 'מאתר', 'לאתר', 'חומר', 'כמות', 'יחידת חיוב', 'מחיר מחושב', 'מחיר רשום'],
      ...jobs.map(job => [
        new Date(job.scheduled_date).toLocaleDateString('he-IL'),
        job.id,
        job.customer?.name || '',
        job.from_site?.name || '',
        job.to_site?.name || '',
        job.material?.name || '',
        job.actual_qty || job.planned_qty || 0,
        job.subcontractor_billing_unit || job.unit,
        job.calculated_price || 0,
        job.subcontractor_price_total || 0
      ]),
      [],
      ['סה"כ נסיעות:', summary.total_jobs],
      ['סה"כ כמות:', summary.total_quantity],
      ['סה"כ לתשלום (מחושב):', summary.total_amount]
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `תשלום_קבלן_${dateFrom}_${dateTo}.csv`
    link.click()
  }

  const selectedSubcontractor = subcontractors.find(s => s.id === selectedSubcontractorId)

  return (
    <DashboardLayout>
      <div className="space-y-6 print:p-8">
        {/* Header */}
        <div className="flex justify-between items-center print:mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">דוח תשלום לקבלן משנה</h1>
            <p className="text-gray-600 mt-1">חישוב תשלום לפי נסיעות ומחירון</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              הדפס
            </button>
            <button
              onClick={handleExport}
              disabled={jobs.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-300 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              ייצא לאקסל
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 print:hidden">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">בחר פרמטרים</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                קבלן משנה *
              </label>
              <select
                value={selectedSubcontractorId || ''}
                onChange={(e) => setSelectedSubcontractorId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- בחר קבלן --</option>
                {subcontractors.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    🚛 {sub.truck_plate_number || sub.name || `קבלן #${sub.id}`}
                    {sub.name && sub.truck_plate_number && ` (${sub.name})`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מתאריך *
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                עד תאריך *
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={generateReport}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300"
            >
              {loading ? '⏳ טוען...' : '📊 הפק דוח'}
            </button>
          </div>
        </div>

        {/* Report Content */}
        {jobs.length > 0 && (
          <>
            {/* Report Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    🚛 {selectedSubcontractor?.truck_plate_number || 'קבלן'}
                  </h2>
                  {selectedSubcontractor?.name && (
                    <p className="text-gray-600">{selectedSubcontractor.name}</p>
                  )}
                  {selectedSubcontractor?.phone && (
                    <p className="text-gray-500">📱 {selectedSubcontractor.phone}</p>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-600">תקופה: {new Date(dateFrom).toLocaleDateString('he-IL')} - {new Date(dateTo).toLocaleDateString('he-IL')}</p>
                  <p className="text-sm text-gray-600">תאריך הפקה: {new Date().toLocaleDateString('he-IL')}</p>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">סה"כ נסיעות</p>
                <p className="text-2xl font-bold text-blue-900">{summary.total_jobs}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">סה"כ כמות</p>
                <p className="text-2xl font-bold text-green-900">{summary.total_quantity.toFixed(2)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-orange-600 font-medium">ממוצע לנסיעה</p>
                <p className="text-2xl font-bold text-orange-900">
                  {summary.total_jobs > 0 ? (summary.total_amount / summary.total_jobs).toFixed(0) : 0} ₪
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-medium">סה"כ לתשלום</p>
                <p className="text-3xl font-bold text-purple-900">{summary.total_to_pay.toFixed(2)} ₪</p>
              </div>
            </div>

            {/* Jobs Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">תאריך</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">נסיעה #</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">לקוח</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">מאתר</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">לאתר</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">חומר</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">כמות</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">יחידת חיוב</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">מחיר מחושב</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(job.scheduled_date).toLocaleDateString('he-IL')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">#{job.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{job.customer?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{job.from_site?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{job.to_site?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{job.material?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {(job.actual_qty || job.planned_qty || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 font-medium">
                            {job.subcontractor_billing_unit || job.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-green-600">
                          {(job.calculated_price || 0).toFixed(2)} ₪
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            job.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                            job.status === 'CLOSED' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-left font-bold text-gray-900">סה"כ:</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        {summary.total_quantity.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">-</td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600">
                        {summary.total_to_pay.toFixed(2)} ₪
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}

        {jobs.length === 0 && !loading && selectedSubcontractorId && dateFrom && dateTo && (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">לא נמצאו נסיעות לקבלן זה בתקופה הנבחרת</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
