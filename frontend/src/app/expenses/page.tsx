'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { expensesApi, trucksApi, driversApi } from '@/lib/api'
import type { Expense, Truck, Driver } from '@/types'
import { Plus, Trash2, Edit, Search, Filter, Download, Fuel, Wrench, FileText, DollarSign } from 'lucide-react'

// Helper function to format dates
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('he-IL', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  })
}

const EXPENSE_CATEGORIES = [
  'דלק',
  'תיקונים',
  'צמיגים',
  'ביטוח',
  'רישוי',
  'שכר נהג',
  'אגרות',
  'חניה',
  'אחר'
]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  
  // Filters
  const [filterCategory, setFilterCategory] = useState('')
  const [filterTruck, setFilterTruck] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    vendor_name: '',
    truck_id: '',
    driver_id: '',
    note: ''
  })

  useEffect(() => {
    loadData()
  }, [filterCategory, filterTruck, filterDateFrom, filterDateTo])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load expenses with filters
      const params: any = {}
      if (filterCategory) params.category = filterCategory
      if (filterTruck) params.truck_id = parseInt(filterTruck)
      if (filterDateFrom) params.from_date = filterDateFrom
      if (filterDateTo) params.to_date = filterDateTo
      
      const [expensesRes, trucksRes, driversRes] = await Promise.all([
        expensesApi.list(params),
        trucksApi.getAll(),
        driversApi.getAll()
      ])
      
      setExpenses(expensesRes.data)
      setTrucks(trucksRes.data)
      setDrivers(driversRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        expense_date: new Date(formData.expense_date).toISOString(),
        vendor_name: formData.vendor_name || undefined,
        truck_id: formData.truck_id ? parseInt(formData.truck_id) : undefined,
        driver_id: formData.driver_id ? parseInt(formData.driver_id) : undefined,
        note: formData.note || undefined
      }
      
      if (editingExpense) {
        await expensesApi.update(editingExpense.id, payload)
      } else {
        await expensesApi.create(payload)
      }
      
      // Reset form
      setFormData({
        category: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        vendor_name: '',
        truck_id: '',
        driver_id: '',
        note: ''
      })
      setShowForm(false)
      setEditingExpense(null)
      
      // Reload data
      loadData()
    } catch (error: any) {
      console.error('Failed to save expense:', error)
      alert('שגיאה בשמירת ההוצאה: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      category: expense.category,
      amount: expense.amount.toString(),
      expense_date: expense.expense_date.split('T')[0],
      vendor_name: expense.vendor_name || '',
      truck_id: expense.truck_id?.toString() || '',
      driver_id: expense.driver_id?.toString() || '',
      note: expense.note || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק הוצאה זו?')) return
    
    try {
      await expensesApi.delete(id)
      loadData()
    } catch (error) {
      console.error('Failed to delete expense:', error)
      alert('שגיאה במחיקת ההוצאה')
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'דלק': return <Fuel className="w-4 h-4" />
      case 'תיקונים': return <Wrench className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount)
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">טוען הוצאות...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">\n          <div>
            <h1 className="text-3xl font-bold text-gray-900">ניהול הוצאות</h1>
            <p className="text-gray-600 mt-1">מעקב אחר כל ההוצאות של הצי</p>
          </div>
        <button
          onClick={() => {
            setEditingExpense(null)
            setFormData({
              category: '',
              amount: '',
              expense_date: new Date().toISOString().split('T')[0],
              vendor_name: '',
              truck_id: '',
              driver_id: '',
              note: ''
            })
            setShowForm(true)
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          הוצאה חדשה
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-lg p-6 text-white mb-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <p className="text-white/80 text-sm">סה"כ הוצאות (מסונן)</p>
            <p className="text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
            <p className="text-white/80 text-sm mt-1">{expenses.length} הוצאות</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">סינון</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">הכל</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Truck Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">משאית</label>
            <select
              value={filterTruck}
              onChange={(e) => setFilterTruck(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">הכל</option>
              {trucks.map(truck => (
                <option key={truck.id} value={truck.id}>{truck.plate_number}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">מתאריך</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">עד תאריך</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {(filterCategory || filterTruck || filterDateFrom || filterDateTo) && (
          <button
            onClick={() => {
              setFilterCategory('')
              setFilterTruck('')
              setFilterDateFrom('')
              setFilterDateTo('')
            }}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700"
          >
            נקה סינונים
          </button>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingExpense ? 'עריכת הוצאה' : 'הוצאה חדשה'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    קטגוריה <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">בחר קטגוריה</option>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    סכום <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תאריך <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Vendor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ספק / תחנת דלק
                  </label>
                  <input
                    type="text"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    placeholder="שם הספק"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Truck */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    משאית
                  </label>
                  <select
                    value={formData.truck_id}
                    onChange={(e) => setFormData({ ...formData, truck_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">ללא משאית ספציפית</option>
                    {trucks.map(truck => (
                      <option key={truck.id} value={truck.id}>{truck.plate_number}</option>
                    ))}
                  </select>
                </div>

                {/* Driver */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    נהג
                  </label>
                  <select
                    value={formData.driver_id}
                    onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">ללא נהג ספציפי</option>
                    {drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>{driver.name}</option>
                    ))}
                  </select>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    הערות
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    rows={3}
                    placeholder="הערות נוספות..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingExpense ? 'עדכן' : 'שמור'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingExpense(null)
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תאריך
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  קטגוריה
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סכום
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ספק
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  משאית
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  נהג
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  הערות
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>לא נמצאו הוצאות</p>
                    <p className="text-sm mt-1">הוסף הוצאה חדשה כדי להתחיל</p>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(expense.expense_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(expense.category)}
                        <span className="text-sm text-gray-900">{expense.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {expense.vendor_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.truck?.plate_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.driver?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {expense.note || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-blue-600 hover:text-blue-800"
                          title="ערוך"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-800"
                          title="מחק"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </DashboardLayout>
  )
}
