import axios from 'axios'
import type { 
  User, 
  Customer, 
  Site, 
  Truck, 
  Driver, 
  Material, 
  Job, 
  JobCreate,
  JobUpdate,
  PriceList,
  PriceListCreate,
  LoginRequest, 
  LoginResponse 
} from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Super Admin impersonation: add X-Org-Id header if selected
    const impersonatedOrgId = localStorage.getItem('impersonated_org_id')
    if (impersonatedOrgId) {
      config.headers['X-Org-Id'] = impersonatedOrgId
    }
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      // But only if we're not already on the login page
      if (typeof window !== 'undefined') {
        const isLoginPage = window.location.pathname === '/login'
        if (!isLoginPage) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (credentials: LoginRequest) => 
    api.post<LoginResponse>('/auth/login', credentials),
  
  me: () => 
    api.get<User>('/auth/me'),
  
  logout: () => 
    api.post('/auth/logout'),
}

// Customers API
export const customersApi = {
  getAll: () => api.get<Customer[]>('/customers'),
  
  list: (params?: { skip?: number; limit?: number; is_active?: boolean }) =>
    api.get<Customer[]>('/customers', { params }),
  
  get: (id: number) =>
    api.get<Customer>(`/customers/${id}`),
  
  create: (data: Partial<Customer>) =>
    api.post<Customer>('/customers', data),
  
  update: (id: number, data: Partial<Customer>) =>
    api.patch<Customer>(`/customers/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/customers/${id}`),
}

// Sites API
export const sitesApi = {
  getAll: () => api.get<Site[]>('/sites'),
  
  list: (params?: { skip?: number; limit?: number; customer_id?: number; is_active?: boolean }) =>
    api.get<Site[]>('/sites', { params }),
  
  get: (id: number) =>
    api.get<Site>(`/sites/${id}`),
  
  create: (data: Partial<Site>) =>
    api.post<Site>('/sites', data),
  
  update: (id: number, data: Partial<Site>) =>
    api.patch<Site>(`/sites/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/sites/${id}`),
}

// Trucks API
export const trucksApi = {
  getAll: () => api.get<Truck[]>('/trucks'),
  
  list: (params?: { skip?: number; limit?: number; is_active?: boolean }) =>
    api.get<Truck[]>('/trucks', { params }),
  
  get: (id: number) =>
    api.get<Truck>(`/trucks/${id}`),
  
  create: (data: Partial<Truck>) =>
    api.post<Truck>('/trucks', data),
  
  update: (id: number, data: Partial<Truck>) =>
    api.patch<Truck>(`/trucks/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/trucks/${id}`),
}

// Drivers API
export const driversApi = {
  getAll: () => api.get<Driver[]>('/drivers'),
  
  list: (params?: { skip?: number; limit?: number; is_active?: boolean }) =>
    api.get<Driver[]>('/drivers', { params }),
  
  get: (id: number) =>
    api.get<Driver>(`/drivers/${id}`),
  
  create: (data: Partial<Driver>) =>
    api.post<Driver>('/drivers', data),
  
  update: (id: number, data: Partial<Driver>) =>
    api.patch<Driver>(`/drivers/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/drivers/${id}`),
}

// Materials API
export const materialsApi = {
  getAll: () => api.get<Material[]>('/materials'),
  
  list: (params?: { skip?: number; limit?: number; is_active?: boolean }) =>
    api.get<Material[]>('/materials', { params }),
  
  get: (id: number) =>
    api.get<Material>(`/materials/${id}`),
  
  create: (data: Partial<Material>) =>
    api.post<Material>('/materials', data),
  
  update: (id: number, data: Partial<Material>) =>
    api.patch<Material>(`/materials/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/materials/${id}`),
  
  seedDefaults: () =>
    api.post('/materials/seed-defaults'),
}

// Jobs API
export const jobsApi = {
  getAll: (params?: { limit?: number }) => 
    api.get<Job[]>('/jobs', { params: { limit: params?.limit || 200 } }),
  
  list: (params?: { 
    skip?: number
    limit?: number
    date?: string
    status?: string
    customer_id?: number
    driver_id?: number
  }) =>
    api.get<Job[]>('/jobs', { params }),
  
  get: (id: number) =>
    api.get<Job>(`/jobs/${id}`),
  
  create: (data: JobCreate) =>
    api.post<Job>('/jobs', data),
  
  update: (id: number, data: JobUpdate) =>
    api.patch<Job>(`/jobs/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/jobs/${id}`),
  
  updateStatus: (id: number, data: { 
    status: string
    note?: string
    lat?: number
    lng?: number
  }) =>
    api.post<Job>(`/jobs/${id}/status`, data),
}

// Price Lists API
export const priceListsApi = {
  getAll: (params?: { customer_id?: number; material_id?: number }) =>
    api.get<PriceList[]>('/price-lists', { params }),
  
  get: (id: number) =>
    api.get<PriceList>(`/price-lists/${id}`),
  
  create: (data: PriceListCreate) =>
    api.post<PriceList>('/price-lists', data),
  
  update: (id: number, data: Partial<PriceListCreate>) =>
    api.patch<PriceList>(`/price-lists/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/price-lists/${id}`),
}

// Super Admin API
export const superAdminApi = {
  // Organizations
  listOrganizations: (params?: { status?: string; plan_type?: string; search?: string }) =>
    api.get<any[]>("/super-admin/organizations", { params }),
  createOrganization: (data: {
    name: string;
    slug: string;
    plan_type: string;
    max_users?: number;
    max_trucks?: number;
    max_drivers?: number;
    max_customers?: number;
    trial_days?: number;
  }) => api.post<any>("/super-admin/organizations", data),
  getOrganization: (orgId: string) =>
    api.get<any>(`/super-admin/organizations/${orgId}`),
  updateOrganization: (orgId: string, data: Partial<{
    name: string;
    display_name: string;
    slug: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    vat_id: string;
    plan_type: string;
    max_users: number;
    max_trucks: number;
    max_drivers: number;
    max_customers: number;
    trial_ends_at: string;
  }>) => api.patch<any>(`/super-admin/organizations/${orgId}`, data),
  deleteOrganization: (orgId: string, confirm: boolean = false) =>
    api.delete(`/super-admin/organizations/${orgId}`, { params: { confirm } }),
  
  // Organization Actions
  suspendOrganization: (orgId: string, reason: string) =>
    api.post(`/super-admin/organizations/${orgId}/suspend`, { reason }),
  activateOrganization: (orgId: string) =>
    api.post(`/super-admin/organizations/${orgId}/activate`),
  
  // Organization Users
  getOrganizationUsers: (orgId: string) =>
    api.get<any[]>(`/super-admin/organizations/${orgId}/users`),
  
  // Password Reset
  resetOrganizationPassword: (orgId: string, data: { email: string; new_password: string }) =>
    api.post(`/super-admin/organizations/${orgId}/reset-password`, data),
  
  // System Stats
  getSystemStats: () => api.get<any>("/super-admin/stats"),
}

export default api

