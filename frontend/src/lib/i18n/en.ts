// English translations
import type { TranslationKeys } from './he'

export const en: TranslationKeys = {
  // Common
  common: {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create New',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    print: 'Print',
    yes: 'Yes',
    no: 'No',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    select: 'Select',
    actions: 'Actions',
    date: 'Date',
    status: 'Status',
    notes: 'Notes',
  },

  // Auth
  auth: {
    login: 'Login',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    loginButton: 'Sign In',
    loginError: 'Login Error',
    invalidCredentials: 'Invalid email or password',
    welcome: 'Welcome',
    systemTitle: 'Fleet Management System',
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    dispatch: 'Dispatch Board',
    jobs: 'Jobs',
    customers: 'Customers',
    sites: 'Sites',
    fleet: 'Fleet',
    trucks: 'Trucks',
    drivers: 'Drivers',
    materials: 'Materials',
    pricing: 'Price Lists',
    billing: 'Billing',
    reports: 'Reports',
    settings: 'Settings',
  },

  // Job Status
  jobStatus: {
    PLANNED: 'Planned',
    ASSIGNED: 'Assigned',
    ENROUTE_PICKUP: 'En Route to Pickup',
    LOADED: 'Loaded',
    ENROUTE_DROPOFF: 'En Route to Dropoff',
    DELIVERED: 'Delivered',
    CLOSED: 'Closed',
    CANCELED: 'Canceled',
  },

  // Billing Units
  billingUnit: {
    TON: 'Ton',
    M3: 'Cubic Meter',
    TRIP: 'Trip',
    KM: 'Kilometer',
  },

  // Customers
  customers: {
    title: 'Customers',
    name: 'Name',
    vatId: 'VAT ID',
    contactName: 'Contact Name',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    paymentTerms: 'Payment Terms',
    createCustomer: 'Create New Customer',
    editCustomer: 'Edit Customer',
    deleteConfirm: 'Are you sure you want to delete this customer?',
  },

  // Sites
  sites: {
    title: 'Sites',
    name: 'Site Name',
    customer: 'Customer',
    address: 'Address',
    openingHours: 'Opening Hours',
    accessNotes: 'Access Notes',
    createSite: 'Create New Site',
    editSite: 'Edit Site',
  },

  // Fleet
  fleet: {
    trucks: 'Trucks',
    drivers: 'Drivers',
    plateNumber: 'License Plate',
    model: 'Model',
    truckType: 'Truck Type',
    capacityTon: 'Capacity (Ton)',
    capacityM3: 'Capacity (m³)',
    insuranceExpiry: 'Insurance Expiry',
    testExpiry: 'Test Expiry',
    licenseType: 'License Type',
    licenseExpiry: 'License Expiry',
  },

  // Jobs
  jobs: {
    title: 'Jobs',
    jobNumber: 'Job Number',
    customer: 'Customer',
    fromSite: 'From Site',
    toSite: 'To Site',
    material: 'Material',
    plannedQty: 'Planned Quantity',
    actualQty: 'Actual Quantity',
    scheduledDate: 'Scheduled Date',
    driver: 'Driver',
    truck: 'Truck',
    priority: 'Priority',
    createJob: 'Create New Job',
    assignDriver: 'Assign Driver',
    updateStatus: 'Update Status',
    deliveryNote: 'Delivery Note',
    signature: 'Signature',
    receiverName: 'Receiver Name',
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    todayJobs: 'Today\'s Jobs',
    activeJobs: 'Active Jobs',
    completedToday: 'Completed Today',
    alerts: 'Alerts',
    missingDocuments: 'Missing Documents',
    expiringInsurance: 'Expiring Insurance',
  },

  // Dispatch Board
  dispatch: {
    title: 'Dispatch Board',
    date: 'Date',
    filterByCustomer: 'Filter by Customer',
    filterByStatus: 'Filter by Status',
    unassigned: 'Unassigned',
    dragToAssign: 'Drag to Assign',
  },

  // Billing
  billing: {
    statements: 'Statements',
    generateStatement: 'Generate Statement',
    statementNumber: 'Statement Number',
    periodFrom: 'Period From',
    periodTo: 'Period To',
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'Total',
    exportPdf: 'Export PDF',
    exportExcel: 'Export Excel',
    paymentReceived: 'Payment Received',
    paymentAmount: 'Payment Amount',
    paymentMethod: 'Payment Method',
    reference: 'Reference',
  },

  // Errors
  errors: {
    required: 'Required field',
    invalidEmail: 'Invalid email address',
    networkError: 'Network error',
    serverError: 'Server error',
    notFound: 'Not found',
    unauthorized: 'Unauthorized',
    forbidden: 'Access denied',
  },

  // Success messages
  success: {
    saved: 'Saved successfully',
    deleted: 'Deleted successfully',
    created: 'Created successfully',
    updated: 'Updated successfully',
  },
}
