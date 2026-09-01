from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Supabase PostgreSQL Engine Configuration
db_url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""

if db_url and not db_url.startswith("sqlite"):
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=10,
        max_overflow=20,
    )
else:
    # Memory fallback if DATABASE_URL is not yet provided
    fallback_url = db_url or "sqlite:///:memory:"
    engine = create_engine(
        fallback_url,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
