"""
Tenant Helper Functions - Utilities for multi-tenant operations
"""
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session, Query
from uuid import UUID
from typing import Type, TypeVar
from app.models import Organization
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')


def get_org_id(request: Request) -> UUID:
    """
    Extract org_id from request.state
    
    Raises:
        HTTPException: 403 if org_id is missing from request state
    
    Returns:
        UUID: Organization ID
    """
    org_id = getattr(request.state, "org_id", None)
    if not org_id:
        logger.error("Organization context missing from request")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization context missing - please login again"
        )
    return org_id


def get_user_id(request: Request) -> int:
    """Extract user_id from request.state"""
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated"
        )
    return user_id


def is_super_admin(request: Request) -> bool:
    """
    Check if current user is super admin
    
    Returns:
        bool: True if super admin, False otherwise
    """
    return getattr(request.state, "is_super_admin", False)


def require_super_admin(request: Request) -> None:
    """
    Require super admin access
    
    Raises:
        HTTPException: 403 if user is not super admin
    """
    if not is_super_admin(request):
        logger.warning(f"Super admin access denied for user {getattr(request.state, 'user_id', None)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )


def apply_org_filter(query: Query, model: Type[T], request: Request) -> Query:
    """
    Apply org_id filter to a SQLAlchemy query
    
    Usage:
        query = db.query(Customer)
        query = apply_org_filter(query, Customer, request)
        customers = query.all()
    
    Args:
        query: SQLAlchemy Query object
        model: Model class (must have org_id column)
        request: FastAPI Request object
    
    Returns:
        Query: Filtered query
    """
    org_id = get_org_id(request)
    
    if not hasattr(model, 'org_id'):
        logger.error(f"Model {model.__name__} does not have org_id column")
        raise ValueError(f"Model {model.__name__} does not support multi-tenancy")
    
    return query.filter(model.org_id == org_id)


def check_org_limit(
    request: Request, 
    db: Session, 
    resource: str, 
    current_count: int
) -> None:
    """
    Check if organization has reached resource limit
    
    Args:
        request: FastAPI Request
        db: Database session
        resource: Resource type ('trucks', 'drivers', 'storage_gb')
        current_count: Current count of resources
    
    Raises:
        HTTPException: 403 if limit exceeded
    """
    org_id = get_org_id(request)
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    limits = {
        "trucks": org.max_trucks,
        "drivers": org.max_drivers,
        "storage_gb": org.max_storage_gb
    }
    
    limit = limits.get(resource)
    if limit is None:
        logger.warning(f"Unknown resource type: {resource}")
        return
    
    if limit and current_count >= limit:
        logger.warning(
            f"Org {org_id} reached limit for {resource}: "
            f"{current_count}/{limit}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Organization limit reached for {resource} (maximum: {limit}). "
                   f"Please upgrade your plan or contact support."
        )


def validate_org_resource(
    db: Session,
    model: Type[T],
    resource_id: int,
    org_id: UUID,
    resource_name: str = "Resource"
) -> T:
    """
    Validate that a resource belongs to the organization
    
    Args:
        db: Database session
        model: Model class
        resource_id: Resource ID
        org_id: Organization ID
        resource_name: Human-readable resource name for error messages
    
    Returns:
        The resource object
    
    Raises:
        HTTPException: 404 if not found or belongs to different org
    """
    resource = db.query(model).filter(
        model.id == resource_id,
        model.org_id == org_id
    ).first()
    
    if not resource:
        # NEVER reveal if resource exists in another org - always 404
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name} not found"
        )
    
    return resource


def get_org_stats(db: Session, org_id: UUID) -> dict:
    """
    Get statistics for an organization
    
    Returns:
        dict: Statistics including total trucks, drivers, jobs, etc.
    """
    from app.models import Truck, Driver, Job, Customer
    
    stats = {
        "total_trucks": db.query(Truck).filter(Truck.org_id == org_id).count(),
        "total_drivers": db.query(Driver).filter(Driver.org_id == org_id).count(),
        "total_customers": db.query(Customer).filter(Customer.org_id == org_id).count(),
        "total_jobs": db.query(Job).filter(Job.org_id == org_id).count(),
        "completed_jobs": db.query(Job).filter(
            Job.org_id == org_id,
            Job.status == "CLOSED"  # Enum value is uppercase
        ).count(),
    }
    
    return stats
