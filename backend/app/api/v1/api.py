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
