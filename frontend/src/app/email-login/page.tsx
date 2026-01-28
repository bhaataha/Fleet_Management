'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/stores/auth'
import { authApi } from '@/lib/api'
import Logo from '@/components/ui/Logo'
import { AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function EmailLoginPage() {
  const router = useRouter()
  const { setAuth, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Don't redirect - allow users to login even if they have an old token
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Basic validation
    if (!email || !password) {
      setError('נא למלא את כל השדות')
      setLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError('נא להזין כתובת אימייל תקינה')
      setLoading(false)
      return
    }

    try {
      const response = await authApi.login({ 
        email,
        password
      })
      
      const { access_token, user } = response.data
      
      if (!user || !access_token) {
        throw new Error('תגובה לא תקינה מהשרת')
      }
      
      setAuth(user, access_token)
      
      // Redirect based on user type
      if (user.is_super_admin) {
        router.push('/super-admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (detail) {
        if (Array.isArray(detail)) {
          const messages = detail.map((item: any) => item?.msg).filter(Boolean)
          setError(messages.join(', ') || 'שגיאה בפרטי התחברות')
        } else if (detail === "Incorrect credentials") {
          setError('אימייל או סיסמה שגויים')
        } else if (typeof detail === 'string' && detail.includes("suspended")) {
          setError('הארגון מושעה - אנא פנה לתמיכה')
        } else if (detail === "User account is inactive") {
          setError('חשבון המשתמש אינו פעיל')
        } else if (typeof detail === 'string') {
          setError(detail)
        } else {
          setError('שגיאה בהתחברות')
        }
      } else {
        setError('שגיאה בהתחברות - אנא נסה שוב')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo className="mx-auto mb-4" size="large" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ברוכים הבאים
          </h1>
          <p className="text-gray-600">
            התחבר עם כתובת האימייל שלך
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                כתובת אימייל
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-right"
                  placeholder="your-email@company.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                סיסמה
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pr-10 pl-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-right"
                  placeholder="הזן את הסיסמה שלך"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 ml-2" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  מתחבר...
                </>
              ) : (
                'התחבר'
              )}
            </button>
          </form>

          {/* Alternative Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              נהג?{' '}
              <button
                onClick={() => router.push('/login')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                התחבר עם מספר טלפון
              </button>
            </p>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            צריך עזרה?{' '}
            <a href="mailto:support@truckflow.com" className="font-medium text-blue-600 hover:text-blue-500">
              פנה לתמיכה
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}