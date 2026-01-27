'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { jobsApi, trucksApi, driversApi } from '@/lib/api'
import { Download, Printer } from 'lucide-react'

export default function TruckReport() {
  // Calculate default dates: first and last day of current month
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  const [trucks, setTrucks] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [selectedTruckId, setSelectedTruckId] = useState<number | null>(null)
  const [dateFrom, setDateFrom] = useState(firstDay.toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(lastDay.toISOString().split('T')[0])
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({
    total_jobs: 0,
    total_quantity: 0,
    total_revenue: 0,
    avg_per_job: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [trucksRes, driversRes] = await Promise.all([
        trucksApi.list(),
        driversApi.list()
      ])
      setTrucks(trucksRes.data)
      setDrivers(driversRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const generateReport = async () => {
    if (!selectedTruckId || !dateFrom || !dateTo) {
      alert('נא למלא את כל השדות')
      return
    }

    setLoading(true)
    try {
      const response = await jobsApi.list({
        skip: 0,
        limit: 200
      })
      
      const truckJobs = response.data.filter((job: any) => 
        job.truck_id === selectedTruckId &&
        job.scheduled_date >= dateFrom &&
        job.scheduled_date <= dateTo &&
        job.status !== 'CANCELED'
      )

      setJobs(truckJobs)

      // Calculate summary
      const totalJobs = truckJobs.length
      const totalQuantity = truckJobs.reduce((sum: number, job: any) => 
        sum + (job.actual_qty || job.planned_qty || 0), 0
      )
      const totalRevenue = truckJobs.reduce((sum: number, job: any) => 
        sum + (job.manual_override_total || job.pricing_total || 0), 0
      )

      setSummary({
        total_jobs: totalJobs,
        total_quantity: totalQuantity,
        total_revenue: totalRevenue,
        avg_per_job: totalJobs > 0 ? totalRevenue / totalJobs : 0
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
    const selectedTruck = trucks.find(t => t.id === selectedTruckId)
    const csvContent = [
      ['דוח נסיעות לפי משאית'],
      [`משאית: ${selectedTruck?.plate_number || ''}`],
      [`מתאריך: ${dateFrom} עד תאריך: ${dateTo}`],
      [],
      ['תאריך', 'נסיעה #', 'נהג', 'לקוח', 'מאתר', 'לאתר', 'חומר', 'כמות', 'יחידה', 'הכנסה'],
      ...jobs.map(job => [
        new Date(job.scheduled_date).toLocaleDateString('he-IL'),
        job.id,
        drivers.find(d => d.id === job.driver_id)?.name || '',
        job.customer?.name || '',
        job.from_site?.name || '',
        job.to_site?.name || '',
        job.material?.name || '',
        job.actual_qty || job.planned_qty || 0,
        job.unit,
        job.manual_override_total || job.pricing_total || 0
      ]),
      [],
      ['סה"כ נסיעות:', summary.total_jobs],
      ['סה"כ כמות:', summary.total_quantity],
      ['סה"כ הכנסה:', summary.total_revenue],
      ['ממוצע לנסיעה:', summary.avg_per_job]
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `דוח_משאית_${selectedTruck?.plate_number}_${dateFrom}_${dateTo}.csv`
    link.click()
  }

  const selectedTruck = trucks.find(t => t.id === selectedTruckId)

  return (
    <DashboardLayout>
      <div className="space-y-6 print:p-8">
        {/* Header */}
        <div className="flex justify-between items-center print:mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">דוח נסיעות לפי משאית</h1>
            <p className="text-gray-600 mt-1">פירוט מלא של כל נסיעות המשאית</p>
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
                משאית *
              </label>
              <select
                value={selectedTruckId || ''}
                onChange={(e) => setSelectedTruckId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- בחר משאית --</option>
                {trucks.map(truck => (
                  <option key={truck.id} value={truck.id}>
                    🚛 {truck.plate_number}
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
                    🚛 {selectedTruck?.plate_number}
                  </h2>
                  <p className="text-gray-600">{selectedTruck?.model || 'משאית'}</p>
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
                <p className="text-2xl font-bold text-orange-900">{summary.avg_per_job.toFixed(0)} ₪</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-medium">סה"כ הכנסה</p>
                <p className="text-3xl font-bold text-purple-900">{summary.total_revenue.toFixed(2)} ₪</p>
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
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">נהג</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">לקוח</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">חומר</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">מאתר</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">לאתר</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">כמות</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700">הכנסה</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(job.scheduled_date).toLocaleDateString('he-IL')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">#{job.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {drivers.find(d => d.id === job.driver_id)?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{job.customer?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{job.material?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{job.from_site?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{job.to_site?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {(job.actual_qty || job.planned_qty || 0).toFixed(2)} {job.unit}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {(job.manual_override_total || job.pricing_total || 0).toFixed(2)} ₪
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr>
                      <td colSpan={7} className="px-4 py-3 text-left font-bold text-gray-900">סה"כ:</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        {summary.total_quantity.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        {summary.total_revenue.toFixed(2)} ₪
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}

        {jobs.length === 0 && !loading && selectedTruckId && dateFrom && dateTo && (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">לא נמצאו נסיעות למשאית זו בתקופה הנבחרת</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
