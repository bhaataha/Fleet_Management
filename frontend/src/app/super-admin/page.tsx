'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/stores/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { superAdminApi } from '@/lib/api'
import { t } from '@/lib/i18n'

interface Organization {
  id: string
  name: string
  slug: string
  status: 'active' | 'suspended' | 'trial'
  plan_type: 'free' | 'trial' | 'basic' | 'professional' | 'enterprise'
  created_at: string
  trial_ends_at?: string
  max_users: number
  max_trucks: number
  max_drivers: number
  max_customers: number
}

interface SystemStats {
  organizations: {
    total: number
    active: number
    suspended: number
    trial: number
  }
  resources: {
    total_users: number
    total_customers: number
    total_drivers: number
    total_trucks: number
  }
  jobs: {
    total_jobs: number
    completed_jobs: number
    completion_rate: number
  }
}

export default function SuperAdminPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'organizations' | 'stats'>('organizations')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filters, setFilters] = useState({ status: '', plan_type: '', search: '' })

  // Check if user is super admin
  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (!user.is_super_admin) {
      router.push('/dashboard')
      return
    }
  }, [user, router])

  // Load data
  useEffect(() => {
    if (user?.is_super_admin) {
      loadData()
    }
  }, [user, filters])

  const loadData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'organizations') {
        const response = await superAdminApi.listOrganizations(filters)
        console.log('Organizations API response:', response)
        // API returns { total, skip, limit, items: [...] }
        const orgs = response.data?.items || response.data?.organizations || response.data?.data || []
        console.log('Parsed organizations:', orgs)
        setOrganizations(orgs)
      } else {
        const response = await superAdminApi.getSystemStats()
        setStats(response.data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      alert('שגיאה בטעינת נתונים: ' + (error?.response?.data?.detail || error?.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async (orgId: string) => {
    const reason = prompt('סיבת השעיה:')
    if (!reason) return
    
    try {
      await superAdminApi.suspendOrganization(orgId, reason)
      alert('הארגון הושעה בהצלחה')
      loadData()
    } catch (error) {
      alert('שגיאה בהשעיית הארגון')
    }
  }

  const handleActivate = async (orgId: string) => {
    if (!confirm('האם להפעיל את הארגון?')) return
    
    try {
      await superAdminApi.activateOrganization(orgId)
      alert('הארגון הופעל בהצלחה')
      loadData()
    } catch (error) {
      alert('שגיאה בהפעלת הארגון')
    }
  }

  const handleDelete = async (orgId: string, orgName: string) => {
    if (!confirm(`האם למחוק את הארגון "${orgName}"? פעולה זו תמחק את כל הנתונים ולא ניתנת לביטול!`)) return
    if (!confirm('האם אתה בטוח לחלוטין? כל המשתמשים, הלקוחות, והמשאיות יימחקו!')) return
    
    try {
      await superAdminApi.deleteOrganization(orgId, true)
      alert('הארגון נמחק בהצלחה')
      loadData()
    } catch (error) {
      alert('שגיאה במחיקת הארגון')
    }
  }

  const handleImpersonate = (orgId: string) => {
    localStorage.setItem('impersonated_org_id', orgId)
    alert('מעתה תראה את המערכת מנקודת המבט של ארגון זה. רענן את הדף.')
    window.location.href = '/dashboard'
  }

  const clearImpersonation = () => {
    localStorage.removeItem('impersonated_org_id')
    alert('חזרת לתצוגת Super Admin')
    window.location.reload()
  }

  if (!user?.is_super_admin) {
    return null
  }

  const impersonatedOrgId = typeof window !== 'undefined' ? localStorage.getItem('impersonated_org_id') : null

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ניהול מערכת - Super Admin</h1>
          <p className="mt-2 text-sm text-gray-600">
            ניהול כל הארגונים והמשתמשים במערכת
          </p>
          
          {impersonatedOrgId && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-yellow-400 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-yellow-800">
                    מצב Impersonation: אתה רואה את המערכת כארגון {impersonatedOrgId}
                  </span>
                </div>
                <button
                  onClick={clearImpersonation}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                >
                  חזור לתצוגת Super Admin
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 space-x-reverse">
            <button
              onClick={() => setActiveTab('organizations')}
              className={`${
                activeTab === 'organizations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              ארגונים ({organizations.length})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              סטטיסטיקות מערכת
            </button>
          </nav>
        </div>

        {/* Organizations Tab */}
        {activeTab === 'organizations' && (
          <div>
            {/* Filters & Actions */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">כל הסטטוסים</option>
                  <option value="active">פעיל</option>
                  <option value="suspended">מושעה</option>
                  <option value="trial">נסיון</option>
                </select>
                
                <select
                  value={filters.plan_type}
                  onChange={(e) => setFilters({ ...filters, plan_type: e.target.value })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">כל התוכניות</option>
                  <option value="free">חינם</option>
                  <option value="trial">נסיון</option>
                  <option value="basic">בסיסי</option>
                  <option value="professional">מקצועי</option>
                  <option value="enterprise">ארגוני</option>
                </select>
                
                <input
                  type="text"
                  placeholder="חיפוש..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                ארגון חדש
              </button>
            </div>

            {/* Organizations Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ארגון
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      סטטוס
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      תוכנית
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      מגבלות
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      תאריך יצירה
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        טוען...
                      </td>
                    </tr>
                  ) : !Array.isArray(organizations) || organizations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        לא נמצאו ארגונים
                      </td>
                    </tr>
                  ) : (
                    organizations.map((org) => (
                      <tr key={org.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{org.name}</div>
                          <div className="text-sm text-gray-500">{org.slug}</div>
                          <div className="text-xs text-gray-400">ID: {org.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            org.status === 'active' ? 'bg-green-100 text-green-800' :
                            org.status === 'suspended' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {org.status === 'active' ? 'פעיל' : org.status === 'suspended' ? 'מושעה' : 'נסיון'}
                          </span>
                          {org.trial_ends_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              נסיון עד {new Date(org.trial_ends_at).toLocaleDateString('he-IL')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {org.plan_type === 'free' ? 'חינם' :
                           org.plan_type === 'trial' ? 'נסיון' :
                           org.plan_type === 'basic' ? 'בסיסי' :
                           org.plan_type === 'professional' ? 'מקצועי' :
                           'ארגוני'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>משתמשים: {org.max_users}</div>
                          <div>משאיות: {org.max_trucks}</div>
                          <div>נהגים: {org.max_drivers}</div>
                          <div>לקוחות: {org.max_customers}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(org.created_at).toLocaleDateString('he-IL')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleImpersonate(org.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="צפה כארגון זה"
                          >
                            👁️ צפה
                          </button>
                          
                          {org.status === 'active' ? (
                            <button
                              onClick={() => handleSuspend(org.id)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              השעה
                            </button>
                          ) : org.status === 'suspended' ? (
                            <button
                              onClick={() => handleActivate(org.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              הפעל
                            </button>
                          ) : null}
                          
                          <button
                            onClick={() => router.push(`/super-admin/organizations/${org.id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            ערוך
                          </button>
                          
                          <button
                            onClick={() => handleDelete(org.id, org.name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            מחק
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Organizations Stats */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="mr-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">סה"כ ארגונים</dt>
                        <dd className="text-3xl font-semibold text-gray-900">{stats.organizations.total}</dd>
                      </dl>
                      <div className="mt-2 text-xs text-gray-500">
                        <div>פעילים: {stats.organizations.active}</div>
                        <div>מושעים: {stats.organizations.suspended}</div>
                        <div>נסיון: {stats.organizations.trial}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Users Stats */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="mr-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">סה"כ משתמשים</dt>
                        <dd className="text-3xl font-semibold text-gray-900">{stats.resources.total_users}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customers Stats */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="mr-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">סה"כ לקוחות</dt>
                        <dd className="text-3xl font-semibold text-gray-900">{stats.resources.total_customers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trucks Stats */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                    </div>
                    <div className="mr-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">סה"כ משאיות</dt>
                        <dd className="text-3xl font-semibold text-gray-900">{stats.resources.total_trucks}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drivers Stats */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="mr-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">סה"כ נהגים</dt>
                        <dd className="text-3xl font-semibold text-gray-900">{stats.resources.total_drivers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Jobs Stats */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div className="mr-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">סה"כ נסיעות</dt>
                        <dd className="text-3xl font-semibold text-gray-900">{stats.jobs.total_jobs}</dd>
                      </dl>
                      <div className="mt-2 text-xs text-gray-500">
                        <div>הושלמו: {stats.jobs.completed_jobs}</div>
                        <div>אחוז השלמה: {stats.jobs.completion_rate.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Organization Modal */}
        {showCreateModal && (
          <CreateOrganizationModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false)
              loadData()
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

// Create Organization Modal Component
function CreateOrganizationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    vat_id: '',
    plan_type: 'trial',
    max_users: 10,
    max_trucks: 10,
    max_drivers: 10,
    max_customers: 50,
    trial_days: 30,
    admin_name: '',
    admin_phone: '',
    admin_email: '',
    admin_password: '',
    admin_password_confirm: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // בדיקת תקינות סיסמאות
    if (formData.admin_password !== formData.admin_password_confirm) {
      alert('הסיסמאות לא תואמות')
      return
    }
    
    if (formData.admin_password.length < 6) {
      alert('הסיסמה חייבת להכיל לפחות 6 תווים')
      return
    }
    
    setLoading(true)
    
    try {
      await superAdminApi.createOrganization(formData)
      alert('הארגון והמשתמש נוצרו בהצלחה!')
      onSuccess()
    } catch (error: any) {
      alert('שגיאה ביצירת הארגון: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                יצירת ארגון חדש
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">שם הארגון</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Slug (באנגלית, ללא רווחים)</label>
                  <input
                    type="text"
                    required
                    pattern="[a-z0-9\-]+"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="my-company"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">איש קשר</label>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="שם מלא"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">טלפון ארגון</label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="050-1234567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">אימייל ארגון</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="info@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">כתובת</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="רחוב עיר מיקוד"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">עיר</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="תל אביב"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">ח.פ / ע.מ</label>
                    <input
                      type="text"
                      value={formData.vat_id}
                      onChange={(e) => setFormData({ ...formData, vat_id: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="123456789"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">סוג תוכנית</label>
                  <select
                    value={formData.plan_type}
                    onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="free">חינם</option>
                    <option value="trial">נסיון</option>
                    <option value="basic">בסיסי</option>
                    <option value="professional">מקצועי</option>
                    <option value="enterprise">ארגוני</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">מקסימום משתמשים</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_users}
                      onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">מקסימום משאיות</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_trucks}
                      onChange={(e) => setFormData({ ...formData, max_trucks: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">מקסימום נהגים</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_drivers}
                      onChange={(e) => setFormData({ ...formData, max_drivers: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">מקסימום לקוחות</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_customers}
                      onChange={(e) => setFormData({ ...formData, max_customers: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">👤 משתמש מנהל ראשוני</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    פרטי המשתמש הראשון שיוכל להתחבר למערכת
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">שם מלא *</label>
                      <input
                        type="text"
                        required
                        value={formData.admin_name}
                        onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="ישראל ישראלי"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">טלפון (להתחברות) *</label>
                      <input
                        type="tel"
                        required
                        value={formData.admin_phone}
                        onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="050-1234567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">אימייל משתמש *</label>
                    <input
                      type="email"
                      required
                      value={formData.admin_email}
                      onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="admin@example.com"
                    />
                    <p className="mt-1 text-xs text-gray-500">זה לא אותו דבר כמו אימייל הארגון - זה אימייל אישי של המנהל</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">סיסמה *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.admin_password}
                      onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="לפחות 6 תווים"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">אימות סיסמה *</label>
                    <input
                      type="password"
                      required
                      value={formData.admin_password_confirm}
                      onChange={(e) => setFormData({ ...formData, admin_password_confirm: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="הקלד שוב את הסיסמה"
                    />
                    {formData.admin_password !== formData.admin_password_confirm && formData.admin_password_confirm && (
                      <p className="mt-1 text-xs text-red-600">הסיסמאות לא תואמות</p>
                    )}
                  </div>
                </div>

                {formData.plan_type === 'trial' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ימי נסיון</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.trial_days}
                      onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? 'יוצר...' : 'צור ארגון'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:mr-3 sm:w-auto sm:text-sm"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
