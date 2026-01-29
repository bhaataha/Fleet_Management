# תיקון הפניה אוטומטית של נהגים אחרי התחברות

## 📋 תיאור הבעיה

נהג מתחבר למערכת אבל לא מועבר אוטומטית לאפליקציית הנהג (`/mobile/home`), אלא נשאר בדף הלוגין או מועבר למסך הניהול הרגיל.

## 🔍 סיבת הבעיה

הפונקציה `getPostLoginRoute()` בדף הלוגין לא בדקה את כל התנאים לזיהוי נהג:
- בדקה רק `org_role === 'driver'` (case-sensitive)
- לא בדקה `driver_id` כראוי
- לא תמכה בערכים עם case שונה (`DRIVER` vs `driver`)

## ✅ הפתרון

### 1. שיפור לוגיקת זיהוי נהגים

```typescript
const getPostLoginRoute = (user: any) => {
  if (!user) return '/dashboard'
  
  // Super Admin -> Super Admin panel
  if (user.is_super_admin) return '/super-admin'
  
  // Driver Detection - Check multiple conditions:
  // 1. org_role is "driver" or "DRIVER"
  // 2. roles array includes "DRIVER"
  // 3. driver_id exists (most reliable - means user has driver profile)
  const isDriverRole = user.org_role?.toLowerCase() === 'driver'
  const hasDriverRole = Array.isArray(user.roles) && 
                        user.roles.some((role: string) => role.toUpperCase() === 'DRIVER')
  const hasDriverProfile = user.driver_id !== null && user.driver_id !== undefined
  
  // If ANY driver indicator exists -> Mobile App
  if (isDriverRole || hasDriverRole || hasDriverProfile) {
    console.log('🚚 Driver detected, redirecting to mobile app:', {
      isDriverRole,
      hasDriverRole,
      hasDriverProfile,
      driver_id: user.driver_id,
      org_role: user.org_role
    })
    return '/mobile/home'
  }
  
  // Default -> Admin Dashboard
  return '/dashboard'
}
```

### 2. הוספת console.log לדיבאגינג

```typescript
console.log('✅ Login successful:', {
  name: user.name,
  org_role: user.org_role,
  driver_id: user.driver_id,
  roles: user.roles
})

const route = getPostLoginRoute(user)
console.log('🚀 Redirecting to:', route)
router.push(route)
```

### 3. שיפור useEffect

```typescript
useEffect(() => {
  setMounted(true)
  
  // If already authenticated, redirect to correct dashboard
  if (isAuthenticated && user) {
    const route = getPostLoginRoute(user)
    console.log('🔄 Already authenticated, redirecting to:', route, { user })
    router.push(route)
  }
}, [isAuthenticated, router, user])
```

## 🧪 בדיקה

### תנאי זיהוי נהג (OR - אחד מהם מספיק):
1. ✅ `user.org_role.toLowerCase() === 'driver'`
2. ✅ `user.roles` מכיל `'DRIVER'` (case-insensitive)
3. ✅ `user.driver_id !== null && user.driver_id !== undefined`

### תרחישי בדיקה:

1. **נהג עם driver_id**:
   ```json
   {
     "id": 5,
     "name": "יוסי נהג",
     "org_role": "dispatcher",
     "driver_id": 2
   }
   ```
   ✅ יועבר ל-`/mobile/home`

2. **נהג עם org_role**:
   ```json
   {
     "id": 6,
     "name": "משה נהג",
     "org_role": "driver",
     "driver_id": null
   }
   ```
   ✅ יועבר ל-`/mobile/home`

3. **נהג עם role במערך**:
   ```json
   {
     "id": 7,
     "name": "דוד נהג",
     "roles": ["DRIVER"],
     "driver_id": null
   }
   ```
   ✅ יועבר ל-`/mobile/home`

4. **משתמש רגיל**:
   ```json
   {
     "id": 8,
     "name": "רונית מנהלת",
     "org_role": "admin",
     "driver_id": null
   }
   ```
   ✅ יועבר ל-`/dashboard`

## 📁 קבצים שהשתנו

- **frontend/src/app/login/page.tsx**: פונקציית `getPostLoginRoute()` + console.log

## 🚀 Deployment

### Local:
```bash
docker-compose restart frontend
```

### Production:
```bash
# Pull changes
ssh root@64.176.173.36 "cd /opt/Fleet_Management && git pull origin main"

# Rebuild
ssh root@64.176.173.36 "cd /opt/Fleet_Management && docker compose build frontend"

# Restart
ssh root@64.176.173.36 "cd /opt/Fleet_Management && docker stop fleet_frontend_prod && docker start fleet_frontend_prod"
```

## 🐛 Debugging Tips

אם נהג עדיין לא מועבר אוטומטית:

1. **פתח Console בדפדפן** (F12)
2. **התחבר כנהג**
3. **חפש בלוגים**:
   - `🚚 Driver detected` - אמור להופיע
   - `🚀 Redirecting to:` - צריך להיות `/mobile/home`
   - אם לא מופיע - בדוק את ה-`user` object שחוזר מה-API

4. **בדוק API Response**:
   ```bash
   # Network tab -> login request -> Response
   {
     "access_token": "...",
     "user": {
       "driver_id": ???,  // <-- צריך להיות מספר או null
       "org_role": "driver",
       "roles": ["DRIVER"]
     }
   }
   ```

5. **בדוק backend logs**:
   ```bash
   docker logs --tail 50 fleet_backend_prod | grep driver
   ```

## 📚 קישורים קשורים

- [Phone Auth API](../api/PHONE_AUTH_API.md)
- [User Roles & Permissions](../architecture/ROLES_AND_PERMISSIONS.md)
- [Mobile App Structure](../features/MOBILE_APP.md)

---

**תאריך תיקון**: 29/01/2026  
**Commit**: `aaad61e` - Fix: Driver auto-redirect after login  
**Status**: ✅ Fixed & Deployed
