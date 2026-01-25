'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/stores/auth'
import { useI18n } from '@/lib/i18n'
import { authApi } from '@/lib/api'
import Logo from '@/components/ui/Logo'
import { AlertCircle, Truck, Globe } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth, isAuthenticated } = useAuth()
  const { t, language, setLanguage } = useI18n()
  const [email, setEmail] = useState('admin@fleet.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authApi.login({ email, password })
      const { access_token, user } = response.data
      
      setAuth(user, access_token)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || t('auth.invalidCredentials'))
    } finally {
      setLoading(false)
    }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-pulse">
          <Logo size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        {/* Language Toggle */}
        <div className="flex justify-end mb-4">
          <div className="relative">
            <button
              onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <Globe className="w-4 h-4" />
              {getLanguageLabel()}
            </button>
            {languageMenuOpen && (
              <div className="absolute left-0 mt-2 w-36 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
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
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="md" />
            </div>
            <p className="text-gray-600">{t('auth.welcome')}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="admin@example.com"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : t('auth.loginButton')}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              Demo: admin@example.com / admin123
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Fleet Management System © 2026
        </p>
      </div>
    </div>
  )
}
