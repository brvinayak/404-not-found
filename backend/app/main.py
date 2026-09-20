from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes import upload, optimize, analytics, simulation

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend-only REST API for WarehouseIQ logistics and warehouse location optimization.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(upload.router, prefix=settings.API_PREFIX)
app.include_router(optimize.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(simulation.router, prefix=settings.API_PREFIX)


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify backend service status."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API overview."""
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "endpoints": {
            "upload": "POST /upload",
            "optimize": "POST /optimize",
            "analytics": "GET /analytics",
            "simulate": "POST /simulate",
            "health": "GET /health",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
