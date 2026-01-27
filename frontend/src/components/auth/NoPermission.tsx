'use client'

import { Shield } from 'lucide-react'

export default function NoPermission({ message }: { message?: string }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-12 h-12 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          אין הרשאת גישה
        </h2>
        <p className="text-gray-600 max-w-md">
          {message || 'אין לך הרשאות לצפות בדף זה. נא לפנות למנהל המערכת.'}
        </p>
      </div>
    </div>
  )
}
