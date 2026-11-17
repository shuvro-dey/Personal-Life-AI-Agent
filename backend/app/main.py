from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import Base, engine
import app.models  # Ensures all models are registered with Base.metadata
from app.api.auth import router as auth_router
from app.api.shopping import router as shopping_router
from app.api.reminders import router as reminders_router
from app.api.study import router as study_router
from app.api.dashboard import router as dashboard_router
from app.services.scheduler_service import start_scheduler, stop_scheduler

settings = get_settings()


# Create tables on import as well to ensure tests and direct sessions have schemas ready
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure SQLite tables exist on first run
    Base.metadata.create_all(bind=engine)
    start_scheduler()
    yield
    # Shutdown logic
    stop_scheduler()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix="/api")
app.include_router(shopping_router, prefix="/api")
app.include_router(reminders_router, prefix="/api")
app.include_router(study_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")


@app.get("/api/health", tags=["System"])
def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
