# Auth & Login System Review (Jan 2026)

## Scope
This document summarizes the authentication and login flow after the security hardening pass.

## Backend Flow

### Email/Password (classic)
- Endpoint: `POST /api/auth/login`
- Source: [backend/app/api/v1/endpoints/auth.py](../backend/app/api/v1/endpoints/auth.py)
- Flow:
  1. Find user by email or by driver phone (Driver → User).
  2. Verify password with bcrypt.
  3. Check `user.is_active`.
  4. Check organization status.
  5. Issue JWT with `org_id`, `org_role`, `is_super_admin`.

### Phone/OTP (primary mobile path)
- Endpoints:
  - `POST /api/phone-auth/send-otp`
  - `POST /api/phone-auth/verify-otp`
  - `POST /api/phone-auth/login-with-password` (dev-only)
- Source: [backend/app/api/v1/endpoints/phone_auth.py](../backend/app/api/v1/endpoints/phone_auth.py)
- Flow:
  1. Resolve organization by `org_slug`.
     - If multiple active orgs exist, `org_slug` is **required**.
     - If exactly one active org exists, it is selected.
  2. Find user by phone within the org.
  3. OTP is created and stored.
  4. OTP verification checks expiry/usage and marks OTP as used.

### JWT & Tenant Context
- JWT creation: [backend/app/core/security.py](../backend/app/core/security.py)
- Tenant middleware: [backend/app/middleware/tenant.py](../backend/app/middleware/tenant.py)
- The middleware injects `org_id`, `user_id`, `org_role`, `is_super_admin` into `request.state`.

## Frontend Flow

### Login Page
- File: [frontend/src/app/login/page.tsx](../frontend/src/app/login/page.tsx)
- Default behavior:
  - OTP flow is the default (password login can be disabled via env flag).
  - No hardcoded phone or password defaults.
- Optional UI flags (client env):
  - `NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN=true` to show password mode.
  - `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true` to show demo credentials block.

### Auth Storage
- State store: [frontend/src/lib/stores/auth.ts](../frontend/src/lib/stores/auth.ts)
- Stores `access_token` and `user` in localStorage.

### Route Guard
- Provider: [frontend/src/components/auth/AuthProvider.tsx](../frontend/src/components/auth/AuthProvider.tsx)
- Redirects unauthenticated users to `/login` for non-public routes.

## Production Hardening Changes
- Removed plaintext OTP printing in production.
- Disabled password login endpoint in production (phone-auth dev mode).
- Enforced `org_slug` when multiple active organizations exist.
- Removed demo defaults from the login page.

## Environment Flags
Add to frontend `.env` to toggle UI features:
```
NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN=true
NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true
```

Backend environment flag (server-side):
- `ENVIRONMENT=production` disables password login under phone-auth.

## Known Constraints
- If multiple active organizations exist, `org_slug` must be provided for phone-auth.
- OTP validity: 5 minutes.
