from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    customers,
    sites,
    trucks,
    drivers,
    materials,
    jobs,
    pricing,
    statements,
    files,
    super_admin,
    share,
    subcontractors,
    users,
    expenses,
    vehicle_types,
    alerts,
    phone_auth,
    admin_users,
    organization,
    reports,
    push,
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(sites.router, prefix="/sites", tags=["sites"])
api_router.include_router(trucks.router, prefix="/trucks", tags=["fleet"])
api_router.include_router(drivers.router, prefix="/drivers", tags=["fleet"])
api_router.include_router(materials.router, prefix="/materials", tags=["materials"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(pricing.router, tags=["pricing"])
api_router.include_router(statements.router, tags=["statements"])
api_router.include_router(files.router, tags=["files"])
api_router.include_router(super_admin.router, tags=["super-admin"])
api_router.include_router(share.router, prefix="/share", tags=["share"])
api_router.include_router(subcontractors.router, tags=["subcontractors"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(expenses.router, tags=["expenses"])
api_router.include_router(vehicle_types.router, tags=["fleet"])
api_router.include_router(alerts.router, tags=["alerts"])
api_router.include_router(phone_auth.router, tags=["phone-auth"])
api_router.include_router(phone_auth.permissions_router, tags=["permissions"])
api_router.include_router(admin_users.router, tags=["admin"])
api_router.include_router(organization.router, tags=["organization"])
api_router.include_router(reports.router, tags=["reports"])
api_router.include_router(push.router, tags=["push"])
