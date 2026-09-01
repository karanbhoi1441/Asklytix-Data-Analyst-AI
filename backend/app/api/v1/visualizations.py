import os
from typing import Optional, List
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User, Dataset, DatasetVersion, SavedVisualization
from app.api.v1.deps import get_current_user
from app.schemas.visualization import (
    VisualizationRequest,
    VisualizationResponse,
    VisualizationListResponse,
    SavedVisualizationItem,
    VisualSuggestionItem,
    VisualSuggestionsResponse
)
from app.services.analysis_engine import AnalysisEngine
from app.services.ai_visualization_service import AIVisualizationService
from app.services.suggestion_service import SuggestionService
from app.services.sandbox_service import OUTPUTS_DIR

router = APIRouter()


def _get_suggestions_for_dataset(dataset_id: Optional[str], db: Session, user: User) -> dict:
    dataset = None
    if dataset_id and dataset_id not in ("null", "undefined", ""):
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user.id).first()

    if not dataset:
        dataset = db.query(Dataset).filter(Dataset.user_id == user.id).order_by(Dataset.created_at.desc()).first()

    if not dataset:
        return {
            "dataset_id": "",
            "dataset_name": "No Dataset",
            "total_suggestions": 0,
            "suggestions": []
        }

    # Determine file path
    active_path = dataset.file_path
    if dataset.active_version_id:
        active_ver = db.query(DatasetVersion).filter(DatasetVersion.id == dataset.active_version_id).first()
        if active_ver and os.path.exists(active_ver.file_path):
            active_path = active_ver.file_path

    if not os.path.exists(active_path):
        return {
            "dataset_id": dataset.id,
            "dataset_name": dataset.name,
            "total_suggestions": 0,
            "suggestions": []
        }

    try:
        df = AnalysisEngine.get_dataframe(active_path)
        suggestions_raw = SuggestionService.generate_dataset_suggestions(df, dataset.name, target_count=12)
    except Exception as e:
        suggestions_raw = []

    return {
        "dataset_id": dataset.id,
        "dataset_name": dataset.name,
        "total_suggestions": len(suggestions_raw),
        "suggestions": [
            VisualSuggestionItem(
                id=s["id"],
                suggestion_number=s.get("suggestion_number"),
                title=s["title"],
                description=s.get("description"),
                chart_type=s["chart_type"],
                x_column=s.get("x_column"),
                y_column=s.get("y_column"),
                group_column=s.get("group_column"),
                aggregation=s.get("aggregation"),
                icon=s.get("icon", "bar_chart"),
                prompt=s["prompt"],
                columns=s.get("columns", []),
                reason=s.get("reason"),
                confidence=s.get("confidence", 0.95)
            )
            for s in suggestions_raw
        ]
    }


@router.get("/suggestions", response_model=VisualSuggestionsResponse)
def get_dataset_visual_suggestions(
    dataset_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Analyzes active dataset schema and returns 10-15 dynamic, validated visualization suggestions.
    """
    return _get_suggestions_for_dataset(dataset_id, db, user)


@router.get("/suggestions/{dataset_id}", response_model=VisualSuggestionsResponse)
def get_dataset_visual_suggestions_by_id(
    dataset_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Analyzes specified dataset schema and returns 10-15 dynamic, validated visualization suggestions.
    """
    return _get_suggestions_for_dataset(dataset_id, db, user)



@router.get("", response_model=VisualizationListResponse)
def list_visualizations(
    dataset_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Returns all saved visualizations for the user/dataset, ordered chronologically.
    """
    query = db.query(SavedVisualization).filter(SavedVisualization.user_id == user.id)
    if dataset_id and dataset_id not in ("null", "undefined", ""):
        query = query.filter(SavedVisualization.dataset_id == dataset_id)
    
    items = query.order_by(SavedVisualization.position.asc(), SavedVisualization.created_at.asc()).all()

    return {
        "total": len(items),
        "visualizations": [
            SavedVisualizationItem(
                id=item.id,
                dataset_id=item.dataset_id,
                user_question=item.user_question,
                chart_type=item.chart_type,
                title=item.title,
                columns_used=item.columns_used or [],
                sandbox_execution_id=item.sandbox_execution_id,
                image_url=item.image_url,
                base64_image=item.base64_image,
                generated_code=item.generated_code,
                explanation=item.explanation,
                execution_time_ms=item.execution_time_ms or 0.0,
                position=item.position,
                created_at=item.created_at.isoformat() if item.created_at else None
            )
            for item in items
        ]
    }


@router.post("/generate", response_model=VisualizationResponse)
def generate_visualization_endpoint(
    req: VisualizationRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Generates exactly ONE visualization, executes it inside the secure sandbox,
    persists the output in the database, and returns the result.
    """
    user_query = (req.prompt or req.question or "").strip()
    if not user_query:
        return {
            "status": "validation_error",
            "message": "No query or question was provided for visualization generation.",
            "details": ["Please provide a question or instruction to generate a visualization."],
            "visualization": None
        }

    dataset = None
    if req.dataset_id and req.dataset_id not in ("null", "undefined", ""):
        dataset = db.query(Dataset).filter(Dataset.id == req.dataset_id, Dataset.user_id == user.id).first()
    
    if not dataset:
        dataset = db.query(Dataset).filter(Dataset.user_id == user.id).order_by(Dataset.created_at.desc()).first()

    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active dataset found. Please upload a dataset first."
        )

    # Determine active version file path
    active_path = dataset.file_path
    if dataset.active_version_id:
        active_ver = db.query(DatasetVersion).filter(DatasetVersion.id == dataset.active_version_id).first()
        if active_ver and os.path.exists(active_ver.file_path):
            active_path = active_ver.file_path

    if not os.path.exists(active_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset file could not be found at {active_path}."
        )

    # Load dataframe to inspect schema
    df = AnalysisEngine.get_dataframe(active_path)

    # Run AI Visualization & Sandbox Service
    result = AIVisualizationService.generate_and_execute_visualization(
        prompt=user_query,
        df=df,
        dataset_file_path=active_path,
        dataset_name=dataset.name,
        dataset_id=dataset.id
    )

    if result.get("status") == "success" and result.get("visualization"):
        viz_data = result["visualization"]
        # Determine next position in list
        last_item = db.query(SavedVisualization).filter(
            SavedVisualization.user_id == user.id,
            SavedVisualization.dataset_id == dataset.id
        ).order_by(SavedVisualization.position.desc()).first()
        next_pos = (last_item.position + 1) if last_item else 1

        saved = SavedVisualization(
            user_id=user.id,
            dataset_id=dataset.id,
            user_question=user_query,
            chart_type=viz_data["chart_type"],
            title=viz_data["title"],
            columns_used=viz_data["columns_used"],
            sandbox_execution_id=result.get("execution_id"),
            image_url=viz_data["image_url"],
            base64_image=viz_data.get("base64_image"),
            generated_code=result.get("generated_code"),
            explanation=result.get("explanation"),
            execution_time_ms=result.get("execution_time_ms", 0.0),
            position=next_pos
        )
        db.add(saved)
        db.commit()
        db.refresh(saved)

        result["saved_item"] = {
            "id": saved.id,
            "dataset_id": saved.dataset_id,
            "user_question": saved.user_question,
            "chart_type": saved.chart_type,
            "title": saved.title,
            "columns_used": saved.columns_used or [],
            "sandbox_execution_id": saved.sandbox_execution_id,
            "image_url": saved.image_url,
            "base64_image": saved.base64_image,
            "generated_code": saved.generated_code,
            "explanation": saved.explanation,
            "execution_time_ms": saved.execution_time_ms,
            "position": saved.position,
            "created_at": saved.created_at.isoformat() if saved.created_at else None
        }

    return result


@router.delete("/{visual_id}")
def delete_visualization(
    visual_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Deletes ONE specific visual from the user's collection.
    """
    item = db.query(SavedVisualization).filter(
        SavedVisualization.id == visual_id,
        SavedVisualization.user_id == user.id
    ).first()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visualization not found.")

    db.delete(item)
    db.commit()
    return {"success": True, "message": f"Visualization '{item.title}' deleted successfully."}


@router.delete("/clear/all")
def clear_all_visualizations(
    dataset_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Clears all visualizations for the user/dataset upon explicit confirmation.
    """
    query = db.query(SavedVisualization).filter(SavedVisualization.user_id == user.id)
    if dataset_id and dataset_id not in ("null", "undefined", ""):
        query = query.filter(SavedVisualization.dataset_id == dataset_id)

    deleted_count = query.delete(synchronize_session=False)
    db.commit()
    return {"success": True, "message": f"Cleared {deleted_count} visualizations."}


@router.get("/output/{execution_id}")
def get_visualization_image(execution_id: str):
    image_path = OUTPUTS_DIR / f"{execution_id}.png"
    if not image_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visualization image not found or expired."
        )
    return FileResponse(
        str(image_path),
        media_type="image/png",
        headers={"Content-Disposition": f'inline; filename="AskLytix_chart_{execution_id}.png"'}
    )
