# Users Management API - Quick Guide

## Overview
ניהול משתמשים עם RBAC (Role-Based Access Control) ו-Multi-Tenant Isolation.

---

## 🔐 Authentication Required
כל ה-endpoints דורשים JWT token ב-header:
```
Authorization: Bearer <token>
```

---

## 📋 Endpoints

### 1. List Users (Admin Only)
```bash
GET /api/users
```

**Query Parameters:**
- `skip`: offset (default: 0)
- `limit`: max results (default: 50, max: 200)
- `is_active`: filter by active status (true/false)
- `role_filter`: filter by org_role (admin/dispatcher/accounting/driver/user)
- `search`: search by name, email, or phone

**Example:**
```bash
curl http://localhost:8001/api/users?is_active=true&role_filter=driver \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
[
  {
    "id": 1,
    "org_id": "2b0018bd-31c3-4d89-ab46-9a3219a44f2b",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "050-1234567",
    "org_role": "driver",
    "is_active": true,
    "is_super_admin": false,
    "created_at": "2026-01-26T19:00:00Z"
  }
]
```

---

### 2. Get My Profile
```bash
GET /api/users/me
```

**No special permissions required** - users can always view their own profile.

**Response:**
```json
{
  "id": 12,
  "org_id": "2b0018bd-31c3-4d89-ab46-9a3219a44f2b",
  "name": "Fleet Admin",
  "email": "admin@fleet.com",
  "phone": "050-1111111",
  "org_role": "admin",
  "is_active": true,
  "is_super_admin": false,
  "created_at": "2026-01-26T19:56:57.162764Z",
  "driver_id": null,
  "driver_name": null
}
```

---

### 3. Get User by ID
```bash
GET /api/users/{id}
```

**Permissions:**
- Users can view their own profile
- Admins can view any user in the organization

**Example:**
```bash
curl http://localhost:8001/api/users/5 \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4. Create User (Admin Only)
```bash
POST /api/users
```

**Request Body:**
```json
{
  "name": "John Dispatcher",
  "email": "john@fleet.com",
  "phone": "050-9999999",
  "password": "secure123456",
  "org_role": "dispatcher"
}
```

**Valid Roles:**
- `user` - משתמש בסיסי (קריאה)
- `driver` - נהג
- `dispatcher` - סדרן
- `accounting` - הנהלת חשבונות
- `admin` - מנהל
- `owner` - בעלים

**Example:**
```bash
curl -X POST http://localhost:8001/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Dispatcher",
    "email": "john@fleet.com",
    "phone": "050-9999999",
    "password": "secure123456",
    "org_role": "dispatcher"
  }'
```

**Response:** (201 Created)
```json
{
  "id": 13,
  "org_id": "2b0018bd-31c3-4d89-ab46-9a3219a44f2b",
  "name": "John Dispatcher",
  "email": "john@fleet.com",
  "phone": "050-9999999",
  "org_role": "dispatcher",
  "is_active": true,
  "is_super_admin": false,
  "created_at": "2026-01-26T20:00:00Z"
}
```

---

### 5. Update User
```bash
PATCH /api/users/{id}
```

**Permissions:**
- **Regular users** can update their own: `name`, `phone`
- **Admins** can update any user: `name`, `email`, `phone`, `org_role`, `is_active`

**Request Body (Regular User):**
```json
{
  "name": "John Updated",
  "phone": "050-8888888"
}
```

**Request Body (Admin):**
```json
{
  "name": "John Updated",
  "email": "john.new@fleet.com",
  "phone": "050-8888888",
  "org_role": "admin",
  "is_active": false
}
```

**Example:**
```bash
curl -X PATCH http://localhost:8001/api/users/13 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Updated", "phone": "050-8888888"}'
```

---

### 6. Delete User (Soft Delete - Admin Only)
```bash
DELETE /api/users/{id}
```

**Note:** This is a soft delete (sets `is_active=false`). Users cannot delete themselves.

**Example:**
```bash
curl -X DELETE http://localhost:8001/api/users/13 \
  -H "Authorization: Bearer $TOKEN"
```

**Response:** (204 No Content)

---

### 7. Change My Password
```bash
POST /api/users/me/change-password
```

**Request Body:**
```json
{
  "current_password": "admin123",
  "new_password": "newpassword123"
}
```

**Example:**
```bash
curl -X POST http://localhost:8001/api/users/me/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "admin123",
    "new_password": "newpassword123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### 8. Reset User Password (Admin Only)
```bash
POST /api/users/{id}/reset-password
```

**Request Body:**
```json
"newpassword123"
```

**Example:**
```bash
curl -X POST http://localhost:8001/api/users/5/reset-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '"newpassword123"'
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully for user 'user@example.com'"
}
```

---

## 🔒 Security Features

### 1. Multi-Tenant Isolation
- Users can only see/manage users in their own organization
- Cross-org access returns 404 (not 403)

### 2. RBAC (Role-Based Access Control)
- **Admin/Owner**: Full user management
- **Regular Users**: View/edit own profile only
- **Drivers**: View own profile + password change

### 3. Email Uniqueness
- Email must be unique **globally** (across all organizations)

### 4. Password Security
- Minimum 8 characters
- Hashed with bcrypt
- Cannot change without current password

### 5. Protection Against Self-Harm
- Users cannot delete themselves
- Users cannot demote themselves (if admin)

---

## 📝 Error Responses

### 401 Unauthorized
```json
{
  "detail": "Missing or invalid authorization header"
}
```

### 403 Forbidden
```json
{
  "detail": "Admin or Owner access required"
}
```

### 404 Not Found
```json
{
  "detail": "User not found"
}
```

### 400 Bad Request
```json
{
  "detail": "User with email 'john@example.com' already exists"
}
```

---

## 🧪 Testing

### Quick Test Script
```bash
#!/bin/bash

# Login
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleet.com","password":"admin123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

echo "Token: ${TOKEN:0:20}..."

# Get all users
echo -e "\n=== List Users ==="
curl -s http://localhost:8001/api/users \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Get my profile
echo -e "\n=== My Profile ==="
curl -s http://localhost:8001/api/users/me \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Save as `test_users.sh`, then:
```bash
chmod +x test_users.sh
./test_users.sh
```

---

## 📚 Related Documentation

- [Phase 2 Progress](./PHASE_2_PROGRESS.md)
- [Phase 2 Complete](./PHASE_2_COMPLETE.md)
- [Multi-Tenant Guide](../../docs/architecture/MULTI_TENANT_IMPLEMENTATION_GUIDE.md)
- [API Documentation](http://localhost:8001/docs) - Swagger UI

---

**Last Updated**: 26 ינואר 2026  
**Version**: 1.0
