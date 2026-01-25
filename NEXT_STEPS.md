# 🎯 Multi-Tenant Implementation - Next Steps

## ✅ השלב הראשון הושלם בהצלחה!

**Database + Models Layer: 100% COMPLETE**
- כל 20 הטבלאות כוללות org_id מסוג UUID
- כל המודלים עודכנו ב-SQLAlchemy
- כל היחסים (relationships) עובדים
- השרת עולה ועובד

---

## 📋 מה נשאר לעשות? (בסדר עדיפות)

### שלב 2: Middleware & JWT (קריטי - ללא זה המערכת לא מאובטחת!)

#### 2.1 יצירת Tenant Middleware
**קובץ:** `backend/app/middleware/tenant.py`

```python
from fastapi import Request, HTTPException, status
from jose import jwt, JWTError
from app.core.config import settings
from uuid import UUID

async def tenant_middleware(request: Request, call_next):
    """
    Extract org_id from JWT token and inject into request.state
    """
    # Skip public endpoints
    public_paths = ["/health", "/docs", "/openapi.json", "/api/v1/auth/login"]
    if request.url.path in public_paths:
        return await call_next(request)
    
    # Get Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = auth_header.split(" ")[1]
    
    try:
        # Decode JWT
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        org_id_str = payload.get("org_id")
        is_super_admin = payload.get("is_super_admin", False)
        
        if not org_id_str:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Token missing org_id"
            )
        
        # Convert to UUID
        org_id = UUID(org_id_str)
        
        # Super Admin impersonation: Check X-Org-Id header
        if is_super_admin:
            impersonate_org_id = request.headers.get("X-Org-Id")
            if impersonate_org_id:
                org_id = UUID(impersonate_org_id)
        
        # Inject into request state
        request.state.org_id = org_id
        request.state.user_id = payload.get("sub")
        request.state.is_super_admin = is_super_admin
        
    except (JWTError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    return await call_next(request)
```

**הוספה ל-`backend/app/main.py`:**
```python
from app.middleware.tenant import tenant_middleware

app.middleware("http")(tenant_middleware)
```

---

#### 2.2 עדכון JWT Token
**קובץ:** `backend/app/core/security.py`

עדכן את `create_access_token`:
```python
from app.models import User

def create_access_token(user: User) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(user.id),
        "email": user.email,
        "org_id": str(user.org_id),  # ⬅️ חדש!
        "is_super_admin": user.is_super_admin,  # ⬅️ חדש!
        "org_role": user.org_role,  # ⬅️ חדש!
        "exp": expire
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
```

**קובץ:** `backend/app/api/v1/endpoints/auth.py`

עדכן את `/login` endpoint:
```python
from sqlalchemy.orm import joinedload

@router.post("/login")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if organization is suspended
    org = db.query(Organization).filter(Organization.id == user.org_id).first()
    if org and org.status == "suspended":
        raise HTTPException(status_code=403, detail="Organization is suspended")
    
    token = create_access_token(user)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "org_id": str(user.org_id),  # ⬅️ חדש!
            "org_name": org.name if org else None,  # ⬅️ חדש!
            "plan_type": org.plan_type if org else None,  # ⬅️ חדש!
            "is_super_admin": user.is_super_admin  # ⬅️ חדש!
        }
    }
```

---

### שלב 3: Helper Functions
**קובץ חדש:** `backend/app/core/tenant.py`

```python
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session, Query
from uuid import UUID
from typing import Type
from app.models import Organization

def get_org_id(request: Request) -> UUID:
    """
    Extract org_id from request.state
    Raises 403 if missing
    """
    org_id = getattr(request.state, "org_id", None)
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization context missing"
        )
    return org_id

def is_super_admin(request: Request) -> bool:
    """Check if current user is super admin"""
    return getattr(request.state, "is_super_admin", False)

def apply_org_filter(query: Query, model: Type, request: Request) -> Query:
    """
    Apply org_id filter to a SQLAlchemy query
    
    Usage:
        query = db.query(Customer)
        query = apply_org_filter(query, Customer, request)
    """
    org_id = get_org_id(request)
    return query.filter(model.org_id == org_id)

def check_org_limit(
    request: Request, 
    db: Session, 
    resource: str, 
    current_count: int
) -> None:
    """
    Check if organization has reached resource limit
    Raises 403 if limit exceeded
    
    resource: 'trucks', 'drivers', 'storage_gb'
    """
    org_id = get_org_id(request)
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    limits = {
        "trucks": org.max_trucks,
        "drivers": org.max_drivers,
        "storage_gb": org.max_storage_gb
    }
    
    limit = limits.get(resource)
    if limit and current_count >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Organization limit reached: {resource} (max: {limit})"
        )
```

---

### שלב 4: עדכון Endpoints (הדוגמה - customers.py)
**קובץ:** `backend/app/api/v1/endpoints/customers.py`

```python
from fastapi import Request, Depends
from app.core.tenant import get_org_id, apply_org_filter

# ✅ GET / - List customers (with org_id filter)
@router.get("/")
def list_customers(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    org_id = get_org_id(request)
    
    query = db.query(Customer).filter(Customer.org_id == org_id)
    # או בקיצור: query = apply_org_filter(db.query(Customer), Customer, request)
    
    total = query.count()
    customers = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "items": customers
    }

# ✅ POST / - Create customer (inject org_id)
@router.post("/")
def create_customer(
    request: Request,
    data: CustomerCreate,
    db: Session = Depends(get_db)
):
    org_id = get_org_id(request)
    
    customer = Customer(
        **data.dict(),
        org_id=org_id  # ⬅️ הזרקת org_id אוטומטית
    )
    
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    return customer

# ✅ GET /{id} - Get customer (validate org_id)
@router.get("/{id}")
def get_customer(
    id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    org_id = get_org_id(request)
    
    customer = db.query(Customer).filter(
        Customer.id == id,
        Customer.org_id == org_id  # ⬅️ חובה! אבטחה
    ).first()
    
    if not customer:
        # NEVER reveal if resource exists in another org!
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return customer

# ✅ PATCH /{id} - Update customer (validate org_id)
@router.patch("/{id}")
def update_customer(
    id: int,
    request: Request,
    data: CustomerUpdate,
    db: Session = Depends(get_db)
):
    org_id = get_org_id(request)
    
    customer = db.query(Customer).filter(
        Customer.id == id,
        Customer.org_id == org_id  # ⬅️ חובה!
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    for key, value in data.dict(exclude_unset=True).items():
        setattr(customer, key, value)
    
    db.commit()
    db.refresh(customer)
    
    return customer

# ✅ DELETE /{id} - Delete customer (validate org_id)
@router.delete("/{id}")
def delete_customer(
    id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    org_id = get_org_id(request)
    
    customer = db.query(Customer).filter(
        Customer.id == id,
        Customer.org_id == org_id  # ⬅️ חובה!
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(customer)
    db.commit()
    
    return {"success": True}
```

**יש לעשות אותו דבר עבור 12 קבצים נוספים:**
- `sites.py`
- `drivers.py`
- `trucks.py`
- `trailers.py`
- `materials.py`
- `price_lists.py`
- `jobs.py`
- `delivery_notes.py`
- `files.py`
- `statements.py`
- `payments.py`
- `expenses.py`

---

### שלב 5: Super Admin Endpoints
**קובץ חדש:** `backend/app/api/v1/endpoints/super_admin.py`

```python
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Organization
from app.core.tenant import is_super_admin
from uuid import uuid4

router = APIRouter(prefix="/super-admin", tags=["Super Admin"])

def require_super_admin(request: Request):
    """Dependency: Ensure user is super admin"""
    if not is_super_admin(request):
        raise HTTPException(status_code=403, detail="Super admin access required")

@router.get("/organizations", dependencies=[Depends(require_super_admin)])
def list_organizations(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """List all organizations (super admin only)"""
    orgs = db.query(Organization).offset(skip).limit(limit).all()
    total = db.query(Organization).count()
    
    return {
        "total": total,
        "items": orgs
    }

@router.post("/organizations", dependencies=[Depends(require_super_admin)])
def create_organization(
    data: OrganizationCreate,
    db: Session = Depends(get_db)
):
    """Create new organization (super admin only)"""
    org = Organization(
        id=uuid4(),
        **data.dict()
    )
    
    db.add(org)
    db.commit()
    db.refresh(org)
    
    return org

@router.get("/organizations/{org_id}", dependencies=[Depends(require_super_admin)])
def get_organization(
    org_id: str,
    db: Session = Depends(get_db)
):
    """Get organization details with stats"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    return org

@router.patch("/organizations/{org_id}", dependencies=[Depends(require_super_admin)])
def update_organization(
    org_id: str,
    data: OrganizationUpdate,
    db: Session = Depends(get_db)
):
    """Update organization"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    for key, value in data.dict(exclude_unset=True).items():
        setattr(org, key, value)
    
    db.commit()
    db.refresh(org)
    
    return org

@router.post("/organizations/{org_id}/suspend", dependencies=[Depends(require_super_admin)])
def suspend_organization(
    org_id: str,
    reason: str,
    db: Session = Depends(get_db)
):
    """Suspend organization"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    org.status = "suspended"
    org.suspended_reason = reason
    
    db.commit()
    
    return {"success": True, "message": f"Organization suspended: {reason}"}
```

**הוספה ל-`backend/app/api/v1/api.py`:**
```python
from app.api.v1.endpoints import super_admin

api_router.include_router(super_admin.router)
```

---

### שלב 6: Frontend Updates (אופציונלי ל-MVP)

#### 6.1 עדכון Auth Store
**קובץ:** `frontend/src/lib/stores/auth.ts`

```typescript
interface User {
  id: number;
  email: string;
  name: string;
  org_id: string;  // ⬅️ חדש!
  org_name: string;  // ⬅️ חדש!
  plan_type: string;  // ⬅️ חדש!
  is_super_admin: boolean;  // ⬅️ חדש!
}

// Update login function to extract org data from response
async function login(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password });
  
  localStorage.setItem('token', response.data.access_token);
  user.set(response.data.user);  // Contains org_id, org_name, plan_type
  
  // If super admin, can impersonate other orgs
  if (response.data.user.is_super_admin) {
    // Show organization selector
  }
}
```

#### 6.2 Organization Selector (Super Admin)
**קובץ חדש:** `frontend/src/components/super-admin/OrganizationSelector.tsx`

```typescript
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export function OrganizationSelector() {
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  
  useEffect(() => {
    api.get('/super-admin/organizations').then(res => {
      setOrgs(res.data.items);
    });
  }, []);
  
  const handleOrgChange = (orgId: string) => {
    setSelectedOrg(orgId);
    localStorage.setItem('impersonate_org_id', orgId);
    
    // Add X-Org-Id header to all future requests
    api.defaults.headers.common['X-Org-Id'] = orgId;
    
    // Reload data
    window.location.reload();
  };
  
  return (
    <select value={selectedOrg} onChange={(e) => handleOrgChange(e.target.value)}>
      <option value="">-- Select Organization --</option>
      {orgs.map(org => (
        <option key={org.id} value={org.id}>{org.name}</option>
      ))}
    </select>
  );
}
```

---

## 🧪 Testing Plan

### 1. יצירת ארגון שני לבדיקה
```sql
-- Create second organization
INSERT INTO organizations (id, name, slug, display_name, plan_type, max_trucks, max_drivers, status)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Test Organization 2',
    'test-org-2',
    'Test Org 2',
    'trial',
    10,
    10,
    'active'
);

-- Create user in org 2
INSERT INTO users (org_id, email, name, password_hash, is_active, is_super_admin, org_role)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'user2@test.com',
    'Test User 2',
    '$2b$12$...',  -- Use create_admin.py to generate
    true,
    false,
    'user'
);

-- Create test customer in org 2
INSERT INTO customers (org_id, name, vat_id)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Customer in Org 2',
    '123456789'
);
```

### 2. בדיקות Multi-Org Isolation
1. התחבר כ-user1 (org1) → `GET /api/v1/customers` → צריך להחזיר רק לקוחות של org1
2. התחבר כ-user1 (org1) → `GET /api/v1/customers/{id_of_org2_customer}` → צריך להחזיר 404
3. התחבר כ-user2 (org2) → `GET /api/v1/customers` → צריך להחזיר רק לקוחות של org2
4. התחבר כ-super_admin → הוסף `X-Org-Id: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb` → צריך לראות נתוני org2

---

## ✅ Success Criteria

- [  ] Middleware מזריק org_id לכל request
- [  ] JWT כולל org_id
- [  ] כל 13 endpoint files מסננים לפי org_id
- [  ] משתמש בארגון 1 לא יכול לראות נתונים של ארגון 2
- [  ] Super Admin יכול להחליף בין ארגונים עם X-Org-Id
- [  ] ניסיון ליצור resource מעבר ל-limit נכשל עם 403
- [  ] ארגון ב-status=suspended לא יכול להתחבר
- [  ] Frontend מציג org_name ו-plan_type בממשק

---

## ⚠️ Common Pitfalls

1. **לעולם אל תחשוף קיום resource בארגון אחר** → תמיד 404, לא 403
2. **כל query חייב לכלול org_id filter** → אף פעם אל תשכח!
3. **בדוק org_id גם ב-nested queries** → למשל Job→Customer, צריך לבדוק שניהם
4. **Super Admin impersonation זה רק ב-header** → אל תשנה את ה-JWT עצמו
5. **Trial expiration** → בדוק trial_ends_at בכל login

---

**הערה אחרונה:** זה נראה הרבה עבודה, אבל זה חובה לאבטחה! Multi-Tenancy ללא Tenant Middleware = חור אבטחה ענק! 🔒
