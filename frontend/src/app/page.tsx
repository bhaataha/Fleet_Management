import Link from 'next/link'
import { Truck, Calendar, Users, FileText, Settings } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            מערכת ניהול הובלות עפר
          </h1>
          <p className="text-gray-600 mt-2">Fleet Management System</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dashboard Card */}
          <Link href="/dashboard" className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">לוח בקרה</h2>
                  <p className="text-gray-600">Dashboard</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Dispatch Card */}
          <Link href="/dispatch" className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Truck className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">שיבוץ נסיעות</h2>
                  <p className="text-gray-600">Dispatch Board</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Customers Card */}
          <Link href="/customers" className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">לקוחות ואתרים</h2>
                  <p className="text-gray-600">Customers & Sites</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Fleet Card */}
          <Link href="/fleet" className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Truck className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">צי רכבים</h2>
                  <p className="text-gray-600">Fleet Management</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Billing Card */}
          <Link href="/billing" className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FileText className="w-8 h-8 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">חשבוניות וגבייה</h2>
                  <p className="text-gray-600">Billing & Payments</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Settings Card */}
          <Link href="/settings" className="block">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Settings className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">הגדרות</h2>
                  <p className="text-gray-600">Settings</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-12 bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">מידע על המערכת</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              <strong>סטטוס:</strong> Backend API פעיל ב-
              <a 
                href="http://localhost:8001/docs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                http://localhost:8001/docs
              </a>
            </p>
            <p>
              <strong>תיעוד API:</strong> Swagger UI זמין בכתובת לעיל
            </p>
            <p>
              <strong>משתמש ברירת מחדל:</strong> admin@example.com / admin123
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
