// Common constants for the application

// Truck Types
export const TRUCK_TYPES = [
  { value: 'FULL_TRAILER', label: 'פול טריילר', description: 'משאית עם נגרר מלא' },
  { value: 'SEMI_TRAILER', label: 'סמי טריילר', description: 'משאית עם נגרר חלקי' },
  { value: 'DOUBLE_TRAILER', label: 'דאבל', description: 'משאית עם נגרר כפול' },
  { value: 'SMALL_TRUCK', label: 'משאית קטנה', description: 'משאית עד 12 טון' },
  { value: 'PICKUP', label: 'טנדר', description: 'רכב פיקאפ' },
  { value: 'CONCRETE_MIXER', label: 'מערבל בטון', description: 'רכב מערבל בטון' },
  { value: 'DUMP_TRUCK', label: 'מטרגה', description: 'משאית מטרגה' },
  { value: 'FLATBED', label: 'משטח פתוח', description: 'משאית משטח פתוח' },
  { value: 'OTHER', label: 'אחר', description: 'סוג רכב אחר' }
] as const

export type TruckType = typeof TRUCK_TYPES[number]['value']

// Helper function to get truck type label
export const getTruckTypeLabel = (value: string): string => {
  const type = TRUCK_TYPES.find(t => t.value === value)
  return type?.label || value || 'לא מוגדר'
}

// Helper function to get truck type description
export const getTruckTypeDescription = (value: string): string => {
  const type = TRUCK_TYPES.find(t => t.value === value)
  return type?.description || 'אין תיאור'
}