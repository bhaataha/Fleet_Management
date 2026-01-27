'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useI18n } from '@/lib/i18n'
import { trucksApi, jobsApi } from '@/lib/api'
import { ArrowRight, Printer, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import Link from 'next/link'
import type { Truck, Job } from '@/types'
import { formatDate } from '@/lib/utils'

interface TruckStats {
  truck_id: number
  truck_name: string
  total_jobs: number
  total_revenue: number
  total_expenses: number
  profit: number
  profit_margin: number
}

export default function TruckProfitabilityReportPage() {
  const { t } = useI18n()
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().setDate(1)).toISOString().split('T')[0] // First day of month
  )
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [stats, setStats] = useState<TruckStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [dateFrom, dateTo])

  const loadData = async () => {
    setLoading(true)
    try {
      const [trucksRes, jobsRes] = await Promise.all([
        trucksApi.getAll(),
        jobsApi.getAll()
      ])

      const trucksData = trucksRes.data
      const jobsData = jobsRes.data

      // Filter jobs by date range
      const filteredJobs = jobsData.filter((job: Job) => {
        if (!job.scheduled_date) return false
        const jobDate = new Date(job.scheduled_date).toISOString().split('T')[0]
        return jobDate >= dateFrom && jobDate <= dateTo
      })

      // Calculate stats per truck
      const truckStats: TruckStats[] = trucksData.map((truck: Truck) => {
        const truckJobs = filteredJobs.filter((job: Job) => job.truck_id === truck.id)
        const totalRevenue = truckJobs.reduce((sum: number, job: Job) => {
          // Use actual pricing_total if available, otherwise calculate estimate
          const jobRevenue = job.pricing_total
          const numRevenue = typeof jobRevenue === 'string' ? parseFloat(jobRevenue) : Number(jobRevenue)
          return sum + (isNaN(numRevenue) ? 0 : numRevenue)
        }, 0)

        // TODO: Calculate real expenses from expenses table filtered by truck_id
        // For now, show 0 until expense tracking is fully implemented
        const totalExpenses = 0

        return {
          truck_id: truck.id,
          truck_name: truck.plate_number || `משאית #${truck.id}`,
          total_jobs: truckJobs.length,
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          profit: totalRevenue - totalExpenses,
          profit_margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0
        }
      })

      // Sort by profit descending
      truckStats.sort((a, b) => b.profit - a.profit)

      setTrucks(trucksData)
      setJobs(filteredJobs)
      setStats(truckStats)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalStats = {
    revenue: stats.reduce((sum, s) => {
      const rev = typeof s.total_revenue === 'string' ? parseFloat(s.total_revenue) : Number(s.total_revenue)
      return sum + (isNaN(rev) ? 0 : rev)
    }, 0),
    expenses: stats.reduce((sum, s) => {
      const exp = typeof s.total_expenses === 'string' ? parseFloat(s.total_expenses) : Number(s.total_expenses)
      return sum + (isNaN(exp) ? 0 : exp)
    }, 0),
    profit: stats.reduce((sum, s) => {
      const prof = typeof s.profit === 'string' ? parseFloat(s.profit) : Number(s.profit)
      return sum + (isNaN(prof) ? 0 : prof)
    }, 0),
    jobs: stats.reduce((sum, s) => sum + s.total_jobs, 0)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    const headers = ['משאית', 'נסיעות', 'הכנסות', 'הוצאות', 'רווח', 'אחוז רווח']
    const rows = stats.map(s => [
      s.truck_name,
      s.total_jobs,
      s.total_revenue.toFixed(2),
      s.total_expenses.toFixed(2),
      s.profit.toFixed(2),
      s.profit_margin.toFixed(1) + '%'
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `truck-profitability-${dateFrom}-${dateTo}.csv`
    link.click()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">דוח רווחיות לפי משאית</h1>
              <p className="text-gray-600 mt-1">ניתוח הכנסות והוצאות</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              ייצא
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-5 h-5" />
              הדפס
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div className="bg-white rounded-lg shadow p-4 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">מתאריך</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">עד תאריך</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">דוח רווחיות לפי משאית</h1>
          <p className="text-center text-gray-600">
            תקופה: {formatDate(dateFrom)} - {formatDate(dateTo)}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">הכנסות</p>
                <p className="text-2xl font-bold text-blue-600">₪{totalStats.revenue.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">הוצאות</p>
                <p className="text-2xl font-bold text-red-600">₪{totalStats.expenses.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">רווח</p>
                <p className="text-2xl font-bold text-green-600">₪{totalStats.profit.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">נסיעות</p>
                <p className="text-2xl font-bold text-purple-600">{totalStats.jobs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profitability Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">משאית</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">נסיעות</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">הכנסות</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">הוצאות</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">רווח</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">אחוז רווח</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      טוען נתונים...
                    </td>
                  </tr>
                ) : stats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      אין נתונים לתקופה זו
                    </td>
                  </tr>
                ) : (
                  stats.map((stat) => (
                    <tr key={stat.truck_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{stat.truck_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{stat.total_jobs}</td>
                      <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                        ₪{(() => {
                          const rev = typeof stat.total_revenue === 'string' ? parseFloat(stat.total_revenue) : Number(stat.total_revenue)
                          return (isNaN(rev) ? 0 : rev).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        })()}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600 font-medium">
                        ₪{(() => {
                          const exp = typeof stat.total_expenses === 'string' ? parseFloat(stat.total_expenses) : Number(stat.total_expenses)
                          return (isNaN(exp) ? 0 : exp).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        })()}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={stat.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₪{(() => {
                            const prof = typeof stat.profit === 'string' ? parseFloat(stat.profit) : Number(stat.profit)
                            return (isNaN(prof) ? 0 : prof).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          })()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          stat.profit_margin >= 20 ? 'bg-green-100 text-green-800' :
                          stat.profit_margin >= 10 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(() => {
                            const margin = typeof stat.profit_margin === 'string' ? parseFloat(stat.profit_margin) : Number(stat.profit_margin)
                            return (isNaN(margin) ? 0 : margin).toFixed(1)
                          })()}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Note */}
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 print:hidden">
          <p className="text-sm text-yellow-800">
            💡 <strong>הערה:</strong> נתוני ההכנסות מבוססים על מחירון. הוצאות מוערכות ב-30% מההכנסות (להדגמה). 
            יש לשלב נתוני הוצאות בפועל מטבלת ההוצאות.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
