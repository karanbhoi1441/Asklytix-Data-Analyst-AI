import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.session import engine, Base
import app.db.models  # Ensure all models are registered
from app.api.v1.auth import router as auth_router
from app.api.v1.datasets import router as datasets_router
from app.api.v1.analysis import router as analysis_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.visualizations import router as visualizations_router

def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        print("[Database] PostgreSQL tables synchronized successfully.")
    except Exception as e:
        print(f"[Database Warning] Could not initialize database tables: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    try:
        from app.services.storage_manager import StorageManager
        from app.db.session import SessionLocal
        db = SessionLocal()
        StorageManager.prune_orphaned_files(db)
        db.close()
    except Exception:
        pass
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS configuration - strictly allowing credentials for HttpOnly cookie authentication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(datasets_router, prefix=f"{settings.API_V1_STR}/datasets", tags=["Datasets"])
app.include_router(analysis_router, prefix=f"{settings.API_V1_STR}/analysis", tags=["Analysis"])
app.include_router(dashboard_router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
app.include_router(visualizations_router, prefix=f"{settings.API_V1_STR}/visualizations", tags=["Visualizations"])
app.include_router(visualizations_router, prefix="/api/visualizations", tags=["Visualizations"])

from fastapi.responses import RedirectResponse

@app.get("/api/docs", include_in_schema=False)
def redirect_api_docs():
    return RedirectResponse(url="/docs")

@app.get("/api/redoc", include_in_schema=False)
def redirect_api_redoc():
    return RedirectResponse(url="/redoc")

@app.get("/api/openapi.json", include_in_schema=False)
def redirect_api_openapi():
    return RedirectResponse(url="/openapi.json")

@app.get("/api", include_in_schema=False)
@app.get("/api/v1", include_in_schema=False)
def api_root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "auth": f"{settings.API_V1_STR}/auth",
            "datasets": f"{settings.API_V1_STR}/datasets",
            "analysis": f"{settings.API_V1_STR}/analysis",
            "dashboard": f"{settings.API_V1_STR}/dashboard",
        }
    }

@app.get("/")
def root_index():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "frontend_url": "http://localhost:5173",
        "api_docs": "http://127.0.0.1:8000/docs",
        "message": "Backend API is running. Open http://localhost:5173 in your browser to use the AskLytix UI."
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME, "version": "1.0.0"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "detail": str(exc)}
    )

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
