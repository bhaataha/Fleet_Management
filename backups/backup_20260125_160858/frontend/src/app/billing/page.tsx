'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Search,
  Download,
  Send,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import Link from 'next/link'

// Mock data - replace with API calls
const mockStatements = [
  {
    id: 1,
    number: 'INV-2026-001',
    customer_name: 'חברה א\' בע"מ',
    period: 'ינואר 2026',
    total: 45000,
    status: 'PAID',
    paid_amount: 45000,
    date: '2026-01-01',
    due_date: '2026-01-31'
  },
  {
    id: 2,
    number: 'INV-2026-002',
    customer_name: 'חברה ב\' בע"מ',
    period: 'ינואר 2026',
    total: 38000,
    status: 'PARTIAL',
    paid_amount: 20000,
    date: '2026-01-05',
    due_date: '2026-02-04'
  },
  {
    id: 3,
    number: 'INV-2026-003',
    customer_name: 'חברה ג\' בע"מ',
    period: 'ינואר 2026',
    total: 52000,
    status: 'SENT',
    paid_amount: 0,
    date: '2026-01-10',
    due_date: '2026-02-09'
  },
  {
    id: 4,
    number: 'INV-2026-004',
    customer_name: 'חברה א\' בע"מ',
    period: 'ינואר 2026',
    total: 28000,
    status: 'DRAFT',
    paid_amount: 0,
    date: '2026-01-15',
    due_date: '2026-02-14'
  }
]

const STATUS_CONFIG = {
  DRAFT: {
    label: 'טיוטה',
    color: 'bg-gray-100 text-gray-800',
    icon: FileText
  },
  SENT: {
    label: 'נשלח',
    color: 'bg-blue-100 text-blue-800',
    icon: Send
  },
  PARTIAL: {
    label: 'שולם חלקי',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  PAID: {
    label: 'שולם',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  OVERDUE: {
    label: 'באיחור',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  }
}

export default function BillingPage() {
  const { t } = useI18n()
  const [statements, setStatements] = useState(mockStatements)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Calculate summary stats
  const totalRevenue = statements.reduce((sum, s) => sum + s.total, 0)
  const totalPaid = statements.reduce((sum, s) => sum + s.paid_amount, 0)
  const totalOutstanding = totalRevenue - totalPaid
  const overdueCount = statements.filter(s => s.status === 'OVERDUE').length

  const filteredStatements = statements.filter(s => {
    const matchesSearch = 
      s.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">חיוב וגבייה</h1>
            <p className="text-gray-600 mt-1">ניהול חשבוניות, סיכומים ותשלומים</p>
          </div>
          <Link
            href="/billing/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>יצירת סיכום חדש</span>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">סה"כ הכנסות</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">סה"כ נגבה</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">יתרת חובות</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(totalOutstanding)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">חשבוניות באיחור</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש לפי מספר חשבונית או לקוח..."
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">כל הסטטוסים</option>
              <option value="DRAFT">טיוטה</option>
              <option value="SENT">נשלח</option>
              <option value="PARTIAL">שולם חלקי</option>
              <option value="PAID">שולם</option>
              <option value="OVERDUE">באיחור</option>
            </select>
          </div>
        </div>

        {/* Statements Table */}
        <div className="bg-white rounded-lg shadow">
          {filteredStatements.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'לא נמצאו חשבוניות' : 'אין חשבוניות במערכת'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      מספר
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      לקוח
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      תקופה
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      סכום כולל
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      שולם
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      יתרה
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      סטטוס
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStatements.map((statement) => {
                    const StatusIcon = STATUS_CONFIG[statement.status as keyof typeof STATUS_CONFIG].icon
                    const balance = statement.total - statement.paid_amount
                    
                    return (
                      <tr key={statement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/billing/${statement.id}`}
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            {statement.number}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {statement.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {statement.period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {formatCurrency(statement.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-green-600">
                          {formatCurrency(statement.paid_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-orange-600">
                          {formatCurrency(balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_CONFIG[statement.status as keyof typeof STATUS_CONFIG].color
                          }`}>
                            <StatusIcon className="w-3 h-3" />
                            {STATUS_CONFIG[statement.status as keyof typeof STATUS_CONFIG].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button className="text-blue-600 hover:text-blue-800">
                              <Download className="w-4 h-4" />
                            </button>
                            {statement.status === 'DRAFT' && (
                              <button className="text-green-600 hover:text-green-800">
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
