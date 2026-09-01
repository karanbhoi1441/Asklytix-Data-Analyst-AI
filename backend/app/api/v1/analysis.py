import os
import pandas as pd
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, Dataset, DatasetVersion
from app.api.v1.deps import get_current_user
from app.services.analysis_engine import AnalysisEngine
from app.services.transformation_engine import TransformationEngine

router = APIRouter()

class AnalysisQueryRequest(BaseModel):
    dataset_id: str
    query: str

class AnalysisTransformRequest(BaseModel):
    dataset_id: str
    prompt: str

@router.post("/query")
def execute_analysis_query(
    req: AnalysisQueryRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    dataset = None
    if req.dataset_id and req.dataset_id not in ("null", "undefined", ""):
        dataset = db.query(Dataset).filter(Dataset.id == req.dataset_id, Dataset.user_id == user.id).first()
    
    if not dataset:
        dataset = db.query(Dataset).filter(Dataset.user_id == user.id).order_by(Dataset.created_at.desc()).first()

    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No dataset found. Please upload a dataset first in the Data Source section."
        )

    active_path = dataset.file_path
    if dataset.active_version_id:
        active_ver = db.query(DatasetVersion).filter(DatasetVersion.id == dataset.active_version_id).first()
        if active_ver and os.path.exists(active_ver.file_path):
            active_path = active_ver.file_path

    res = AnalysisEngine.execute_natural_query(
        file_path=active_path,
        query=req.query,
        dataset_name=dataset.name
    )
    return res

@router.post("/transform")
def execute_analysis_transform(
    req: AnalysisTransformRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    dataset = None
    if req.dataset_id and req.dataset_id not in ("null", "undefined", ""):
        dataset = db.query(Dataset).filter(Dataset.id == req.dataset_id, Dataset.user_id == user.id).first()
        if not dataset:
            dataset = db.query(Dataset).filter(Dataset.id == req.dataset_id).first()
    
    if not dataset:
        dataset = db.query(Dataset).filter(Dataset.user_id == user.id).order_by(Dataset.created_at.desc()).first()

    if not dataset:
        dataset = db.query(Dataset).order_by(Dataset.created_at.desc()).first()

    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No dataset found. Please upload a dataset first in the Data Source section."
        )

    active_path = dataset.file_path
    current_versions = db.query(DatasetVersion).filter(DatasetVersion.dataset_id == dataset.id).all()
    next_ver_num = len(current_versions) + 1

    if dataset.active_version_id:
        active_ver = db.query(DatasetVersion).filter(DatasetVersion.id == dataset.active_version_id).first()
        if active_ver and os.path.exists(active_ver.file_path):
            active_path = active_ver.file_path

    df = AnalysisEngine.get_dataframe(active_path)

    try:
        transformed_df, msg, details = TransformationEngine.apply_transform(df, req.prompt)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    saved_path, size_bytes, new_quality = TransformationEngine.save_transformed_version(
        transformed_df=transformed_df,
        dataset_id=dataset.id,
        version_num=next_ver_num,
        original_format=dataset.format,
        operation_desc=req.prompt
    )

    import uuid
    new_version = DatasetVersion(
        id=str(uuid.uuid4()),
        dataset_id=dataset.id,
        version_number=next_ver_num,
        version_type=f"transform_v{next_ver_num}",
        file_path=saved_path,
        size_bytes=size_bytes,
        row_count=len(transformed_df),
        column_count=len(transformed_df.columns),
        quality_score=new_quality["score"],
        quality_metrics=new_quality,
        cleaning_operations=[f"Transformation: {req.prompt}"]
    )
    db.add(new_version)
    dataset.active_version_id = new_version.id
    db.commit()

    # Clean preview rows for JSON
    preview_rows = []
    for _, r in transformed_df.head(50).iterrows():
        rec = {}
        for c in transformed_df.columns:
            v = r[c]
            rec[str(c)] = None if pd.isna(v) else (round(v, 4) if isinstance(v, float) else (str(v) if not isinstance(v, (int, bool, str)) else v))
        preview_rows.append(rec)

    return {
        "success": True,
        "message": msg,
        "details": details,
        "version_id": new_version.id,
        "version_number": new_ver_num,
        "total_rows": len(transformed_df),
        "columns": [str(c) for c in transformed_df.columns],
        "rows": preview_rows
    }

