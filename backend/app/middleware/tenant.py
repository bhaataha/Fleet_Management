"""
Tenant Middleware - Extract org_id from JWT and inject into request.state
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from jose import jwt, JWTError
from app.core.config import settings
from uuid import UUID
from typing import Optional, Dict, Union
import logging

logger = logging.getLogger(__name__)

def _error_response(
    status_code: int,
    detail: str,
    headers: Optional[Dict[str, str]] = None
) -> JSONResponse:
    content = {"detail": detail}
    if headers:
        return JSONResponse(status_code=status_code, content=content, headers=headers)
    return JSONResponse(status_code=status_code, content=content)


async def tenant_middleware(request: Request, call_next):
    """
    Extract org_id from JWT token and inject into request.state
    
    Features:
    - Skip public endpoints (health, docs, login)
    - Skip OPTIONS requests (CORS preflight)
    - Extract org_id from JWT payload
    - Support Super Admin impersonation via X-Org-Id header
    - Inject org_id, user_id, is_super_admin into request.state
    """
    
    # Skip OPTIONS requests (CORS preflight)
    if request.method == "OPTIONS":
        return await call_next(request)
    
    # Skip public endpoints
    public_paths = [
        "/",  # Root path
        "/health",
        "/api/health",  # Health endpoint with API prefix
        "/docs",
        "/api/docs",  # Swagger docs with API prefix
        "/openapi.json",
        "/api/openapi.json",  # OpenAPI schema with prefix
        "/redoc",
        "/api/redoc",  # ReDoc with prefix
        "/api/auth/login",  # Actual route path (API_V1_PREFIX = /api)
        "/api/auth/driver-login",  # Driver phone login
        "/api/v1/auth/login",  # Just in case
        "/api/v1/auth/driver-login",  # Driver phone login v1
        "/api/phone-auth/send-otp",  # Phone OTP sending
        "/api/phone-auth/verify-otp",  # Phone OTP verification
        "/api/phone-auth/resend-otp",  # Phone OTP resend
        "/api/phone-auth/login-with-password",  # Password login (dev mode)
    ]
    
    # Allow all share URLs (public PDF sharing)
    if request.url.path.startswith("/api/share/") or request.url.path.startswith("/share/"):
        return await call_next(request)
    
    if request.url.path in public_paths or request.url.path.startswith("/static"):
        return await call_next(request)
    
    # Get token from Authorization header OR query parameter (for PDF links)
    auth_header = request.headers.get("Authorization")
    token = None
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    else:
        # Check for token in query parameter (for shareable PDF links)
        token = request.query_params.get("token")
    
    if not token:
        return _error_response(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Decode JWT
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        org_id_value = payload.get("org_id")
        is_super_admin = payload.get("is_super_admin", False)
        user_id = payload.get("sub")
        
        if org_id_value is None:
            logger.error(f"Token missing org_id for user {user_id}")
            return _error_response(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Token missing org_id - please login again"
            )
        
        # Convert org_id - support both Integer and UUID formats
        try:
            # Try UUID first (future schema)
            org_id = UUID(org_id_value)
            logger.debug(f"Converted org_id to UUID: {org_id}")
        except (ValueError, TypeError) as uuid_error:
            # Fall back to Integer (current schema)
            try:
                org_id = int(org_id_value)
                logger.debug(f"Converted org_id to Integer: {org_id}")
            except (ValueError, TypeError) as int_error:
                logger.error(f"Failed to convert org_id '{org_id_value}'. UUID error: {uuid_error}, Int error: {int_error}")
                return _error_response(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid org_id format in token"
                )
        
        # Super Admin impersonation: Check X-Org-Id header
        if is_super_admin:
            impersonate_org_id = request.headers.get("X-Org-Id")
            if impersonate_org_id:
                try:
                    # Try UUID first
                    org_id = UUID(impersonate_org_id)
                    logger.info(f"Super Admin {user_id} impersonating org {org_id}")
                except (ValueError, TypeError):
                    # Fall back to Integer
                    try:
                        org_id = int(impersonate_org_id)
                        logger.info(f"Super Admin {user_id} impersonating org {org_id}")
                    except (ValueError, TypeError):
                        return _error_response(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid X-Org-Id header format"
                        )
        
        # Inject into request state
        request.state.org_id = org_id
        request.state.user_id = int(user_id) if user_id else None
        request.state.is_super_admin = is_super_admin
        request.state.org_role = payload.get("org_role", "user")
        
        logger.debug(f"Request authorized: user={user_id}, org={org_id}, super_admin={is_super_admin}")
        
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        return _error_response(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token - please login again",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Unexpected error in tenant middleware: {e}", exc_info=True)
        return _error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}"
        )
    
    return await call_next(request)


def get_current_org_id(request: Request) -> Union[int, UUID]:
    """
    Extract org_id from request state (set by tenant_middleware)
    
    Usage in endpoints:
        org_id = get_current_org_id(request)
        customers = db.query(Customer).filter(Customer.org_id == org_id).all()
    
    Returns:
        Union[int, UUID]: Current organization ID (supports both Integer and UUID)
        
    Raises:
        HTTPException 403: If org_id not found in request state
    """
    org_id = getattr(request.state, "org_id", None)
    if org_id is None:
        logger.error("get_current_org_id called but org_id not in request.state")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization context not available - please login again"
        )
    return org_id


def get_current_user_id(request: Request) -> int:
    """
    Extract user_id from request state
    
    Returns:
        int: Current user ID
        
    Raises:
        HTTPException 403: If user_id not found
    """
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User context not available - please login again"
        )
    return user_id


def is_super_admin(request: Request) -> bool:
    """
    Check if current user is Super Admin
    
    Returns:
        bool: True if user is Super Admin
    """
    return getattr(request.state, "is_super_admin", False)


def get_org_role(request: Request) -> str:
    """
    Get current user's role in organization
    
    Returns:
        str: One of: owner, admin, dispatcher, accounting, driver
    """
    return getattr(request.state, "org_role", "user")


def get_current_user_info(request: Request) -> dict:
    """
    Get complete current user info from request state
    
    Returns:
        dict: {
            "org_id": str (UUID as string),
            "user_id": int,
            "is_super_admin": bool,
            "org_role": str
        }
        
    Raises:
        HTTPException 403: If user context not available
    """
    org_id = getattr(request.state, "org_id", None)
    user_id = getattr(request.state, "user_id", None)
    
    if not org_id or not user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User context not available - please login again"
        )
    
    return {
        "org_id": str(org_id),
        "user_id": user_id,
        "is_super_admin": getattr(request.state, "is_super_admin", False),
        "org_role": getattr(request.state, "org_role", "user")
    }
