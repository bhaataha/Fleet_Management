'use client'

import { User, Phone, Mail, Truck, LogOut, Settings, Bell } from 'lucide-react'

export default function MobileProfilePage() {
  const user = {
    name: 'יוסי כהן',
    phone: '050-1234567',
    email: 'yossi@example.com',
    truck: 'משאית 123-456-78',
    tripsToday: 5,
    tripsMonth: 120,
  }

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-blue-100">{user.truck}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <div className="text-3xl font-bold">{user.tripsToday}</div>
            <div className="text-sm text-blue-100">נסיעות היום</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <div className="text-3xl font-bold">{user.tripsMonth}</div>
            <div className="text-sm text-blue-100">החודש</div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-200">
        <div className="p-4 flex items-center gap-3">
          <Phone className="w-5 h-5 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">טלפון</div>
            <div className="font-medium text-gray-900">{user.phone}</div>
          </div>
        </div>
        <div className="p-4 flex items-center gap-3">
          <Mail className="w-5 h-5 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">דואר אלקטרוני</div>
            <div className="font-medium text-gray-900">{user.email}</div>
          </div>
        </div>
        <div className="p-4 flex items-center gap-3">
          <Truck className="w-5 h-5 text-gray-400" />
          <div>
            <div className="text-sm text-gray-500">משאית</div>
            <div className="font-medium text-gray-900">{user.truck}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900">הגדרות מהירות</h3>

        <button className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center justify-between active:scale-98 transition-transform">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-900">התראות</span>
          </div>
          <div className="text-sm text-gray-500">פעיל</div>
        </button>

        <button className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center justify-between active:scale-98 transition-transform">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-900">הגדרות אפליקציה</span>
          </div>
        </button>

        <button
          onClick={() => {
            localStorage.removeItem('access_token')
            localStorage.removeItem('user')
            window.location.href = '/login'
          }}
          className="w-full bg-red-50 rounded-xl p-4 border border-red-200 flex items-center justify-between active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-600">התנתק</span>
          </div>
        </button>
      </div>

      {/* App Info */}
      <div className="text-center text-sm text-gray-500 pt-4">
        <p>TruckFlow גרסה 2.0.0</p>
        <p className="mt-1">© 2026 כל הזכויות שמורות</p>
      </div>
    </div>
  )
}
