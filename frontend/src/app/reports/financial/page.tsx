'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar,
  Download, Filter, Truck, Users, Package, Fuel,
  Wrench, AlertCircle, FileText, BarChart3, PieChart
} from 'lucide-react'
import { jobsApi, customersApi, trucksApi, materialsApi, expensesApi } from '@/lib/api'
import api from '@/lib/api'

interface RevenueData {
  customer_name: string
  customer_id: number
  total_revenue: number
  total_jobs: number
  avg_per_job: number
}

interface TruckProfitability {
  truck_id: number
  truck_plate: string
  total_revenue: number
  total_expenses: number
  profit: number
  profit_margin: number
  jobs_count: number
}

interface ExpenseByCategory {
  category: string
  total: number
  count: number
  avg: number
}

interface AgingBucket {
  customer_name: string
  current: number      // 0-30 days
  days_30_60: number
  days_60_90: number
  over_90: number
  total: number
}

export default function FinancialReportsPage() {
  const [loading, setLoading] = useState(true)
  const [activeReport, setActiveReport] = useState<string>('revenue')
  
  // Filters
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [selectedCustomer, setSelectedCustomer] = useState<number | ''>('')
  const [selectedTruck, setSelectedTruck] = useState<number | ''>('')
  
  // Reference Data
  const [customers, setCustomers] = useState<any[]>([])
  const [trucks, setTrucks] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  
  // Report Data
  const [revenueByCustomer, setRevenueByCustomer] = useState<RevenueData[]>([])
  const [revenueByMaterial, setRevenueByMaterial] = useState<any[]>([])
  const [truckProfitability, setTruckProfitability] = useState<TruckProfitability[]>([])
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([])
  const [agingReport, setAgingReport] = useState<AgingBucket[]>([])
  const [fuelExpenses, setFuelExpenses] = useState<any[]>([])
  
  // Summary Stats
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [netProfit, setNetProfit] = useState(0)
  const [profitMargin, setProfitMargin] = useState(0)

  useEffect(() => {
    loadReferenceData()
  }, [])

  useEffect(() => {
    if (customers.length > 0) {
      loadReportData()
    }
  }, [dateFrom, dateTo, selectedCustomer, selectedTruck, activeReport])

  const loadReferenceData = async () => {
    try {
      const [customersRes, trucksRes, materialsRes] = await Promise.all([
        customersApi.getAll(),
        trucksApi.getAll(),
        materialsApi.getAll()
      ])
      setCustomers(customersRes.data || [])
      setTrucks(trucksRes.data || [])
      setMaterials(materialsRes.data || [])
    } catch (error) {
      console.error('Failed to load reference data:', error)
    }
  }

  const loadReportData = async () => {
    setLoading(true)
    try {
      // Load jobs with financial data (max 200 per backend validation)
      const jobsRes = await jobsApi.list({
        limit: 200
      })
      const jobs = jobsRes.data || []
      
      // Filter by date range
      const filteredJobs = jobs.filter((job: any) => {
        const jobDate = new Date(job.scheduled_date)
        const from = new Date(dateFrom)
        const to = new Date(dateTo)
        return jobDate >= from && jobDate <= to && job.status === 'CLOSED'
      })

      // Calculate revenue by customer
      const revenueMap = new Map<number, RevenueData>()
      filteredJobs.forEach((job: any) => {
        if (!job.customer_id) return
        
        const revenue = job.manual_override_total || job.pricing_total || 0
        const existing = revenueMap.get(job.customer_id)
        
        if (existing) {
          existing.total_revenue += revenue
          existing.total_jobs += 1
          existing.avg_per_job = existing.total_revenue / existing.total_jobs
        } else {
          const customer = customers.find(c => c.id === job.customer_id)
          revenueMap.set(job.customer_id, {
            customer_id: job.customer_id,
            customer_name: customer?.name || `לקוח #${job.customer_id}`,
            total_revenue: revenue,
            total_jobs: 1,
            avg_per_job: revenue
          })
        }
      })
      
      const revenueData = Array.from(revenueMap.values()).sort((a, b) => b.total_revenue - a.total_revenue)
      setRevenueByCustomer(revenueData)
      
      // Calculate total revenue
      const totalRev = revenueData.reduce((sum, item) => sum + item.total_revenue, 0)
      setTotalRevenue(totalRev)
      
      // Revenue by material
      const materialMap = new Map<number, any>()
      filteredJobs.forEach((job: any) => {
        const revenue = job.manual_override_total || job.pricing_total || 0
        const existing = materialMap.get(job.material_id)
        
        if (existing) {
          existing.total_revenue += revenue
          existing.total_jobs += 1
        } else {
          const material = materials.find(m => m.id === job.material_id)
          materialMap.set(job.material_id, {
            material_id: job.material_id,
            material_name: material?.name || `חומר #${job.material_id}`,
            total_revenue: revenue,
            total_jobs: 1
          })
        }
      })
      setRevenueByMaterial(Array.from(materialMap.values()).sort((a, b) => b.total_revenue - a.total_revenue))
      
      // Load expenses
      const expensesRes = await expensesApi.list({
        from_date: dateFrom,
        to_date: dateTo
      })
      const expenses = expensesRes.data || []
      
      // Expenses by category
      const categoryMap = new Map<string, ExpenseByCategory>()
      expenses.forEach((exp: any) => {
        const existing = categoryMap.get(exp.category)
        if (existing) {
          existing.total += exp.amount
          existing.count += 1
          existing.avg = existing.total / existing.count
        } else {
          categoryMap.set(exp.category, {
            category: exp.category,
            total: exp.amount,
            count: 1,
            avg: exp.amount
          })
        }
      })
      setExpensesByCategory(Array.from(categoryMap.values()).sort((a, b) => b.total - a.total))
      
      const totalExp = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0)
      setTotalExpenses(totalExp)
      
      // Calculate net profit
      const profit = totalRev - totalExp
      setNetProfit(profit)
      setProfitMargin(totalRev > 0 ? (profit / totalRev) * 100 : 0)
      
      // Truck profitability
      const truckMap = new Map<number, TruckProfitability>()
      filteredJobs.forEach((job: any) => {
        if (!job.truck_id) return
        
        const revenue = job.manual_override_total || job.pricing_total || 0
        const existing = truckMap.get(job.truck_id)
        
        if (existing) {
          existing.total_revenue += revenue
          existing.jobs_count += 1
        } else {
          const truck = trucks.find(t => t.id === job.truck_id)
          truckMap.set(job.truck_id, {
            truck_id: job.truck_id,
            truck_plate: truck?.plate_number || `משאית #${job.truck_id}`,
            total_revenue: revenue,
            total_expenses: 0,
            profit: 0,
            profit_margin: 0,
            jobs_count: 1
          })
        }
      })
      
      // Add expenses to trucks
      expenses.forEach((exp: any) => {
        if (exp.truck_id && truckMap.has(exp.truck_id)) {
          const truck = truckMap.get(exp.truck_id)!
          truck.total_expenses += exp.amount
        }
      })
      
      // Calculate profit
      truckMap.forEach(truck => {
        truck.profit = truck.total_revenue - truck.total_expenses
        truck.profit_margin = truck.total_revenue > 0 ? (truck.profit / truck.total_revenue) * 100 : 0
      })
      
      setTruckProfitability(Array.from(truckMap.values()).sort((a, b) => b.profit - a.profit))
      
      // Fuel expenses by truck
      const fuelByTruck = expenses
        .filter((exp: any) => exp.category === 'דלק')
        .reduce((acc: any, exp: any) => {
          const truckId = exp.truck_id
          if (!truckId) return acc
          
          const existing = acc.find((item: any) => item.truck_id === truckId)
          if (existing) {
            existing.total += exp.amount
            existing.count += 1
          } else {
            const truck = trucks.find(t => t.id === truckId)
            acc.push({
              truck_id: truckId,
              truck_plate: truck?.plate_number || `משאית #${truckId}`,
              total: exp.amount,
              count: 1
            })
          }
          return acc
        }, [])
      setFuelExpenses(fuelByTruck.sort((a: any, b: any) => b.total - a.total))
      
    } catch (error) {
      console.error('Failed to load report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    alert('ייצוא Excel יבוצע בקרוב')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount)
  }

  const reports = [
    { id: 'revenue', name: 'הכנסות', icon: DollarSign },
    { id: 'profitability', name: 'רווחיות משאיות', icon: Truck },
    { id: 'expenses', name: 'הוצאות', icon: TrendingDown },
    { id: 'aging', name: 'חובות לקוחות', icon: AlertCircle },
    { id: 'fuel', name: 'דלק', icon: Fuel },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-blue-600" />
              דוחות פיננסיים
            </h1>
            <p className="text-gray-600 mt-1">מעקב אחר הכנסות, הוצאות ורווחיות</p>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            ייצא Excel
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">סה"כ הכנסות</span>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">סה"כ הוצאות</span>
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">רווח נקי</span>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">שולי רווח</span>
              <PieChart className="w-5 h-5 text-purple-600" />
            </div>
            <div className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              {profitMargin.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">סינון</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מתאריך
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
                עד תאריך
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                לקוח
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">כל הלקוחות</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                משאית
              </label>
              <select
                value={selectedTruck}
                onChange={(e) => setSelectedTruck(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">כל המשאיות</option>
                {trucks.map(truck => (
                  <option key={truck.id} value={truck.id}>
                    {truck.plate_number}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Report Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {reports.map(report => {
                const Icon = report.icon
                return (
                  <button
                    key={report.id}
                    onClick={() => setActiveReport(report.id)}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeReport === report.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {report.name}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">טוען נתונים...</p>
              </div>
            ) : (
              <>
                {/* Revenue Report */}
                {activeReport === 'revenue' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-900">הכנסות לפי לקוח</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">לקוח</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">נסיעות</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סה"כ הכנסות</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ממוצע לנסיעה</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% מסך הכנסות</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {revenueByCustomer.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.customer_name}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{item.total_jobs}</td>
                              <td className="px-6 py-4 text-sm font-bold text-green-600">{formatCurrency(item.total_revenue)}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(item.avg_per_job)}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {((item.total_revenue / totalRevenue) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mt-8">הכנסות לפי חומר</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {revenueByMaterial.map((item, idx) => (
                        <div key={idx} className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">{item.material_name}</span>
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="text-2xl font-bold text-blue-600">{formatCurrency(item.total_revenue)}</div>
                          <div className="text-sm text-gray-600 mt-1">{item.total_jobs} נסיעות</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Truck Profitability */}
                {activeReport === 'profitability' && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">רווחיות לפי משאית</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">משאית</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">נסיעות</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">הכנסות</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">הוצאות</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">רווח</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שולי רווח</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {truckProfitability.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.truck_plate}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{item.jobs_count}</td>
                              <td className="px-6 py-4 text-sm text-green-600">{formatCurrency(item.total_revenue)}</td>
                              <td className="px-6 py-4 text-sm text-red-600">{formatCurrency(item.total_expenses)}</td>
                              <td className={`px-6 py-4 text-sm font-bold ${item.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {formatCurrency(item.profit)}
                              </td>
                              <td className={`px-6 py-4 text-sm font-bold ${item.profit_margin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {item.profit_margin.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Expenses */}
                {activeReport === 'expenses' && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">הוצאות לפי קטגוריה</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {expensesByCategory.map((item, idx) => (
                        <div key={idx} className="bg-red-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">{item.category}</span>
                            <Wrench className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="text-2xl font-bold text-red-600">{formatCurrency(item.total)}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {item.count} פעולות | ממוצע: {formatCurrency(item.avg)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aging Report */}
                {activeReport === 'aging' && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">חובות לקוחות (Aging)</h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                      <p className="text-amber-800">
                        <AlertCircle className="w-5 h-5 inline-block ml-2" />
                        דוח זה יוצג כאשר תהיה מערכת ניהול חשבוניות ותשלומים מלאה
                      </p>
                    </div>
                  </div>
                )}

                {/* Fuel */}
                {activeReport === 'fuel' && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">הוצאות דלק לפי משאית</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">משאית</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תדלוקים</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סה"כ הוצאה</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ממוצע לתדלוק</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {fuelExpenses.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.truck_plate}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{item.count}</td>
                              <td className="px-6 py-4 text-sm font-bold text-orange-600">{formatCurrency(item.total)}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(item.total / item.count)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
