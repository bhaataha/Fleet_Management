'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { materialsApi } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Search, Plus, Edit, Trash2, Package } from 'lucide-react'
import Link from 'next/link'
import type { Material } from '@/types'

export default function MaterialsPage() {
  const { t } = useI18n()
  const [materials, setMaterials] = useState<Material[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    setLoading(true)
    try {
      const res = await materialsApi.list()
      setMaterials(res.data)
    } catch (error) {
      console.error('Failed to load materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const seedDefaultMaterials = async () => {
    if (!confirm('האם ליצור חומרים סטנדרטיים? (עפר, חצץ, מצע, חול, פסולת בניין, אספלט)')) {
      return
    }
    
    try {
      await materialsApi.seedDefaults()
      alert('החומרים הסטנדרטיים נוצרו בהצלחה!')
      loadMaterials()
    } catch (error: any) {
      alert('שגיאה: ' + (error.response?.data?.detail || error.message))
    }
  }

  const filteredMaterials = materials.filter(material =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('materials.title')}</h1>
            <p className="text-gray-600 mt-1">סוגי חומרים להובלה</p>
          </div>
          <div className="flex gap-2">
            {materials.length === 0 && !loading && (
              <button
                onClick={seedDefaultMaterials}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Package className="w-5 h-5" />
                הוסף חומרים סטנדרטיים
              </button>
            )}
            <Link
              href="/materials/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('materials.addMaterial')}
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      שם החומר
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      יחידת חיוב
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMaterials.map((material) => (
                    <tr key={material.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 text-gray-400 ml-2" />
                          <span className="font-medium text-gray-900">{material.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {t(`billingUnit.${material.billing_unit}`)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => window.location.href = `/materials/${material.id}`}
                            className="text-blue-600 hover:text-blue-800"
                            title="ערוך"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('האם למחוק את החומר?')) {
                                materialsApi.delete(material.id).then(() => loadMaterials())
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="מחק"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMaterials.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  {searchTerm ? 'לא נמצאו תוצאות' : 'אין חומרים'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
