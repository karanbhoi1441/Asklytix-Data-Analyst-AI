from typing import Dict, Any, List
import pandas as pd
import numpy as np

class QualityIssue:
    def __init__(self, severity: str, dimension: str, description: str, column: str | None = None):
        self.severity = severity  # 'warning', 'error', 'info'
        self.dimension = dimension
        self.description = description
        self.column = column

    def to_dict(self) -> Dict[str, Any]:
        return {
            "severity": self.severity,
            "dimension": self.dimension,
            "description": self.description,
            "column": self.column
        }

class DataQualityEngine:
    @classmethod
    def evaluate_dataframe(cls, df: pd.DataFrame) -> Dict[str, Any]:
        if df.empty:
            return {
                "score": 0,
                "completeness": 0,
                "uniqueness": 0,
                "consistency": 0,
                "validity": 0,
                "integrity": 0,
                "issues": [{"severity": "error", "dimension": "Integrity", "description": "Dataset is empty."}],
                "column_scores": {}
            }

        row_count, col_count = df.shape
        total_cells = max(row_count * col_count, 1)
        issues: List[QualityIssue] = []

        # ── 1. Completeness Dimension ──
        total_missing = int(df.isna().sum().sum())
        completeness_ratio = (total_cells - total_missing) / total_cells
        completeness_score = round(completeness_ratio * 100, 1)

        missing_per_col = df.isna().sum().to_dict()
        for col, cnt in missing_per_col.items():
            if cnt > 0:
                pct = round((cnt / row_count) * 100, 1)
                severity = "error" if pct > 25 else "warning"
                issues.append(QualityIssue(
                    severity=severity,
                    dimension="Completeness",
                    description=f"Column '{col}' has {cnt} missing/null values ({pct}%).",
                    column=str(col)
                ))

        # ── 2. Uniqueness Dimension ──
        duplicate_rows_count = int(df.duplicated().sum())
        uniqueness_ratio = (row_count - duplicate_rows_count) / max(row_count, 1)
        uniqueness_score = round(uniqueness_ratio * 100, 1)

        if duplicate_rows_count > 0:
            pct = round((duplicate_rows_count / row_count) * 100, 1)
            issues.append(QualityIssue(
                severity="warning",
                dimension="Uniqueness",
                description=f"Found {duplicate_rows_count} exact duplicate rows ({pct}% of dataset)."
            ))

        # Check potential ID column uniqueness
        id_cols = [c for c in df.columns if any(k in str(c).lower() for k in ["id", "code", "key", "uuid", "sku"])]
        for id_col in id_cols:
            non_null_id_count = int(df[id_col].dropna().count())
            unique_id_count = int(df[id_col].dropna().nunique())
            if non_null_id_count > unique_id_count:
                dup_ids = non_null_id_count - unique_id_count
                issues.append(QualityIssue(
                    severity="error",
                    dimension="Uniqueness",
                    description=f"Identifier column '{id_col}' contains {dup_ids} duplicate keys.",
                    column=str(id_col)
                ))

        # ── 3. Consistency Dimension ──
        consistency_penalties = 0
        total_categorical_cols = 0
        for col in df.columns:
            series = df[col]
            if series.dtype == object:
                total_categorical_cols += 1
                str_series = series.dropna().astype(str)
                # Check whitespace irregularities
                has_leading_trailing_ws = str_series.str.startswith(" ").any() or str_series.str.endswith(" ").any()
                if has_leading_trailing_ws:
                    consistency_penalties += 1
                    issues.append(QualityIssue(
                        severity="info",
                        dimension="Consistency",
                        description=f"Column '{col}' has un-trimmed leading/trailing whitespace.",
                        column=str(col)
                    ))
                # Check case inconsistencies
                unique_lower = str_series.str.lower().nunique()
                unique_raw = str_series.nunique()
                if unique_raw > unique_lower:
                    consistency_penalties += 1
                    issues.append(QualityIssue(
                        severity="warning",
                        dimension="Consistency",
                        description=f"Column '{col}' has mixed casing for identical category names.",
                        column=str(col)
                    ))

        consistency_ratio = max(0.0, 1.0 - (consistency_penalties / max(total_categorical_cols * 2, 1)))
        consistency_score = round(consistency_ratio * 100, 1)

        # ── 4. Validity Dimension ──
        validity_penalties = 0
        total_eval_cols = col_count
        for col in df.columns:
            series = df[col]
            if pd.api.types.is_numeric_dtype(series):
                # Check for inf / nan anomalies or extreme outliers (> 5 std dev)
                num_series = series.dropna()
                if len(num_series) > 10:
                    mean = num_series.mean()
                    std = num_series.std()
                    if std > 0:
                        outliers = ((num_series - mean).abs() > 5 * std).sum()
                        if outliers > 0:
                            validity_penalties += 0.5
                            issues.append(QualityIssue(
                                severity="info",
                                dimension="Validity",
                                description=f"Column '{col}' contains {outliers} extreme numerical outliers (>5 std dev).",
                                column=str(col)
                            ))
            elif series.dtype == object:
                # Check if text column looks like date with mixed formats
                str_vals = series.dropna().astype(str).head(50)
                if any("/" in s or "-" in s for s in str_vals) and "date" in str(col).lower():
                    try:
                        pd.to_datetime(series.dropna(), errors="raise")
                    except Exception:
                        validity_penalties += 1
                        issues.append(QualityIssue(
                            severity="warning",
                            dimension="Validity",
                            description=f"Date column '{col}' has unparseable or mixed date formats.",
                            column=str(col)
                        ))

        validity_ratio = max(0.0, 1.0 - (validity_penalties / max(total_eval_cols, 1)))
        validity_score = round(validity_ratio * 100, 1)

        # ── 5. Data Integrity Dimension ──
        integrity_penalties = 0
        # If any primary ID column has nulls
        for id_col in id_cols:
            if df[id_col].isna().sum() > 0:
                integrity_penalties += 1
                issues.append(QualityIssue(
                    severity="error",
                    dimension="Integrity",
                    description=f"Primary key candidate '{id_col}' has null/missing identifiers.",
                    column=str(id_col)
                ))

        integrity_ratio = max(0.0, 1.0 - (integrity_penalties / max(len(id_cols) or 1, 1)))
        integrity_score = round(integrity_ratio * 100, 1)

        # ── Overall Weighted Quality Score ──
        overall_score = round(
            (completeness_score * 0.35) +
            (uniqueness_score * 0.25) +
            (consistency_score * 0.15) +
            (validity_score * 0.15) +
            (integrity_score * 0.10),
            1
        )

        return {
            "score": int(round(overall_score)),
            "completeness": int(round(completeness_score)),
            "uniqueness": int(round(uniqueness_score)),
            "consistency": int(round(consistency_score)),
            "validity": int(round(validity_score)),
            "integrity": int(round(integrity_score)),
            "issues": [issue.to_dict() for issue in issues],
            "total_rows": row_count,
            "total_columns": col_count,
            "total_missing_cells": total_missing,
            "duplicate_rows": duplicate_rows_count
        }
