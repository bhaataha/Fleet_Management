'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Plus, Edit, Trash2, DollarSign, Calendar } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PriceList {
  id: number
  customer_id?: number
  material_id: number
  from_site_id?: number
  to_site_id?: number
  unit: string
  base_price: number
  min_charge?: number
  wait_fee_per_hour?: number
  night_surcharge_pct?: number
  valid_from: string
  valid_to?: string
}

export default function PricingPage() {
  const { t } = useI18n()
  const [priceLists, setPriceLists] = useState<PriceList[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPriceLists()
  }, [])

  const loadPriceLists = async () => {
    setLoading(true)
    try {
      // TODO: Implement API call
      setPriceLists([])
    } catch (error) {
      console.error('Failed to load price lists:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">מחירון</h1>
            <p className="text-gray-600 mt-1">מחירי הובלה לפי חומר ומסלול</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            הוסף מחירון
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      לקוח
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      חומר
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      מסלול
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      מחיר בסיס
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      תוקף
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {priceLists.map((price) => (
                    <tr key={price.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {price.customer_id || 'כללי'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {price.material_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {price.from_site_id && price.to_site_id
                          ? `${price.from_site_id} → ${price.to_site_id}`
                          : 'כל המסלולים'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(price.base_price)} / {t(`billingUnit.${price.unit}`)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(price.valid_from)}
                        {price.valid_to && ` - ${formatDate(price.valid_to)}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button className="text-blue-600 hover:text-blue-800">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {priceLists.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  אין מחירונים
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
