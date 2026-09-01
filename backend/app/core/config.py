import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

# Load .env file from the backend root directory
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent.parent / ".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "AskLytix Analytics Engine"
    API_V1_STR: str = "/api/v1"
    
    # Security & JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "asklytix-super-secure-production-secret-key-2026-x89f")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Cookies
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: str | None = None
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./asklytix.db")
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = "gpt-4o-mini"   # fast & cost-efficient; upgrade to gpt-4o if needed

    # File Storage
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOAD_DIR: Path = STORAGE_DIR / "uploads"
    CLEANED_DIR: Path = STORAGE_DIR / "cleaned"
    MAX_FILE_SIZE_BYTES: int = 500 * 1024 * 1024  # 500 MB

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure storage directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.CLEANED_DIR.mkdir(parents=True, exist_ok=True)
