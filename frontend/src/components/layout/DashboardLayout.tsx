'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/stores/auth'
import { useI18n } from '@/lib/i18n'
import Logo from '@/components/ui/Logo'
import Footer from '@/components/layout/Footer'
import { superAdminApi } from '@/lib/api'
import {
  LayoutDashboard,
  Truck,
  Calendar,
  Users,
  MapPin,
  Package,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  Shield,
} from 'lucide-react'

const navigation = [
  { name: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'nav.dispatch', href: '/dispatch', icon: Calendar },
  { name: 'nav.jobs', href: '/jobs', icon: Truck },
  { name: 'מעקב צי', href: '/fleet-tracking', icon: MapPin },
  { name: 'nav.customers', href: '/customers', icon: Users },
  { name: 'nav.sites', href: '/sites', icon: MapPin },
  { name: 'nav.fleet', href: '/fleet', icon: Truck },
  { name: 'nav.materials', href: '/materials', icon: Package },
  { name: 'nav.pricing', href: '/pricing', icon: DollarSign },
  { name: 'nav.billing', href: '/billing', icon: FileText },
  { name: 'nav.reports', href: '/reports', icon: BarChart3 },
  { name: 'nav.settings', href: '/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { t, language, setLanguage } = useI18n()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)
  const [orgSelectorOpen, setOrgSelectorOpen] = useState(false)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [impersonatedOrgId, setImpersonatedOrgId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    // Load impersonation state
    if (typeof window !== 'undefined') {
      setImpersonatedOrgId(localStorage.getItem('impersonated_org_id'))
    }
    
    // Load organizations for Super Admin
    if (user?.is_super_admin) {
      loadOrganizations()
    }
  }, [])

  const loadOrganizations = async () => {
    try {
      const response = await superAdminApi.listOrganizations()
      // Handle paginated response format: {total, skip, limit, items: [...]}
      const orgs = response.data?.items || response.data?.organizations || (Array.isArray(response.data) ? response.data : [])
      console.log('Loaded organizations:', orgs)
      setOrganizations(Array.isArray(orgs) ? orgs : [])
    } catch (error) {
      console.error('Failed to load organizations:', error)
      setOrganizations([]) // Set empty array on error
    }
  }

  const handleImpersonate = (orgId: string) => {
    localStorage.setItem('impersonated_org_id', orgId)
    setImpersonatedOrgId(orgId)
    setOrgSelectorOpen(false)
    window.location.reload()
  }

  const clearImpersonation = () => {
    localStorage.removeItem('impersonated_org_id')
    setImpersonatedOrgId(null)
    window.location.reload()
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleLanguageChange = (lang: 'he' | 'en' | 'ar') => {
    setLanguage(lang)
    setLanguageMenuOpen(false)
  }

  const getLanguageLabel = () => {
    switch (language) {
      case 'he': return 'עברית'
      case 'en': return 'English'
      case 'ar': return 'العربية'
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 ${language === 'he' ? 'right-0' : 'left-0'}
          z-50 w-64 bg-white border-${language === 'he' ? 'l' : 'r'} border-gray-200
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : language === 'he' ? 'translate-x-full' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <Link href="/dashboard">
              <Logo size="sm" />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {/* Super Admin Link */}
            {user?.is_super_admin && (
              <Link
                href="/super-admin"
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                  transition-colors mb-2 border-2 border-purple-200
                  ${
                    pathname === '/super-admin'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }
                `}
              >
                <Shield className="w-5 h-5" />
                <span>Super Admin</span>
              </Link>
            )}
            
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                    transition-colors
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{t(item.name)}</span>
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-semibold">
                  {user?.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <button
                  onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  {getLanguageLabel()}
                </button>
                {languageMenuOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border rounded-lg shadow-lg overflow-hidden z-50">
                    <button
                      onClick={() => handleLanguageChange('he')}
                      className={`w-full text-center px-4 py-2 text-sm hover:bg-gray-100 ${language === 'he' ? 'bg-blue-50 font-semibold text-blue-600' : ''}`}
                    >
                      עברית
                    </button>
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`w-full text-center px-4 py-2 text-sm hover:bg-gray-100 ${language === 'en' ? 'bg-blue-50 font-semibold text-blue-600' : ''}`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => handleLanguageChange('ar')}
                      className={`w-full text-center px-4 py-2 text-sm hover:bg-gray-100 ${language === 'ar' ? 'bg-blue-50 font-semibold text-blue-600' : ''}`}
                    >
                      العربية
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('auth.logout')}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`${language === 'he' ? 'lg:mr-64' : 'lg:ml-64'} flex flex-col min-h-screen`}>
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          {/* Super Admin Controls */}
          <div className="flex-1 flex items-center justify-end gap-4">
            {/* Impersonation Banner */}
            {user?.is_super_admin && impersonatedOrgId && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-1.5">
                <Shield className="w-4 h-4 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-800">
                  Viewing as Org: {impersonatedOrgId.slice(0, 8)}...
                </span>
                <button
                  onClick={clearImpersonation}
                  className="text-xs text-yellow-800 hover:text-yellow-900 underline font-medium"
                >
                  Clear
                </button>
              </div>
            )}
            
            {/* Organization Selector for Super Admin */}
            {user?.is_super_admin && (
              <div className="relative">
                <button
                  onClick={() => setOrgSelectorOpen(!orgSelectorOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
                >
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Switch Org</span>
                </button>
                
                {orgSelectorOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900">Select Organization</h3>
                      <p className="text-xs text-gray-600 mt-0.5">View system as this organization</p>
                    </div>
                    
                    {impersonatedOrgId && (
                      <button
                        onClick={clearImpersonation}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 border-b border-gray-100 bg-blue-100 font-medium text-blue-700"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <span>Clear Impersonation (View as Super Admin)</span>
                        </div>
                      </button>
                    )}
                    
                    {organizations.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        Loading organizations...
                      </div>
                    ) : !Array.isArray(organizations) ? (
                      <div className="px-4 py-8 text-center text-sm text-red-500">
                        Error loading organizations
                      </div>
                    ) : (
                      organizations.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => handleImpersonate(org.id)}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100 ${
                            impersonatedOrgId === org.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="font-medium text-gray-900">{org.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{org.slug}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              org.status === 'active' ? 'bg-green-100 text-green-800' :
                              org.status === 'suspended' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {org.status}
                            </span>
                            <span className="text-xs text-gray-500">{org.plan_type}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Super Admin Dashboard Link */}
            {user?.is_super_admin && (
              <Link
                href="/super-admin"
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-medium"
              >
                <Shield className="w-4 h-4" />
                Super Admin
              </Link>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>

        {/* Footer */}
        <Footer variant="app" />
      </div>
    </div>
  )
}
