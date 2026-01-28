'use client'

import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Combobox from '@/components/ui/Combobox'
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
  XCircle,
  CreditCard
} from 'lucide-react'
import { customersApi, statementsApi, paymentsApi } from '@/lib/api'
import Link from 'next/link'

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
  PARTIALLY_PAID: {
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
  const [statements, setStatements] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createCustomerId, setCreateCustomerId] = useState<number | null>(null)
  const [createMonth, setCreateMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentStatement, setPaymentStatement] = useState<any | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState('העברה בנקאית')
  const [paymentReference, setPaymentReference] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [customersRes, statementsRes] = await Promise.all([
        customersApi.getAll(),
        statementsApi.list()
      ])
      setCustomers(customersRes.data || [])
      setStatements(statementsRes.data || [])
    } catch (error) {
      console.error('Failed to load billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPeriodLabel = (from: string, to: string) => {
    const fromDate = new Date(from)
    const toDate = new Date(to)
    const month = fromDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
    return `${month} (${fromDate.toLocaleDateString('he-IL')} - ${toDate.toLocaleDateString('he-IL')})`
  }

  const getDueDate = (periodTo: string) => {
    const d = new Date(periodTo)
    d.setDate(d.getDate() + 30)
    return d
  }

  const getDisplayStatus = (statement: any) => {
    if (statement.status === 'PAID') return 'PAID'
    const due = getDueDate(statement.period_to)
    if (due < new Date()) return 'OVERDUE'
    return statement.status
  }

  const handleCreateStatement = async () => {
    if (!createCustomerId || !createMonth) {
      alert('נא לבחור לקוח וחודש')
      return
    }

    const [year, month] = createMonth.split('-').map(Number)
    const from = new Date(year, month - 1, 1)
    const to = new Date(year, month, 0)
    try {
      await statementsApi.generate({
        customer_id: createCustomerId,
        period_from: from.toISOString().split('T')[0],
        period_to: to.toISOString().split('T')[0]
      })
      setShowCreateModal(false)
      setCreateCustomerId(null)
      await loadData()
    } catch (error: any) {
      alert('שגיאה ביצירת סיכום: ' + (error.response?.data?.detail || error.message))
    }
  }

  const openPaymentModal = (statement: any) => {
    setPaymentStatement(statement)
    setPaymentAmount(statement.balance || 0)
    setPaymentDate(new Date().toISOString().split('T')[0])
    setPaymentMethod('העברה בנקאית')
    setPaymentReference('')
    setShowPaymentModal(true)
  }

  const handleCreatePayment = async () => {
    if (!paymentStatement || !paymentAmount || !paymentDate) {
      alert('נא למלא סכום ותאריך')
      return
    }
    try {
      const paymentRes = await paymentsApi.create({
        customer_id: paymentStatement.customer_id,
        amount: paymentAmount,
        paid_at: paymentDate,
        method: paymentMethod,
        reference: paymentReference || undefined
      })
      await paymentsApi.allocate(paymentRes.data.id, [
        { statement_id: paymentStatement.id, amount: paymentAmount }
      ])
      setShowPaymentModal(false)
      setPaymentStatement(null)
      await loadData()
    } catch (error: any) {
      alert('שגיאה בקבלת תשלום: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleDownloadPdf = async (statementId: number, number: string) => {
    try {
      const res = await statementsApi.downloadPdf(statementId)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `statement_${number}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download statement PDF:', error)
    }
  }

  const { totalRevenue, totalPaid, totalOutstanding, overdueCount } = useMemo(() => {
    const totalRevenue = statements.reduce((sum, s) => sum + Number(s.total || 0), 0)
    const totalPaid = statements.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0)
    const totalOutstanding = totalRevenue - totalPaid
    const overdueCount = statements.filter(s => getDisplayStatus(s) === 'OVERDUE').length
    return { totalRevenue, totalPaid, totalOutstanding, overdueCount }
  }, [statements])

  const filteredStatements = statements.filter(s => {
    const matchesSearch = 
      String(s.number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    
    const displayStatus = getDisplayStatus(s)
    const matchesStatus = statusFilter === 'ALL' || displayStatus === statusFilter
    
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>יצירת סיכום חדש</span>
          </button>
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
              <option value="PARTIALLY_PAID">שולם חלקי</option>
              <option value="PAID">שולם</option>
              <option value="OVERDUE">באיחור</option>
            </select>
          </div>
        </div>

        {/* Statements Table */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="text-center py-12 text-gray-500">טוען נתונים...</div>
          ) : filteredStatements.length === 0 ? (
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
                    const displayStatus = getDisplayStatus(statement) as keyof typeof STATUS_CONFIG
                    const StatusIcon = STATUS_CONFIG[displayStatus].icon
                    const balance = Number(statement.balance ?? (statement.total - statement.paid_amount))
                    
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
                          {getPeriodLabel(statement.period_from, statement.period_to)}
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
                            STATUS_CONFIG[displayStatus].color
                          }`}>
                            <StatusIcon className="w-3 h-3" />
                            {STATUS_CONFIG[displayStatus].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              className="text-blue-600 hover:text-blue-800"
                              title="הורדת PDF"
                              onClick={() => handleDownloadPdf(statement.id, statement.number)}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {statement.status === 'DRAFT' && (
                              <button className="text-green-600 hover:text-green-800">
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                            {balance > 0 && (
                              <button
                                className="text-purple-600 hover:text-purple-800"
                                onClick={() => openPaymentModal(statement)}
                                title="קבלת תשלום"
                              >
                                <CreditCard className="w-4 h-4" />
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

        {/* Create Statement Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">יצירת סיכום חודשי</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">לקוח</label>
                  <Combobox
                    placeholder="חפש לקוח..."
                    options={customers.map((c) => ({
                      value: c.id,
                      label: c.name,
                      subLabel: c.vat_id || c.contact_name || ''
                    }))}
                    value={createCustomerId ?? ''}
                    onChange={(value) => setCreateCustomerId(value ? Number(value) : null)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">חודש</label>
                  <input
                    type="month"
                    value={createMonth}
                    onChange={(e) => setCreateMonth(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleCreateStatement}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  צור סיכום
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && paymentStatement && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">קבלת תשלום</h3>
              <div className="text-sm text-gray-600 mb-4">
                {paymentStatement.customer_name} • {paymentStatement.number}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">סכום</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">תאריך תשלום</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">אמצעי תשלום</label>
                  <input
                    type="text"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">אסמכתא</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleCreatePayment}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  קבל תשלום
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
