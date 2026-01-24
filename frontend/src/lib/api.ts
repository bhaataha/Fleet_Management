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
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
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
  list: (params?: { skip?: number; limit?: number; is_active?: boolean }) =>
    api.get<Truck[]>('/trucks', { params }),
  
  get: (id: number) =>
    api.get<Truck>(`/trucks/${id}`),
  
  create: (data: Partial<Truck>) =>
    api.post<Truck>('/trucks', data),
  
  update: (id: number, data: Partial<Truck>) =>
    api.patch<Truck>(`/trucks/${id}`, data),
}

// Drivers API
export const driversApi = {
  list: (params?: { skip?: number; limit?: number; is_active?: boolean }) =>
    api.get<Driver[]>('/drivers', { params }),
  
  get: (id: number) =>
    api.get<Driver>(`/drivers/${id}`),
  
  create: (data: Partial<Driver>) =>
    api.post<Driver>('/drivers', data),
}

// Materials API
export const materialsApi = {
  list: (params?: { skip?: number; limit?: number; is_active?: boolean }) =>
    api.get<Material[]>('/materials', { params }),
  
  get: (id: number) =>
    api.get<Material>(`/materials/${id}`),
  
  create: (data: Partial<Material>) =>
    api.post<Material>('/materials', data),
}

// Jobs API
export const jobsApi = {
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
  
  updateStatus: (id: number, data: { 
    status: string
    note?: string
    lat?: number
    lng?: number
  }) =>
    api.post<Job>(`/jobs/${id}/status`, data),
}

export default api
