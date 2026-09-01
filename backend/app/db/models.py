import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, BigInteger, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    datasets = relationship("Dataset", back_populates="owner", cascade="all, delete-orphan")

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    format = Column(String(20), nullable=False)  # csv, xlsx, xls, json, parquet
    file_path = Column(String(512), nullable=False)
    size_bytes = Column(BigInteger, nullable=False, default=0)
    row_count = Column(Integer, nullable=False, default=0)
    column_count = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, default="ready")  # ready, processing, error, active
    schema_metadata = Column(JSON, nullable=True)
    quality_summary = Column(JSON, nullable=True)
    active_version_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="datasets")
    versions = relationship("DatasetVersion", back_populates="dataset", cascade="all, delete-orphan", order_by="DatasetVersion.version_number")

class DatasetVersion(Base):
    __tablename__ = "dataset_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False, default=1)
    version_type = Column(String(50), nullable=False, default="original")  # original, cleaned_v1, cleaned_v2
    file_path = Column(String(512), nullable=False)
    size_bytes = Column(BigInteger, nullable=False, default=0)
    row_count = Column(Integer, nullable=False, default=0)
    column_count = Column(Integer, nullable=False, default=0)
    quality_score = Column(Float, nullable=False, default=0.0)
    quality_metrics = Column(JSON, nullable=True)
    cleaning_operations = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    dataset = relationship("Dataset", back_populates="versions")


class SavedVisualization(Base):
    __tablename__ = "saved_visualizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=True, index=True)
    user_question = Column(Text, nullable=False)
    chart_type = Column(String(50), nullable=False, default="bar")
    title = Column(String(255), nullable=False)
    columns_used = Column(JSON, nullable=True)
    sandbox_execution_id = Column(String(64), nullable=True)
    image_url = Column(String(512), nullable=False)
    base64_image = Column(Text, nullable=True)
    generated_code = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    execution_time_ms = Column(Float, nullable=False, default=0.0)
    position = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    owner = relationship("User")
    dataset = relationship("Dataset")

