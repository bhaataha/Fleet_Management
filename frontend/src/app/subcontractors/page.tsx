'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { subcontractorsApi } from '@/lib/api'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function SubcontractorsPage() {
  const router = useRouter()
  const [subcontractors, setSubcontractors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchSubcontractors()
  }, [search])

  const fetchSubcontractors = async () => {
    try {
      setLoading(true)
      const response = await subcontractorsApi.getAll({ search })
      setSubcontractors(response.data)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'שגיאה בטעינת קבלנים')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">קבלני משנה</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              ➕ קבלן חדש
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="חיפוש לפי שם, חברה, מספר ח.פ או מספר משאית..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <SubcontractorForm onSuccess={() => {
              setShowForm(false)
              fetchSubcontractors()
            }} />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* List */}
        {!loading && subcontractors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subcontractors.map((sub) => (
              <div key={sub.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="mb-4">
                  {/* Truck Number - Primary Identifier */}
                  {sub.truck_plate_number && (
                    <div className="bg-orange-100 border-2 border-orange-400 rounded-lg px-4 py-3 mb-3">
                      <div className="text-xs text-orange-700 font-medium mb-1">מספר משאית (מזהה ראשי)</div>
                      <div className="text-2xl font-bold text-orange-900">🚛 {sub.truck_plate_number}</div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{sub.name}</h3>
                  </div>
                  {sub.company_name && (
                    <p className="text-sm text-gray-500">{sub.company_name}</p>
                  )}
                </div>

                <div className="space-y-2 text-sm mb-4">
                  {sub.phone && (
                    <div>
                      <span className="text-gray-600">📱 </span>
                      <a href={`tel:${sub.phone}`} className="text-blue-600 hover:underline">
                        {sub.phone}
                      </a>
                    </div>
                  )}
                  {sub.vat_id && (
                    <div>
                      <span className="text-gray-600">מס׳ ח.פ: </span>
                      <span className="text-gray-900">{sub.vat_id}</span>
                    </div>
                  )}
                  {sub.payment_terms && (
                    <div>
                      <span className="text-gray-600">תנאי תשלום: </span>
                      <span className="text-gray-900">{sub.payment_terms}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/subcontractors/${sub.id}`}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-center hover:bg-blue-700 transition text-sm"
                  >
                    ✏️ ערוך
                  </Link>
                  <Link
                    href={`/subcontractors/${sub.id}/prices`}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-center hover:bg-green-700 transition text-sm"
                  >
                    💰 מחירונים
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && subcontractors.length === 0 && !search && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">אין קבלני משנה בעדיין</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              ➕ הוסף קבלן משנה
            </button>
          </div>
        )}

        {/* No Results */}
        {!loading && subcontractors.length === 0 && search && (
          <div className="text-center py-12 text-gray-500">
            לא נמצאו קבלנים התואמים ל &quot;{search}&quot;
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

// SubcontractorForm Component
function SubcontractorForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    vat_id: '',
    contact_person: '',
    phone: '',
    email: '',
    truck_plate_number: '',
    payment_terms: 'monthly',
    payment_method: '',
    notes: ''
  })

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    try {
      setLoading(true)
      await subcontractorsApi.create(formData)
      onSuccess()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'שגיאה בשמירה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            שם קבלן
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="אופציונלי - ניתן להשתמש רק במספר משאית"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            שם חברה
          </label>
          <input
            type="text"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            מס׳ ח.פ
          </label>
          <input
            type="text"
            value={formData.vat_id}
            onChange={(e) => setFormData({ ...formData, vat_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            טלפון *
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🚛 מספר משאית *
          </label>
          <input
            type="text"
            required
            value={formData.truck_plate_number}
            onChange={(e) => setFormData({ ...formData, truck_plate_number: e.target.value })}
            placeholder="מספר רישוי (חובה)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold"
          />
          <p className="text-xs text-gray-500 mt-1">⚠️ המשאית היא המזהה העיקרי - כל הלוגיקה עובדת לפי מספר משאית</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            דוא״ל
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            אמצעי תשלום
          </label>
          <select
            value={formData.payment_method}
            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">בחר...</option>
            <option value="transfer">העברה בנקאית</option>
            <option value="check">צ'ק</option>
            <option value="cash">מזומן</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading ? '⏳ שומר...' : '💾 שמור'}
        </button>
      </div>
    </form>
  )
}
