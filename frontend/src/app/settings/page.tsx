'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/lib/stores/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import dynamic from 'next/dynamic'
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Database,
  Mail,
  Save,
  Building2,
  Users
} from 'lucide-react'

// Dynamically import the Users Management component
const UsersManagementPage = dynamic(() => import('./users/page'), { ssr: false })

type SettingsTab = 'profile' | 'organization' | 'users' | 'notifications' | 'security' | 'system'

export default function SettingsPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [saving, setSaving] = useState(false)

  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: ''
  })

  const [orgData, setOrgData] = useState({
    name: 'חברת הובלות בע"מ',
    vatId: '123456789',
    address: 'רחוב הראשי 123, תל אביב',
    phone: '03-1234567',
    email: 'info@company.com'
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNewJob: true,
    emailJobCompleted: true,
    emailPaymentReceived: true,
    smsDriverAssigned: false,
    smsJobCompleted: false
  })

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    alert('השינויים נשמרו בהצלחה')
  }

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'פרופיל משתמש', icon: User },
    { id: 'organization' as SettingsTab, label: 'פרטי ארגון', icon: Building2 },
    { id: 'users' as SettingsTab, label: 'ניהול משתמשים', icon: Users },
    { id: 'notifications' as SettingsTab, label: 'התראות', icon: Bell },
    { id: 'security' as SettingsTab, label: 'אבטחה', icon: Shield },
    { id: 'system' as SettingsTab, label: 'מערכת', icon: Database }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">הגדרות</h1>
          <p className="text-gray-600 mt-1">ניהול הגדרות המערכת והחשבון</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow">
              <nav className="p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">פרופיל משתמש</h2>
                      <p className="text-gray-600">עדכון פרטים אישיים</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          שם מלא
                        </label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          אימייל
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          טלפון
                        </label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          placeholder="050-1234567"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          תפקיד
                        </label>
                        <input
                          type="text"
                          value={user?.roles?.[0] || 'Admin'}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Organization Tab */}
                {activeTab === 'organization' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">פרטי ארגון</h2>
                      <p className="text-gray-600">מידע על החברה</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          שם החברה
                        </label>
                        <input
                          type="text"
                          value={orgData.name}
                          onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ח.פ / ע.מ
                        </label>
                        <input
                          type="text"
                          value={orgData.vatId}
                          onChange={(e) => setOrgData({ ...orgData, vatId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          כתובת
                        </label>
                        <input
                          type="text"
                          value={orgData.address}
                          onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            טלפון
                          </label>
                          <input
                            type="tel"
                            value={orgData.phone}
                            onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            אימייל
                          </label>
                          <input
                            type="email"
                            value={orgData.email}
                            onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Users Management Tab */}
                {activeTab === 'users' && (
                  <div>
                    <UsersManagementPage />
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">התראות</h2>
                      <p className="text-gray-600">הגדרות התראות אימייל וSMS</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">התראות אימייל</h3>
                        <div className="space-y-3">
                          {[
                            { key: 'emailNewJob', label: 'נסיעה חדשה נוצרה' },
                            { key: 'emailJobCompleted', label: 'נסיעה הושלמה' },
                            { key: 'emailPaymentReceived', label: 'תשלום התקבל' }
                          ].map((item) => (
                            <label key={item.key} className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                                onChange={(e) => setNotificationSettings({
                                  ...notificationSettings,
                                  [item.key]: e.target.checked
                                })}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-gray-700">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">התראות SMS</h3>
                        <div className="space-y-3">
                          {[
                            { key: 'smsDriverAssigned', label: 'נהג שובץ לנסיעה' },
                            { key: 'smsJobCompleted', label: 'נסיעה הושלמה' }
                          ].map((item) => (
                            <label key={item.key} className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                                onChange={(e) => setNotificationSettings({
                                  ...notificationSettings,
                                  [item.key]: e.target.checked
                                })}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-gray-700">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">אבטחה</h2>
                      <p className="text-gray-600">שינוי סיסמה והגדרות אבטחה</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          סיסמה נוכחית
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          סיסמה חדשה
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          אימות סיסמה
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        שנה סיסמה
                      </button>
                    </div>
                  </div>
                )}

                {/* System Tab */}
                {activeTab === 'system' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">הגדרות מערכת</h2>
                      <p className="text-gray-600">הגדרות כלליות ותצורה</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          שפת המערכת
                        </label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="he">עברית</option>
                          <option value="en">English</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          אזור זמן
                        </label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="Asia/Jerusalem">ירושלים (GMT+2)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          פורמט תאריך
                        </label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                          <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                        </select>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="font-medium text-gray-900 mb-4">מידע מערכת</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">גרסה:</span>
                            <span className="font-medium">1.0.0</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">עדכון אחרון:</span>
                            <span className="font-medium">25/01/2026</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">סביבה:</span>
                            <span className="font-medium">Production</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'שומר...' : 'שמור שינויים'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
