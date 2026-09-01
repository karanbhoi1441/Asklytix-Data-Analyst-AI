import os
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, Dataset, DatasetVersion
from app.api.v1.deps import get_current_user
from app.services.analysis_engine import AnalysisEngine

router = APIRouter()

@router.get("/metrics")
def get_dashboard_metrics(
    dataset_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    dataset = None
    if dataset_id and dataset_id not in ("null", "undefined", ""):
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()
    if not dataset:
        dataset = db.query(Dataset).filter(Dataset.user_id == user.id).order_by(Dataset.created_at.desc()).first()

    if not dataset:
        # Return empty structure if no datasets yet
        return {
            "kpis": [],
            "mainChartData": [],
            "categorySales": [],
            "customerSegments": [],
            "regionData": [],
            "topProducts": []
        }

    active_path = dataset.file_path
    if dataset.active_version_id:
        active_ver = db.query(DatasetVersion).filter(DatasetVersion.id == dataset.active_version_id).first()
        if active_ver and os.path.exists(active_ver.file_path):
            active_path = active_ver.file_path

    return AnalysisEngine.get_dashboard_metrics(active_path)

