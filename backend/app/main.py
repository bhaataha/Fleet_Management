from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.middleware.tenant import tenant_middleware
from app.scheduler import init_scheduler, shutdown_scheduler
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class CORSStaticFilesMiddleware(BaseHTTPMiddleware):
    """Add CORS headers to static file responses"""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/uploads"):
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "*"
        return response


app = FastAPI(
    title="Fleet Management API - הובלות עפר",
    description="Fleet Management System for Dirt Hauling Operations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add tenant middleware (auth context for API routes)
app.add_middleware(BaseHTTPMiddleware, dispatch=tenant_middleware)

# Add CORS for static files
app.add_middleware(CORSStaticFilesMiddleware)

# CORS middleware for API (outermost, so it wraps auth errors)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development (includes Flutter Web dynamic ports)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight for 1 hour
)

# Mount static files for uploads (MVP: local storage)
uploads_dir = Path("/app/uploads")
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")
# Also mount on /api/uploads for Traefik routing compatibility
app.mount("/api/uploads", StaticFiles(directory=str(uploads_dir)), name="api_uploads")

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    return {
        "message": "Fleet Management API - הובלות עפר",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Lifecycle events
@app.on_event("startup")
async def startup_event():
    """Initialize scheduler on application startup"""
    logger.info("🚀 Application starting up...")
    init_scheduler()
    logger.info("✅ Startup complete - Alerts system active")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown scheduler gracefully"""
    logger.info("🛑 Application shutting down...")
    shutdown_scheduler()
    logger.info("✅ Shutdown complete")
