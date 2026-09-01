from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class VisualizationRequest(BaseModel):
    dataset_id: Optional[str] = None
    prompt: Optional[str] = None
    question: Optional[str] = None
    mode: Optional[str] = "chart_builder"


class VisualizationMetadata(BaseModel):
    id: Optional[str] = None
    title: str
    chart_type: str
    visualization_type: Optional[str] = None
    value: Optional[Any] = None
    formatted_value: Optional[str] = None
    label: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None
    interactive: Optional[bool] = True
    image_url: Optional[str] = None
    base64_image: Optional[str] = None
    html: Optional[str] = None
    columns_used: List[str] = []
    category_column: Optional[str] = None
    value_column: Optional[str] = None
    geo_column: Optional[str] = None
    metric_column: Optional[str] = None
    aggregation: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = "ready"



class SavedVisualizationItem(BaseModel):
    id: str
    dataset_id: Optional[str] = None
    user_question: str
    chart_type: str
    title: str
    columns_used: List[str] = []
    sandbox_execution_id: Optional[str] = None
    image_url: Optional[str] = None
    base64_image: Optional[str] = None
    html: Optional[str] = None
    generated_code: Optional[str] = None
    explanation: Optional[str] = None
    execution_time_ms: float = 0.0
    position: int = 1
    created_at: Optional[str] = None


class VisualizationResponse(BaseModel):
    status: str
    execution_id: Optional[str] = None
    execution_time_ms: Optional[float] = 0.0
    visualization: Optional[VisualizationMetadata] = None
    chart_specification: Optional[Dict[str, Any]] = None
    html: Optional[str] = None
    saved_item: Optional[SavedVisualizationItem] = None
    generated_code: Optional[str] = None
    explanation: Optional[str] = None
    message: Optional[str] = None
    details: Optional[List[str]] = None


class VisualizationListResponse(BaseModel):
    total: int
    visualizations: List[SavedVisualizationItem]


class VisualSuggestionItem(BaseModel):
    id: str
    suggestion_number: Optional[int] = None
    title: str
    description: Optional[str] = None
    chart_type: str
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    group_column: Optional[str] = None
    aggregation: Optional[str] = None
    icon: Optional[str] = "bar_chart"
    prompt: str
    columns: Optional[List[str]] = []
    reason: Optional[str] = None
    confidence: Optional[float] = 0.95


class VisualSuggestionsResponse(BaseModel):
    dataset_id: str
    dataset_name: str
    total_suggestions: int
    suggestions: List[VisualSuggestionItem]


