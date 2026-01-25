import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy') {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, formatStr, { locale: he })
  } catch {
    return ''
  }
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

export function formatCurrency(amount: number, currency: string = '₪') {
  return `${currency}${amount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const jobStatusLabels: Record<string, string> = {
  PLANNED: 'מתוכנן',
  ASSIGNED: 'משובץ',
  ENROUTE_PICKUP: 'בדרך לטעינה',
  LOADED: 'נטען',
  ENROUTE_DROPOFF: 'בדרך לפריקה',
  DELIVERED: 'נמסר',
  CLOSED: 'סגור',
  CANCELED: 'בוטל',
}

export const jobStatusColors: Record<string, string> = {
  PLANNED: 'bg-gray-100 text-gray-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  ENROUTE_PICKUP: 'bg-yellow-100 text-yellow-800',
  LOADED: 'bg-orange-100 text-orange-800',
  ENROUTE_DROPOFF: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-300 text-gray-800',
  CANCELED: 'bg-red-100 text-red-800',
}

export const billingUnitLabels: Record<string, string> = {
  TON: 'טון',
  M3: 'מ״ק',
  TRIP: 'נסיעה',
  KM: 'ק״מ',
}
