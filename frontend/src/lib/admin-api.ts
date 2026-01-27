/**
 * User Management API
 */
import api from './api';

export interface UserPermission {
  permission_id: number;
  permission_name: string;
  permission_description: string;
  granted: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  org_role: string;
  is_active: boolean;
  created_at: string;
  permissions: UserPermission[];
}

export interface CreateUserRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  org_role: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  org_role?: string;
  is_active?: boolean;
}

export interface UpdatePermissionsRequest {
  user_id: number;
  permission_ids: number[];
}

export interface ResetPasswordRequest {
  new_password: string;
}

// API functions
export const adminUsersApi = {
  // List all users
  list: (includeInactive: boolean = false) =>
    api.get<User[]>(`/admin/users?include_inactive=${includeInactive}`),

  // Get specific user
  get: (id: number) =>
    api.get<User>(`/admin/users/${id}`),

  // Create new user
  create: (data: CreateUserRequest) =>
    api.post<User>('/admin/users', data),

  // Update user
  update: (id: number, data: UpdateUserRequest) =>
    api.patch<User>(`/admin/users/${id}`, data),

  // Delete/deactivate user
  delete: (id: number) =>
    api.delete(`/admin/users/${id}`),

  // Update user permissions
  updatePermissions: (id: number, data: UpdatePermissionsRequest) =>
    api.post(`/admin/users/${id}/permissions`, data),

  // Reset password
  resetPassword: (id: number, data: ResetPasswordRequest) =>
    api.post(`/admin/users/${id}/reset-password`, data),

  // Get user permissions
  getPermissions: (id: number) =>
    api.get<UserPermission[]>(`/admin/users/${id}/permissions`),
};