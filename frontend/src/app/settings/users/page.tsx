'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Shield, Eye, EyeOff, Key, Search } from 'lucide-react';
import { useAuth } from '@/lib/stores/auth';
import { adminUsersApi, type User, type CreateUserRequest, type UpdateUserRequest, type UserPermission } from '@/lib/admin-api';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [formData, setFormData] = useState<CreateUserRequest>({
    name: '',
    email: '',
    phone: '',
    password: '',
    org_role: 'driver'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Creating user with data:', formData);
    setIsLoading(true);
    setError('');

    try {
      const response = await adminUsersApi.create(formData);
      console.log('✅ User created successfully:', response);
      onSuccess();
      onClose();
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        org_role: 'driver'
      });
    } catch (err: any) {
      console.error('❌ Error creating user:', err);
      console.error('Response:', err.response?.data);
      console.error('Full error:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      let errorMessage = 'שגיאה ביצירת המשתמש';
      
      if (err.response?.status === 400) {
        errorMessage = err.response?.data?.detail || 'נתונים לא תקינים';
      } else if (err.response?.status === 401) {
        errorMessage = 'אין הרשאה - אנא התחבר מחדש';
      } else if (err.response?.status === 403) {
        errorMessage = 'אין הרשאה ליצור משתמשים';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-medium mb-4">משתמש חדש</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם מלא
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מספר טלפון
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="050-1234567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              אימייל (אופציונלי - נהגים משתמשים בטלפון)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example@email.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סיסמה
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תפקיד
            </label>
            <select
              value={formData.org_role}
              onChange={(e) => setFormData({ ...formData, org_role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="driver">נהג</option>
              <option value="dispatcher">סדרן</option>
              <option value="accounting">הנהלת חשבונות</option>
              <option value="admin">מנהל</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'יוצר...' : 'צור משתמש'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
}

function EditUserModal({ isOpen, onClose, user, onSuccess }: EditUserModalProps) {
  const [formData, setFormData] = useState<UpdateUserRequest>({
    name: '',
    email: '',
    phone: '',
    org_role: 'driver'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        org_role: user.org_role
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      await adminUsersApi.update(user.id, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'שגיאה בעדכון המשתמש');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-medium mb-4">עריכת משתמש</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              שם מלא
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מספר טלפון
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="050-1234567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              אימייל
            </label>
            <input
              type="email"
              value={formData.email || user.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תפקיד
            </label>
            <select
              value={formData.org_role}
              onChange={(e) => setFormData({ ...formData, org_role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="driver">נהג</option>
              <option value="dispatcher">סדרן</option>
              <option value="accounting">הנהלת חשבונות</option>
              <option value="admin">מנהל</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'שומר...' : 'שמור שינויים'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
}

function PasswordResetModal({ isOpen, onClose, user, onSuccess }: PasswordResetModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    if (!user) return;

    setIsLoading(true);
    try {
      await adminUsersApi.resetPassword(user.id, { new_password: newPassword });
      onSuccess();
      onClose();
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'שגיאה באיפוס הסיסמה');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-medium mb-4">איפוס סיסמה - {user.name}</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סיסמה חדשה
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={8}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">לפחות 8 תווים</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              אימות סיסמה
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
              dir="ltr"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'משנה סיסמה...' : 'שנה סיסמה'}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                setNewPassword('');
                setConfirmPassword('');
                setError('');
              }}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
}

function PermissionsModal({ isOpen, onClose, user, onSuccess }: PermissionsModalProps) {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      setPermissions(user.permissions || []);
    }
  }, [isOpen, user]);

  const handlePermissionToggle = (permissionId: number) => {
    setPermissions(prev => prev.map(p => 
      p.permission_id === permissionId 
        ? { ...p, granted: !p.granted }
        : p
    ));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      const grantedPermissionIds = permissions
        .filter(p => p.granted)
        .map(p => p.permission_id);

      await adminUsersApi.updatePermissions(user.id, {
        user_id: user.id,
        permission_ids: grantedPermissionIds
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'שגיאה בעדכון ההרשאות');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  // Category display names in Hebrew
  const categoryNames: Record<string, string> = {
    dashboard: 'דשבורד',
    reports: 'דוחות',
    jobs: 'נסיעות',
    customers: 'לקוחות',
    sites: 'אתרים',
    fleet: 'צי רכבים',
    billing: 'חשבוניות',
    pricing: 'מחירונים',
    system: 'מערכת',
    payments: 'תשלומים'
  };

  // Group permissions by category for better display
  const groupedPermissions = permissions.reduce((acc, perm) => {
    // Extract category from permission name (e.g., "jobs.view" -> "jobs")
    const category = perm.permission_name.split('.')[0] || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, UserPermission[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              ניהול הרשאות - {user.name}
            </h3>
            <div className="text-sm text-gray-600">
              {permissions.filter(p => p.granted).length} מתוך {permissions.length} הרשאות
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {permissions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              אין הרשאות זמינות במערכת
            </div>
          )}

          <div className="space-y-6">
            {Object.entries(groupedPermissions).sort().map(([category, categoryPermissions]) => (
              <div key={category} className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-bold text-gray-900 mb-3 text-base">
                  {categoryNames[category] || category}
                </h4>
                <div className="space-y-2 bg-white rounded p-3">
                  {categoryPermissions.map((permission) => (
                    <label
                      key={permission.permission_id}
                      className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={permission.granted}
                        onChange={() => handlePermissionToggle(permission.permission_id)}
                        className="mt-1 w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">
                          {permission.permission_description || permission.permission_name}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {permission.permission_name}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-6 mt-6 border-t">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'שומר...' : 'שמור הרשאות'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsersManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [passwordResetModalOpen, setPasswordResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Check if current user is admin
  const isAdmin = currentUser?.org_role === 'admin' || currentUser?.is_super_admin;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">אין הרשאה</h3>
          <p className="text-gray-500">רק מנהלי מערכת יכולים לגשת לדף זה</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadUsers();
  }, [showInactive]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await adminUsersApi.list(showInactive);
      setUsers(response.data || response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'שגיאה בטעינת המשתמשים');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.includes(searchTerm) ||
        (user.email && user.email.includes(searchTerm)) ||
        (user.phone && user.phone.includes(searchTerm))
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.org_role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את ${user.name}?`)) {
      return;
    }

    try {
      await adminUsersApi.delete(user.id);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'שגיאה במחיקת המשתמש');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await adminUsersApi.update(user.id, {
        is_active: !user.is_active
      });
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'שגיאה בעדכון המשתמש');
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: 'מנהל',
      dispatcher: 'סדרן',
      accounting: 'הנהלת חשבונות',
      driver: 'נהג',
      super_admin: 'מנהל מערכת'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">טוען משתמשים...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ניהול משתמשים</h1>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          משתמש חדש
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="חיפוש לפי שם, אימייל או טלפון..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="rtl"
            />
          </div>
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">כל התפקידים</option>
          <option value="admin">מנהלים</option>
          <option value="dispatcher">סדרנים</option>
          <option value="accounting">הנהלת חשבונות</option>
          <option value="driver">נהגים</option>
        </select>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          <span className="text-sm">הצג לא פעילים</span>
        </label>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                משתמש
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                תפקיד
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                טלפון
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                סטטוס
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                תאריך יצירה
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className={!user.is_active ? 'opacity-60' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.name}
                    </div>
                    <div className="text-sm text-gray-500" dir="ltr">
                      {user.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getRoleDisplayName(user.org_role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" dir="ltr">
                  {user.phone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'פעיל' : 'לא פעיל'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString('he-IL')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setEditModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="ערוך"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setPermissionsModalOpen(true);
                      }}
                      className="text-purple-600 hover:text-purple-900"
                      title="נהל הרשאות"
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setPasswordResetModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="שנה סיסמה"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={user.is_active ? "text-orange-600 hover:text-orange-900" : "text-green-600 hover:text-green-900"}
                      title={user.is_active ? "השבת" : "הפעל"}
                    >
                      {user.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="text-red-600 hover:text-red-900"
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

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">לא נמצאו משתמשים</div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          loadUsers();
          setCreateModalOpen(false);
        }}
      />

      <EditUserModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={() => {
          loadUsers();
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
      />

      <PermissionsModal
        isOpen={permissionsModalOpen}
        onClose={() => {
          setPermissionsModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={() => {
          loadUsers();
          setPermissionsModalOpen(false);
          setSelectedUser(null);
        }}
      />
      <PasswordResetModal
        isOpen={passwordResetModalOpen}
        onClose={() => {
          setPasswordResetModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={() => {
          setPasswordResetModalOpen(false);
          setSelectedUser(null);
        }}
      />    </div>
  );
}