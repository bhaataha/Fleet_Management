"""
Tenant Middleware - Extract org_id from JWT and inject into request.state
"""
from fastapi import Request, HTTPException, status
from jose import jwt, JWTError
from app.core.config import settings
from uuid import UUID
import logging

logger = logging.getLogger(__name__)


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
        "/health",
        "/docs",
        "/openapi.json",
        "/redoc",
        "/api/auth/login",  # Actual route path (API_V1_PREFIX = /api)
        "/api/v1/auth/login",  # Just in case
    ]
    
    if request.url.path in public_paths or request.url.path.startswith("/static"):
        return await call_next(request)
    
    # Get Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_header.split(" ")[1]
    
    try:
        # Decode JWT
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        org_id_str = payload.get("org_id")
        is_super_admin = payload.get("is_super_admin", False)
        user_id = payload.get("sub")
        
        if not org_id_str:
            logger.error(f"Token missing org_id for user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Token missing org_id - please login again"
            )
        
        # Convert to UUID
        org_id = UUID(org_id_str)
        
        # Super Admin impersonation: Check X-Org-Id header
        if is_super_admin:
            impersonate_org_id = request.headers.get("X-Org-Id")
            if impersonate_org_id:
                try:
                    org_id = UUID(impersonate_org_id)
                    logger.info(f"Super Admin {user_id} impersonating org {org_id}")
                except ValueError:
                    raise HTTPException(
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token - please login again",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ValueError as e:
        logger.error(f"UUID conversion error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid org_id format in token"
        )
    except Exception as e:
        logger.error(f"Unexpected error in tenant middleware: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}"
        )
    
    return await call_next(request)
