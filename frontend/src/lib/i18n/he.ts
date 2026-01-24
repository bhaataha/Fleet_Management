// Hebrew translations
export const he = {
  // Common
  common: {
    loading: 'טוען...',
    save: 'שמור',
    cancel: 'בטל',
    delete: 'מחק',
    edit: 'ערוך',
    create: 'צור חדש',
    search: 'חפש',
    filter: 'סנן',
    export: 'ייצא',
    print: 'הדפס',
    yes: 'כן',
    no: 'לא',
    close: 'סגור',
    back: 'חזור',
    next: 'הבא',
    previous: 'הקודם',
    select: 'בחר',
    actions: 'פעולות',
    date: 'תאריך',
    status: 'סטטוס',
    notes: 'הערות',
  },

  // Auth
  auth: {
    login: 'התחברות',
    logout: 'התנתק',
    email: 'אימייל',
    password: 'סיסמה',
    loginButton: 'התחבר',
    loginError: 'שגיאה בהתחברות',
    invalidCredentials: 'אימייל או סיסמה שגויים',
    welcome: 'ברוכים הבאים',
    systemTitle: 'מערכת ניהול הובלות עפר',
  },

  // Navigation
  nav: {
    dashboard: 'לוח בקרה',
    dispatch: 'שיבוץ נסיעות',
    jobs: 'נסיעות',
    customers: 'לקוחות',
    sites: 'אתרים',
    fleet: 'צי רכבים',
    trucks: 'משאיות',
    drivers: 'נהגים',
    materials: 'חומרים',
    billing: 'חשבוניות וגבייה',
    statements: 'סיכומים',
    payments: 'תשלומים',
    expenses: 'הוצאות',
    reports: 'דוחות',
    settings: 'הגדרות',
  },

  // Job Status
  jobStatus: {
    PLANNED: 'מתוכנן',
    ASSIGNED: 'משובץ',
    ENROUTE_PICKUP: 'בדרך לטעינה',
    LOADED: 'נטען',
    ENROUTE_DROPOFF: 'בדרך לפריקה',
    DELIVERED: 'נמסר',
    CLOSED: 'סגור',
    CANCELED: 'בוטל',
  },

  // Billing Units
  billingUnit: {
    TON: 'טון',
    M3: 'מ״ק',
    TRIP: 'נסיעה',
    KM: 'ק״מ',
  },

  // Customers
  customers: {
    title: 'לקוחות',
    name: 'שם',
    vatId: 'ח.פ / ע.מ',
    contactName: 'איש קשר',
    phone: 'טלפון',
    email: 'אימייל',
    address: 'כתובת',
    paymentTerms: 'תנאי תשלום',
    createCustomer: 'צור לקוח חדש',
    editCustomer: 'ערוך לקוח',
    deleteConfirm: 'האם אתה בטוח שברצונך למחוק את הלקוח?',
  },

  // Sites
  sites: {
    title: 'אתרים',
    name: 'שם אתר',
    customer: 'לקוח',
    address: 'כתובת',
    openingHours: 'שעות פעילות',
    accessNotes: 'הערות גישה',
    createSite: 'צור אתר חדש',
    editSite: 'ערוך אתר',
  },

  // Fleet
  fleet: {
    trucks: 'משאיות',
    drivers: 'נהגים',
    plateNumber: 'מספר רישוי',
    model: 'דגם',
    truckType: 'סוג משאית',
    capacityTon: 'קיבולת (טון)',
    capacityM3: 'קיבולת (מ״ק)',
    insuranceExpiry: 'תוקף ביטוח',
    testExpiry: 'תוקף טסט',
    licenseType: 'סוג רישיון',
    licenseExpiry: 'תוקף רישיון',
  },

  // Jobs
  jobs: {
    title: 'נסיעות',
    jobNumber: 'מספר נסיעה',
    customer: 'לקוח',
    fromSite: 'מאתר',
    toSite: 'לאתר',
    material: 'חומר',
    plannedQty: 'כמות מתוכננת',
    actualQty: 'כמות בפועל',
    scheduledDate: 'תאריך מתוכנן',
    driver: 'נהג',
    truck: 'משאית',
    priority: 'עדיפות',
    createJob: 'צור נסיעה חדשה',
    assignDriver: 'שבץ נהג',
    updateStatus: 'עדכן סטטוס',
    deliveryNote: 'תעודת משלוח',
    signature: 'חתימה',
    receiverName: 'שם מקבל',
  },

  // Dashboard
  dashboard: {
    title: 'לוח בקרה',
    todayJobs: 'נסיעות היום',
    activeJobs: 'נסיעות פעילות',
    completedToday: 'הושלמו היום',
    alerts: 'התראות',
    missingDocuments: 'חסרים מסמכים',
    expiringInsurance: 'ביטוחים שפגי תוקף',
  },

  // Dispatch Board
  dispatch: {
    title: 'לוח שיבוץ',
    date: 'תאריך',
    filterByCustomer: 'סנן לפי לקוח',
    filterByStatus: 'סנן לפי סטטוס',
    unassigned: 'לא משובץ',
    dragToAssign: 'גרור לשיבוץ',
  },

  // Billing
  billing: {
    statements: 'סיכומים',
    generateStatement: 'הפק סיכום',
    statementNumber: 'מספר סיכום',
    periodFrom: 'מתאריך',
    periodTo: 'עד תאריך',
    subtotal: 'סכום ביניים',
    tax: 'מע״מ',
    total: 'סה״כ',
    exportPdf: 'ייצא PDF',
    exportExcel: 'ייצא Excel',
    paymentReceived: 'תשלום התקבל',
    paymentAmount: 'סכום תשלום',
    paymentMethod: 'אמצעי תשלום',
    reference: 'אסמכתא',
  },

  // Errors
  errors: {
    required: 'שדה חובה',
    invalidEmail: 'כתובת אימייל לא תקינה',
    networkError: 'שגיאת רשת',
    serverError: 'שגיאת שרת',
    notFound: 'לא נמצא',
    unauthorized: 'אין הרשאה',
    forbidden: 'גישה נדחתה',
  },

  // Success messages
  success: {
    saved: 'נשמר בהצלחה',
    deleted: 'נמחק בהצלחה',
    created: 'נוצר בהצלחה',
    updated: 'עודכן בהצלחה',
  },
}

export type TranslationKeys = typeof he
