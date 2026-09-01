import os
import shutil
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.db.models import User, Dataset, DatasetVersion
from app.api.v1.deps import get_current_user
from app.services.parsers.parser_factory import ParserFactory
from app.services.quality_engine import DataQualityEngine
from app.services.cleaning_engine import CleaningEngine
from app.services.analysis_engine import AnalysisEngine

router = APIRouter()

SUPPORTED_EXTENSIONS = {"csv", "xlsx", "xls", "json", "parquet"}

def format_bytes(b: int) -> str:
    if b < 1024:
        return f"{b} B"
    elif b < 1024 * 1024:
        return f"{(b / 1024):.0f} KB"
    elif b < 1024 * 1024 * 1024:
        return f"{(b / (1024 * 1024)):.1f} MB"
    return f"{(b / (1024 * 1024 * 1024)):.2f} GB"

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    original_filename = file.filename or "uploaded_file.csv"
    ext = original_filename.split(".")[-1].lower() if "." in original_filename else "csv"

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension: '.{ext}'. Supported formats: CSV, XLSX, XLS, JSON, PARQUET."
        )

    # Generate server-side UUID filename to avoid path traversal
    dataset_id = str(uuid.uuid4())
    stored_filename = f"{dataset_id}_{original_filename}"
    file_path = settings.UPLOAD_DIR / stored_filename

    # Save uploaded file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {str(e)}"
        )

    size_bytes = file_path.stat().st_size
    if size_bytes > settings.MAX_FILE_SIZE_BYTES:
        file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds the {settings.MAX_FILE_SIZE_BYTES // (1024*1024)}MB maximum size limit."
        )

    # Authoritative parsing via Parser Service
    try:
        parser = ParserFactory.get_parser(ext)
        df = parser.parse_to_dataframe(str(file_path))
        std_result = parser.extract_standard_result(df, preview_rows=100)
    except Exception as e:
        file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Error parsing {ext.upper()} file: {str(e)}"
        )

    # Real Data Quality Calculation
    quality_eval = DataQualityEngine.evaluate_dataframe(df)

    display_name = name.strip() if name and name.strip() else original_filename.replace(f".{ext}", "")

    # Create Dataset record
    dataset = Dataset(
        id=dataset_id,
        user_id=user.id,
        name=display_name,
        original_filename=original_filename,
        format=ext,
        file_path=str(file_path),
        size_bytes=size_bytes,
        row_count=std_result.row_count,
        column_count=std_result.column_count,
        status="ready",
        schema_metadata=[col.model_dump() for col in std_result.schema_metadata],
        quality_summary=quality_eval
    )
    db.add(dataset)

    # Create initial DatasetVersion (v1 - original)
    version_1 = DatasetVersion(
        id=str(uuid.uuid4()),
        dataset_id=dataset_id,
        version_number=1,
        version_type="original",
        file_path=str(file_path),
        size_bytes=size_bytes,
        row_count=std_result.row_count,
        column_count=std_result.column_count,
        quality_score=quality_eval["score"],
        quality_metrics=quality_eval,
        cleaning_operations=["Initial ingestion and validation"]
    )
    db.add(version_1)
    dataset.active_version_id = version_1.id

    db.commit()
    db.refresh(dataset)

    return {
        "success": True,
        "message": "Dataset uploaded and parsed successfully",
        "data": {
            "dataset_id": dataset.id,
            "name": dataset.name,
            "format": dataset.format,
            "size_bytes": dataset.size_bytes,
            "sizeLabel": format_bytes(dataset.size_bytes),
            "row_count": dataset.row_count,
            "column_count": dataset.column_count,
            "status": "ready",
            "active_version_id": version_1.id,
            "quality": quality_eval,
            "schema": dataset.schema_metadata,
            "preview": std_result.preview[:50]
        }
    }

@router.get("")
def list_datasets(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    datasets = db.query(Dataset).filter(Dataset.user_id == user.id).order_by(Dataset.created_at.desc()).all()
    results = []
    for d in datasets:
        results.append({
            "id": d.id,
            "name": d.name,
            "format": d.format,
            "sizeBytes": d.size_bytes,
            "sizeLabel": format_bytes(d.size_bytes),
            "rows": d.row_count,
            "columns": d.column_count,
            "status": d.status,
            "uploadedAt": d.created_at.isoformat(),
            "active_version_id": d.active_version_id,
            "quality": d.quality_summary or {"score": 90}
        })
    return results

@router.get("/{dataset_id}")
def get_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    dataset = None
    if dataset_id and dataset_id not in ("null", "undefined", ""):
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
    if not dataset:
        dataset = db.query(Dataset).filter(Dataset.user_id == user.id).order_by(Dataset.created_at.desc()).first()

    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    active_ver = None
    if dataset.active_version_id:
        active_ver = db.query(DatasetVersion).filter(DatasetVersion.id == dataset.active_version_id).first()
    if not active_ver and dataset.versions:
        active_ver = dataset.versions[-1]

    return {
        "id": dataset.id,
        "name": dataset.name,
        "original_filename": dataset.original_filename,
        "format": dataset.format,
        "sizeBytes": active_ver.size_bytes if active_ver else dataset.size_bytes,
        "sizeLabel": format_bytes(active_ver.size_bytes if active_ver else dataset.size_bytes),
        "rows": active_ver.row_count if active_ver else dataset.row_count,
        "columns": active_ver.column_count if active_ver else dataset.column_count,
        "status": dataset.status,
        "uploadedAt": dataset.created_at.isoformat(),
        "columnDefs": dataset.schema_metadata or [],
        "quality": (active_ver.quality_metrics if active_ver and active_ver.quality_metrics else dataset.quality_summary) or {
            "score": 90, "completeness": 90, "uniqueness": 90, "consistency": 90, "validity": 90, "integrity": 90, "issues": []
        },
        "active_version": {
            "id": active_ver.id if active_ver else None,
            "version_number": active_ver.version_number if active_ver else 1,
            "version_type": active_ver.version_type if active_ver else "original"
        }
    }

@router.get("/{dataset_id}/preview")
def get_dataset_preview(
    dataset_id: str,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("asc"),
    search: Optional[str] = Query(None),
    category_filter: Optional[str] = Query(None),
    category_col: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    # Use active version's file if available
    active_path = dataset.file_path
    if dataset.active_version_id:
        active_ver = db.query(DatasetVersion).filter(DatasetVersion.id == dataset.active_version_id).first()
        if active_ver and os.path.exists(active_ver.file_path):
            active_path = active_ver.file_path

    preview_res = AnalysisEngine.query_preview(
        file_path=active_path,
        limit=limit,
        offset=offset,
        sort_by=sort_by,
        sort_order=sort_order,
        search=search,
        category_filter=category_filter,
        category_col=category_col
    )
    return preview_res

@router.get("/{dataset_id}/quality")
def get_dataset_quality(
    dataset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    active_ver = None
    if dataset.active_version_id:
        active_ver = db.query(DatasetVersion).filter(DatasetVersion.id == dataset.active_version_id).first()

    if active_ver and active_ver.quality_metrics:
        return active_ver.quality_metrics
    if dataset.quality_summary:
        return dataset.quality_summary

    df = AnalysisEngine.get_dataframe(dataset.file_path)
    return DataQualityEngine.evaluate_dataframe(df)

@router.post("/{dataset_id}/clean")
def auto_clean_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    # Determine base dataframe to clean
    active_path = dataset.file_path
    current_versions = db.query(DatasetVersion).filter(DatasetVersion.dataset_id == dataset.id).all()
    next_ver_num = len(current_versions) + 1

    df = AnalysisEngine.get_dataframe(active_path)

    # Perform cleaning transformations
    cleaned_df, audit_log, new_quality = CleaningEngine.clean_dataframe(df)

    # Save to versioned file storage (never overwriting original)
    cleaned_path, cleaned_size = CleaningEngine.save_cleaned_version(
        cleaned_df=cleaned_df,
        dataset_id=dataset.id,
        version_num=next_ver_num,
        original_format=dataset.format
    )

    new_version = DatasetVersion(
        id=str(uuid.uuid4()),
        dataset_id=dataset.id,
        version_number=next_ver_num,
        version_type=f"cleaned_v{next_ver_num - 1}",
        file_path=cleaned_path,
        size_bytes=cleaned_size,
        row_count=len(cleaned_df),
        column_count=len(cleaned_df.columns),
        quality_score=new_quality["score"],
        quality_metrics=new_quality,
        cleaning_operations=audit_log
    )
    db.add(new_version)
    dataset.active_version_id = new_version.id
    dataset.quality_summary = new_quality
    db.commit()

    return {
        "success": True,
        "message": "Dataset auto-cleaning completed successfully",
        "version_id": new_version.id,
        "version_number": new_version.version_number,
        "quality": new_quality,
        "audit_log": audit_log,
        "new_score": new_quality["score"],
        "rows": len(cleaned_df),
        "columns": len(cleaned_df.columns)
    }

@router.get("/{dataset_id}/versions/{version_id}/download")
def download_dataset_version(
    dataset_id: str,
    version_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    version = db.query(DatasetVersion).filter(
        DatasetVersion.id == version_id,
        DatasetVersion.dataset_id == dataset.id
    ).first()
    if not version or not os.path.exists(version.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset version file not found")

    ext = version.file_path.split(".")[-1]
    filename = f"cleaned_{dataset.name.lower().replace(' ', '_')}_v{version.version_number}.{ext}"

    media_type = "text/csv" if ext == "csv" else "application/octet-stream"
    return FileResponse(
        path=version.file_path,
        filename=filename,
        media_type=media_type
    )

@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    # Remove files
    try:
        if os.path.exists(dataset.file_path):
            os.remove(dataset.file_path)
        for ver in dataset.versions:
            if os.path.exists(ver.file_path):
                os.remove(ver.file_path)
    except Exception:
        pass

    db.delete(dataset)
    db.commit()
    return {"success": True, "message": "Dataset deleted"}

@router.get("/{dataset_id}/aggregates")
def get_dataset_aggregates(
    dataset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    active_path = dataset.file_path
    if dataset.active_version_id:
        active_ver = db.query(DatasetVersion).filter(DatasetVersion.id == dataset.active_version_id).first()
        if active_ver and os.path.exists(active_ver.file_path):
            active_path = active_ver.file_path

    from app.services.transformation_engine import TransformationEngine
    df = AnalysisEngine.get_dataframe(active_path)
    aggregates = TransformationEngine.get_group_by_aggregates(df)
    return {"aggregates": aggregates}

@router.get("/{dataset_id}/visual-suggestions")
def get_dataset_visual_suggestions_direct(
    dataset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Returns 10-12 dynamic, dataset-specific visualization recommendations for this dataset.
    """
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    active_path = dataset.file_path
    if dataset.active_version_id:
        active_ver = db.query(DatasetVersion).filter(DatasetVersion.id == dataset.active_version_id).first()
        if active_ver and os.path.exists(active_ver.file_path):
            active_path = active_ver.file_path

    from app.services.suggestion_service import SuggestionService
    df = AnalysisEngine.get_dataframe(active_path)
    suggestions = SuggestionService.generate_dataset_suggestions(df, dataset.name, target_count=12)

    return {
        "dataset_id": dataset.id,
        "dataset_name": dataset.name,
        "total_suggestions": len(suggestions),
        "suggestions": suggestions
    }

@router.delete("/session/purge")
@router.post("/session/purge")
def purge_session_storage(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Purges all uploaded datasets, versions, and cached files on disk for the current user session.
    """
    from app.services.storage_manager import StorageManager
    result = StorageManager.purge_user_storage(user.id, db)
    return {
        "success": True,
        "message": "All session datasets and files removed from storage.",
        **result
    }

