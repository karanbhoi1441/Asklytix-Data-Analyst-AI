from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import pandas as pd
from pydantic import BaseModel, Field

class ColumnMetadata(BaseModel):
    name: str
    type: str  # numeric, text, datetime, boolean
    raw_dtype: str
    non_null_count: int
    missing_count: int
    missing_percentage: float
    unique_values_count: int
    examples: List[str]
    min_val: Optional[Any] = None
    max_val: Optional[Any] = None
    mean_val: Optional[float] = None

class StandardDatasetResult(BaseModel):
    row_count: int
    column_count: int
    columns: List[str]
    schema_metadata: List[ColumnMetadata] = Field(alias="schema")
    preview: List[Dict[str, Any]]
    statistics: Dict[str, Any]

    model_config = {"populate_by_name": True}

class BaseParser(ABC):
    @abstractmethod
    def parse_to_dataframe(self, file_path: str) -> pd.DataFrame:
        """Parse file into a standardized pandas DataFrame."""
        pass

    def extract_standard_result(self, df: pd.DataFrame, preview_rows: int = 100) -> StandardDatasetResult:
        """Extract standardized schema, statistics, and preview from DataFrame."""
        row_count, column_count = df.shape
        columns = [str(c) for c in df.columns.tolist()]
        
        schema_list: List[ColumnMetadata] = []
        for col in df.columns:
            series = df[col]
            dtype_str = str(series.dtype)
            
            # Categorize type into high-level categories
            if pd.api.types.is_numeric_dtype(series):
                col_type = "numeric"
            elif pd.api.types.is_datetime64_any_dtype(series):
                col_type = "datetime"
            elif pd.api.types.is_bool_dtype(series):
                col_type = "boolean"
            else:
                col_type = "text"

            non_null = int(series.count())
            missing = int(series.isna().sum())
            missing_pct = round((missing / max(row_count, 1)) * 100, 2)
            uniques = int(series.nunique(dropna=True))
            
            # Sample non-null string representations
            samples = [str(x) for x in series.dropna().head(3).tolist()]
            
            min_val = None
            max_val = None
            mean_val = None
            if col_type == "numeric" and non_null > 0:
                try:
                    min_val = float(series.min())
                    max_val = float(series.max())
                    mean_val = float(series.mean())
                except Exception:
                    pass

            schema_list.append(ColumnMetadata(
                name=str(col),
                type=col_type,
                raw_dtype=dtype_str,
                non_null_count=non_null,
                missing_count=missing,
                missing_percentage=missing_pct,
                unique_values_count=uniques,
                examples=samples,
                min_val=min_val,
                max_val=max_val,
                mean_val=mean_val
            ))

        # Safe preview serialization (handling NaN/Inf/timestamps)
        preview_df = df.head(preview_rows).copy()
        # Convert timestamps / objects to json serializable formats
        preview_records: List[Dict[str, Any]] = []
        for _, row in preview_df.iterrows():
            record = {}
            for col in df.columns:
                val = row[col]
                if pd.isna(val):
                    record[str(col)] = None
                elif isinstance(val, (pd.Timestamp, pd.Timedelta)):
                    record[str(col)] = str(val)
                elif isinstance(val, (int, float, bool, str)):
                    # Handle float inf/nan
                    if isinstance(val, float) and (pd.isna(val) or val != val):
                        record[str(col)] = None
                    else:
                        record[str(col)] = val
                else:
                    record[str(col)] = str(val)
            preview_records.append(record)

        total_missing = int(df.isna().sum().sum())
        total_cells = max(row_count * column_count, 1)

        statistics = {
            "total_cells": total_cells,
            "total_missing_cells": total_missing,
            "overall_completeness_pct": round(((total_cells - total_missing) / total_cells) * 100, 2),
            "numeric_columns_count": sum(1 for c in schema_list if c.type == "numeric"),
            "categorical_columns_count": sum(1 for c in schema_list if c.type == "text"),
            "datetime_columns_count": sum(1 for c in schema_list if c.type == "datetime"),
        }

        return StandardDatasetResult(
            row_count=row_count,
            column_count=column_count,
            columns=columns,
            schema=schema_list,
            preview=preview_records,
            statistics=statistics
        )
