# מדריך המשך - Multi-Tenant Implementation

## 📋 מצב נוכחי

המערכת עברה בהצלחה ממערכת חד-ארגונית (**Single-Tenant**) למערכת רב-ארגונית (**Multi-Tenant**) ברמת מסד הנתונים והמודלים בלבד.

### ✅ הושלם:
- מבנה DB מלא עם org_id בכל הטבלאות
- Organization model מלא (UUID-based, 30+ columns)
- כל המודלים מחוברים נכון
- ארגון ברירת מחדל נוצר
- Backend עובד ללא שגיאות

### ⚠️ חסר:
- Tenant Middleware (סינון אוטומטי לפי org_id)
- עדכון JWT tokens
- עדכון כל ה-API endpoints
- Super Admin interface
- Frontend updates

---

## 🎯 שלבי הטמעה נותרים

### שלב 1: Tenant Middleware (קריטי!)

#### 1.1 צור קובץ middleware
**קובץ**: `backend/app/middleware/tenant.py`

```python
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import jwt
from app.core.config import settings

async def tenant_middleware(request: Request, call_next):
    """
    Middleware to inject org_id into request state from JWT token
    """
    # Skip middleware for public endpoints
    public_endpoints = [
        "/health",
        "/api/auth/login",
        "/api/auth/signup",
        "/docs",
        "/openapi.json"
    ]
    
    if any(request.url.path.startswith(path) for path in public_endpoints):
        return await call_next(request)
    
    # Extract token from Authorization header
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return JSONResponse(
            status_code=401,
            content={"detail": "Missing or invalid authorization header"}
        )
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        # Decode JWT token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        # Inject org_id into request state
        request.state.org_id = payload.get("org_id")
        request.state.is_super_admin = payload.get("is_super_admin", False)
        request.state.user_id = payload.get("sub")  # email or user_id
        
        # Allow super_admin to impersonate organizations via header
        if request.state.is_super_admin:
            impersonate_org = request.headers.get("X-Org-Id")
            if impersonate_org:
                request.state.org_id = impersonate_org
        
        if not request.state.org_id:
            return JSONResponse(
                status_code=401,
                content={"detail": "Token missing org_id"}
            )
            
    except jwt.ExpiredSignatureError:
        return JSONResponse(
            status_code=401,
            content={"detail": "Token expired"}
        )
    except jwt.InvalidTokenError:
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid token"}
        )
    
    response = await call_next(request)
    return response
```

#### 1.2 הוסף ל-main.py
```python
from app.middleware.tenant import tenant_middleware

# Add after app initialization
app.middleware("http")(tenant_middleware)
```

---

### שלב 2: עדכון JWT Tokens

#### 2.1 עדכן security.py
**קובץ**: `backend/app/core/security.py`

```python
from app.models import User
from datetime import datetime, timedelta
import jwt
from app.core.config import settings

def create_access_token(user: User) -> str:
    """Create JWT token with org_id"""
    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + expires_delta
    
    payload = {
        "sub": user.email,
        "org_id": str(user.org_id),  # Convert UUID to string
        "is_super_admin": user.is_super_admin,
        "org_role": user.org_role,
        "exp": expire
    }
    
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
```

#### 2.2 עדכן login endpoint
**קובץ**: `backend/app/api/v1/endpoints/auth.py`

```python
@router.post("/login")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    
    # Check organization status
    org = db.query(Organization).filter(Organization.id == user.org_id).first()
    if not org or org.status == "suspended":
        raise HTTPException(403, "Organization suspended")
    
    token = create_access_token(user)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "name": user.name,
            "org_id": str(user.org_id),
            "org_name": org.name,
            "plan_type": org.plan_type,
            "is_super_admin": user.is_super_admin
        }
    }
```

---

### שלב 3: Helper Functions

#### 3.1 צור tenant utilities
**קובץ**: `backend/app/core/tenant.py`

```python
from fastapi import Request, HTTPException
from sqlalchemy.orm import Query
from uuid import UUID

def get_org_id(request: Request) -> UUID:
    """Extract org_id from request state"""
    org_id = getattr(request.state, "org_id", None)
    if not org_id:
        raise HTTPException(401, "Organization context missing")
    return UUID(org_id) if isinstance(org_id, str) else org_id

def is_super_admin(request: Request) -> bool:
    """Check if user is super admin"""
    return getattr(request.state, "is_super_admin", False)

def apply_org_filter(query: Query, model, request: Request) -> Query:
    """Apply org_id filter to SQLAlchemy query"""
    org_id = get_org_id(request)
    return query.filter(model.org_id == org_id)

def check_org_limit(request: Request, resource: str, current_count: int):
    """Check if organization exceeded resource limits"""
    # TODO: Query organization limits and compare
    # For now, just a placeholder
    pass
```

---

### שלב 4: עדכון Endpoints (דוגמאות)

#### 4.1 Customers endpoint
**קובץ**: `backend/app/api/v1/endpoints/customers.py`

```python
from fastapi import APIRouter, Depends, Request
from app.core.tenant import get_org_id, apply_org_filter
from app.models import Customer

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("/")
def list_customers(request: Request, db: Session = Depends(get_db)):
    org_id = get_org_id(request)
    customers = db.query(Customer).filter(Customer.org_id == org_id).all()
    return customers

@router.post("/")
def create_customer(
    data: CustomerCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    org_id = get_org_id(request)
    customer = Customer(**data.dict(), org_id=org_id)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.get("/{id}")
def get_customer(id: int, request: Request, db: Session = Depends(get_db)):
    org_id = get_org_id(request)
    customer = db.query(Customer).filter(
        Customer.id == id,
        Customer.org_id == org_id
    ).first()
    
    if not customer:
        raise HTTPException(404, "Customer not found")
    
    return customer

@router.patch("/{id}")
def update_customer(
    id: int,
    data: CustomerUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    org_id = get_org_id(request)
    customer = db.query(Customer).filter(
        Customer.id == id,
        Customer.org_id == org_id
    ).first()
    
    if not customer:
        raise HTTPException(404, "Customer not found")
    
    for key, value in data.dict(exclude_unset=True).items():
        setattr(customer, key, value)
    
    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{id}")
def delete_customer(id: int, request: Request, db: Session = Depends(get_db)):
    org_id = get_org_id(request)
    customer = db.query(Customer).filter(
        Customer.id == id,
        Customer.org_id == org_id
    ).first()
    
    if not customer:
        raise HTTPException(404, "Customer not found")
    
    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted"}
```

#### 4.2 רשימת קבצים לעדכון

צריך לעדכן את **כל** הקבצים הבאים באותה דרך:

1. ✅ `customers.py` (דוגמה למעלה)
2. ⏳ `sites.py`
3. ⏳ `drivers.py`
4. ⏳ `trucks.py`
5. ⏳ `trailers.py`
6. ⏳ `materials.py`
7. ⏳ `price_lists.py`
8. ⏳ `jobs.py`
9. ⏳ `delivery_notes.py`
10. ⏳ `files.py`
11. ⏳ `statements.py`
12. ⏳ `payments.py`
13. ⏳ `expenses.py`

---

### שלב 5: Super Admin API

#### 5.1 צור super admin endpoints
**קובץ**: `backend/app/api/v1/endpoints/super_admin.py`

```python
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.tenant import is_super_admin
from app.models import Organization, User
from pydantic import BaseModel
from uuid import UUID

router = APIRouter(prefix="/super-admin", tags=["Super Admin"])

def require_super_admin(request: Request):
    """Dependency to check super admin"""
    if not is_super_admin(request):
        raise HTTPException(403, "Super Admin access required")
    return True

class OrganizationCreate(BaseModel):
    name: str
    slug: str
    contact_email: str
    plan_type: str = "trial"

@router.get("/organizations")
def list_all_organizations(
    _: bool = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """List all organizations (Super Admin only)"""
    orgs = db.query(Organization).all()
    return orgs

@router.post("/organizations")
def create_organization(
    data: OrganizationCreate,
    _: bool = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Create new organization (Super Admin only)"""
    org = Organization(**data.dict())
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

@router.get("/organizations/{org_id}")
def get_organization_details(
    org_id: UUID,
    _: bool = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Get organization details with stats"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(404, "Organization not found")
    
    # Get counts
    users_count = db.query(User).filter(User.org_id == org_id).count()
    # ... add more stats
    
    return {
        **org.__dict__,
        "users_count": users_count
    }

@router.patch("/organizations/{org_id}")
def update_organization(
    org_id: UUID,
    data: dict,
    _: bool = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Update organization (Super Admin only)"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(404, "Organization not found")
    
    for key, value in data.items():
        if hasattr(org, key):
            setattr(org, key, value)
    
    db.commit()
    db.refresh(org)
    return org

@router.post("/organizations/{org_id}/suspend")
def suspend_organization(
    org_id: UUID,
    reason: str,
    _: bool = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Suspend organization"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(404, "Organization not found")
    
    org.status = "suspended"
    org.suspended_reason = reason
    db.commit()
    
    return {"message": "Organization suspended"}
```

#### 5.2 הוסף ל-api.py
```python
from app.api.v1.endpoints import super_admin

api_router.include_router(super_admin.router)
```

---

### שלב 6: Frontend Updates

#### 6.1 עדכן auth store
**קובץ**: `frontend/src/lib/stores/auth.ts`

```typescript
interface User {
  email: string
  name: string
  org_id: string
  org_name: string
  plan_type: string
  is_super_admin: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  organization: Organization | null
}
```

#### 6.2 צור Organization Selector (Super Admin)
**קובץ**: `frontend/src/components/super-admin/OrganizationSelector.tsx`

```typescript
export function OrganizationSelector() {
  const [organizations, setOrganizations] = useState([])
  const [selectedOrg, setSelectedOrg] = useState(null)
  
  useEffect(() => {
    fetch('/api/super-admin/organizations', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(setOrganizations)
  }, [])
  
  const handleOrgChange = (orgId: string) => {
    setSelectedOrg(orgId)
    // Set X-Org-Id header for impersonation
    localStorage.setItem('impersonate_org_id', orgId)
  }
  
  return (
    <select onChange={(e) => handleOrgChange(e.target.value)}>
      {organizations.map(org => (
        <option key={org.id} value={org.id}>{org.name}</option>
      ))}
    </select>
  )
}
```

---

## 🧪 Testing Plan

### Test 1: Multi-Org Isolation
```sql
-- Create second organization
INSERT INTO organizations (id, name, slug, contact_email, plan_type, status)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Test Organization 2',
  'test-org-2',
  'test@org2.com',
  'trial',
  'active'
);

-- Create user in org 2
INSERT INTO users (org_id, email, name, password_hash)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'user2@org2.com',
  'User 2',
  '<hashed_password>'
);

-- Create customer in org 2
INSERT INTO customers (org_id, name, contact_name)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Customer in Org 2',
  'Contact 2'
);
```

### Test 2: Verify Isolation
1. Login as user from Org 1
2. Try to list customers → Should only see Org 1 customers
3. Login as user from Org 2
4. Try to list customers → Should only see Org 2 customers
5. Try to access Org 1 customer by ID → Should return 404

---

## 📊 Success Metrics

- [ ] Middleware extracts org_id from JWT
- [ ] All API endpoints filter by org_id
- [ ] Cross-org access returns 404
- [ ] Super Admin can list all organizations
- [ ] Super Admin can impersonate organizations
- [ ] Frontend displays organization name
- [ ] Trial organizations see banner
- [ ] Limits enforced (max_trucks, max_drivers)

---

## ⚠️ Common Pitfalls

1. **Forgetting org_id filter**: Every query MUST filter by org_id
2. **Not validating org_id on updates**: Check org_id matches before UPDATE/DELETE
3. **Leaking data in error messages**: Don't reveal if resource exists in other org
4. **Missing indexes**: All org_id columns should have indexes
5. **Not testing cross-org**: Always test with 2+ organizations

---

## 📚 Documentation Links

- [Multi-Tenant Spec](docs/architecture/MULTI_TENANT_SPEC.md) - Full specification
- [Migration Status](MULTI_TENANT_STATUS.md) - Current completion status
- [Plan.md](docs/architecture/plan.md) - Original system requirements
