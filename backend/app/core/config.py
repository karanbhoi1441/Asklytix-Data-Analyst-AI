import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

# Load .env file from candidate locations
from dotenv import load_dotenv
for env_path in [
    Path(__file__).resolve().parent.parent.parent / ".env",
    Path(__file__).resolve().parent.parent.parent.parent / ".env",
    Path.cwd() / ".env",
    Path.cwd() / "backend" / ".env",
]:
    if env_path.is_file():
        load_dotenv(dotenv_path=env_path)

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
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")
    COOKIE_DOMAIN: str | None = os.getenv("COOKIE_DOMAIN", None)
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = []

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:80",
            "http://localhost",
        ]
        raw_cors = os.getenv("BACKEND_CORS_ORIGINS", os.getenv("CORS_ORIGINS", os.getenv("FRONTEND_URL", "")))
        if raw_cors:
            if raw_cors.strip().startswith("[") and raw_cors.strip().endswith("]"):
                import json
                try:
                    parsed = json.loads(raw_cors)
                    if isinstance(parsed, list):
                        origins.extend(parsed)
                except Exception:
                    origins.extend([c.strip() for c in raw_cors.split(",") if c.strip()])
            else:
                origins.extend([c.strip() for c in raw_cors.split(",") if c.strip()])
        # Deduplicate while preserving order
        seen = set()
        deduped = []
        for o in origins:
            if o and o not in seen:
                seen.add(o)
                deduped.append(o)
        self.BACKEND_CORS_ORIGINS = deduped
    
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", os.getenv("SUPABASE_KEY", ""))
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Database (Supabase PostgreSQL Connection String)
    # Automatically convert 'postgres://' (common in cloud providers) to 'postgresql://' for SQLAlchemy
    _raw_db_url: str = os.getenv(
        "DATABASE_URL",
        os.getenv("SUPABASE_DB_URL", "")
    )
    if _raw_db_url.startswith("postgres://"):
        _raw_db_url = _raw_db_url.replace("postgres://", "postgresql://", 1)
    DATABASE_URL: str = _raw_db_url
    
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
