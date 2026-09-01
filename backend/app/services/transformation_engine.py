import re
import uuid
from typing import Dict, Any, List, Tuple, Optional
import pandas as pd
import numpy as np
import duckdb

from app.core.config import settings
from app.services.quality_engine import DataQualityEngine

class TransformationEngine:
    """
    Engine to apply natural language & formula transformations to pandas DataFrames
    and DuckDB in-memory tables.
    """

    @classmethod
    def apply_transform(
        cls,
        df: pd.DataFrame,
        prompt_or_formula: str
    ) -> Tuple[pd.DataFrame, str, Dict[str, Any]]:
        """
        Executes a transformation on a DataFrame.
        Supports:
        1. Assignment formulas: new_col = col_a + col_b, margin = (profit / revenue) * 100
        2. Filter expressions: filter where col > 100, volume > 500000
        3. Sorting expressions: sort by col desc
        4. Math scaling: multiply col by 1.18, scale col by 100
        5. Column operations: drop column col, rename col to new_col
        """
        expr = prompt_or_formula.strip()
        transformed = df.copy()
        details: Dict[str, Any] = {
            "prompt": prompt_or_formula,
            "operation": "custom",
            "rows_before": len(df),
            "cols_before": len(df.columns)
        }

        # ── 1. Column Assignment: `new_col = expression` ─────────────────────
        assign_match = re.match(r'^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$', expr)
        if assign_match:
            new_col = assign_match.group(1).strip()
            formula_rhs = assign_match.group(2).strip()

            # Attempt DuckDB SQL evaluation first for robust SQL expressions
            try:
                con = duckdb.connect(":memory:")
                con.register("df_table", transformed)
                
                # Replace standard column names with quoted identifiers if needed
                sql_expr = formula_rhs
                for col in transformed.columns:
                    # Match whole word column name not already in quotes
                    pattern = r'\b' + re.escape(col) + r'\b'
                    sql_expr = re.sub(pattern, f'"{col}"', sql_expr)

                query = f'SELECT *, ({sql_expr}) AS "{new_col}" FROM df_table'
                res_df = con.execute(query).df()
                con.close()

                details["operation"] = "add_column"
                details["new_column"] = new_col
                details["formula"] = formula_rhs
                details["rows_after"] = len(res_df)
                details["cols_after"] = len(res_df.columns)

                msg = f"Created new column '{new_col}' = ({formula_rhs}) across {len(res_df):,} records."
                return res_df, msg, details

            except Exception:
                # Fallback to pandas eval
                try:
                    # Map dataframe columns in local eval context
                    eval_env = {col: transformed[col] for col in transformed.columns}
                    eval_env["np"] = np
                    eval_env["pd"] = pd
                    
                    # Clean pandas expression
                    clean_rhs = formula_rhs
                    computed_series = pd.eval(clean_rhs, local_dict=eval_env, engine="python")
                    transformed[new_col] = computed_series

                    details["operation"] = "add_column"
                    details["new_column"] = new_col
                    details["formula"] = formula_rhs
                    details["rows_after"] = len(transformed)
                    details["cols_after"] = len(transformed.columns)

                    msg = f"Successfully calculated '{new_col}' = ({formula_rhs}) on {len(transformed):,} rows."
                    return transformed, msg, details
                except Exception as eval_err:
                    raise ValueError(f"Failed to evaluate formula '{expr}': {str(eval_err)}")

        # ── 2. Filter Rows: `filter where col > val`, `where col == val`, `col > val` ─
        filter_pattern = re.match(r'^(?:filter\s+(?:where\s+|rows\s+where\s+)?|where\s+)?(.+?[><=!]=?.+)$', expr, re.IGNORECASE)
        if filter_pattern and not any(k in expr.lower() for k in ["create", "add", "make"]):
            filter_cond = filter_pattern.group(1).strip()
            try:
                con = duckdb.connect(":memory:")
                con.register("df_table", transformed)
                
                # Format condition safely
                sql_cond = filter_cond
                for col in transformed.columns:
                    pattern = r'\b' + re.escape(col) + r'\b'
                    sql_cond = re.sub(pattern, f'"{col}"', sql_cond)

                # Convert == to = for SQL
                sql_cond = re.sub(r'==', '=', sql_cond)
                query = f'SELECT * FROM df_table WHERE {sql_cond}'
                filtered_df = con.execute(query).df()
                con.close()

                if len(filtered_df) == 0:
                    return transformed, f"Filter '{filter_cond}' matched 0 rows. Dataset was kept unchanged.", details

                details["operation"] = "filter"
                details["condition"] = filter_cond
                details["rows_after"] = len(filtered_df)
                details["cols_after"] = len(filtered_df.columns)

                msg = f"Applied filter ({filter_cond}): filtered from {len(df):,} down to {len(filtered_df):,} rows."
                return filtered_df, msg, details
            except Exception as e:
                # Fallback to pandas query
                try:
                    filtered_df = transformed.query(filter_cond)
                    msg = f"Applied filter ({filter_cond}): {len(filtered_df):,} matching rows returned."
                    return filtered_df, msg, details
                except Exception:
                    raise ValueError(f"Could not apply filter '{filter_cond}': {str(e)}")

        # ── 3. Sort Rows: `sort by col desc`, `order by col asc` ─────────────
        sort_match = re.match(r'^(?:sort|order)\s+(?:by\s+)?([a-zA-Z0-9_\s]+?)(?:\s+(asc|desc|ascending|descending))?$', expr, re.IGNORECASE)
        if sort_match:
            col_name = sort_match.group(1).strip()
            order_dir = (sort_match.group(2) or "desc").lower()
            ascending = "asc" in order_dir

            # Find matching column
            matched_col = next((c for c in transformed.columns if c.lower() == col_name.lower()), None)
            if not matched_col:
                matched_col = next((c for c in transformed.columns if col_name.lower() in c.lower()), None)

            if matched_col:
                sorted_df = transformed.sort_values(by=matched_col, ascending=ascending).reset_index(drop=True)
                msg = f"Dataset sorted by '{matched_col}' ({'Ascending' if ascending else 'Descending'})."
                details["operation"] = "sort"
                details["sort_col"] = matched_col
                return sorted_df, msg, details

        # ── 4. Drop Column: `drop column col` ─────────────────────────────────
        drop_match = re.match(r'^(?:drop|remove|delete)\s+(?:column\s+)?([a-zA-Z0-9_]+)$', expr, re.IGNORECASE)
        if drop_match:
            target_col = drop_match.group(1).strip()
            matched_col = next((c for c in transformed.columns if c.lower() == target_col.lower()), None)
            if matched_col:
                transformed = transformed.drop(columns=[matched_col])
                msg = f"Column '{matched_col}' dropped successfully. {len(transformed.columns)} columns remain."
                details["operation"] = "drop_column"
                return transformed, msg, details

        # ── 5. Standardized Currency / Text Operation ─────────────────────────
        if "standardize" in expr.lower() or "uppercase" in expr.lower() or "normalize" in expr.lower():
            for c in transformed.select_dtypes(include="object").columns:
                transformed[c] = transformed[c].astype(str).str.strip().str.title()
            msg = "Normalized and title-cased all text categorical columns."
            details["operation"] = "text_normalize"
            return transformed, msg, details

        # If no explicit match, try DuckDB free-form SELECT if starts with SELECT
        if expr.lower().startswith("select "):
            try:
                con = duckdb.connect(":memory:")
                con.register("dataset", transformed)
                res_df = con.execute(expr).df()
                con.close()
                msg = f"Executed custom SQL transformation: {len(res_df):,} rows returned."
                return res_df, msg, details
            except Exception as e:
                raise ValueError(f"Custom SQL query failed: {str(e)}")

        raise ValueError(
            f"Unsupported transformation: '{expr}'. "
            f"Supported examples: 'profit_margin = (Close - Open) / Open * 100', 'Volume > 500000', 'sort by Close desc', 'drop column col_name'"
        )

    @classmethod
    def get_group_by_aggregates(cls, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Dynamically computes top 4-5 grouped aggregations from the actual dataset columns.
        Works for sales, stocks, finance, tech, healthcare, or arbitrary CSV data.
        """
        if len(df) == 0:
            return []

        # Find best categorical column or date column to group by
        cat_cols = [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])]
        num_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]

        group_col = None
        # Check if there is a column with between 2 and 20 unique values
        for c in cat_cols:
            n_unique = df[c].nunique()
            if 2 <= n_unique <= 25:
                group_col = c
                break

        if not group_col and cat_cols:
            group_col = cat_cols[0]

        # Numeric metric column to aggregate
        val_col = next((c for c in num_cols if any(k in c.lower() for k in ["vol", "rev", "sales", "close", "price", "amount", "total"])), None)
        if not val_col and num_cols:
            val_col = num_cols[-1]

        results = []

        if group_col and val_col:
            grouped = df.groupby(group_col).agg(
                count=(val_col, 'count'),
                total_val=(val_col, 'sum'),
                avg_val=(val_col, 'mean')
            ).sort_values(by='total_val', ascending=False).head(5)

            for grp_name, row in grouped.iterrows():
                results.append({
                    "group": str(grp_name),
                    "count": f"{int(row['count']):,} records",
                    "metricName": f"Total {val_col}",
                    "metricValue": f"{row['total_val']:,.2f}" if row['total_val'] < 1e9 else f"{row['total_val']/1e9:.2f}B",
                    "avg": f"Avg: {row['avg_val']:,.2f}"
                })
        elif num_cols:
            # For purely numerical datasets (e.g. stocks with numeric Date/values or no string categories),
            # split by quartile bins on the primary numeric column
            primary_col = val_col or num_cols[0]
            try:
                df_temp = df.copy()
                df_temp['bin'] = pd.qcut(df_temp[primary_col], q=4, duplicates='drop')
                grouped = df_temp.groupby('bin', observed=False).size()
                for b_name, count in grouped.items():
                    results.append({
                        "group": f"{primary_col} range: {b_name}",
                        "count": f"{int(count):,} records",
                        "metricName": f"Records in tier",
                        "metricValue": f"{int(count):,}",
                        "avg": f"{round((count/len(df))*100, 1)}% of dataset"
                    })
            except Exception:
                for c in num_cols[:4]:
                    results.append({
                        "group": str(c),
                        "count": f"{len(df):,} rows",
                        "metricName": "Mean Value",
                        "metricValue": f"{df[c].mean():,.2f}",
                        "avg": f"Max: {df[c].max():,.2f}"
                    })
        else:
            for col in df.columns[:4]:
                results.append({
                    "group": str(col),
                    "count": f"{len(df):,} rows",
                    "metricName": "Non-null count",
                    "metricValue": f"{df[col].notna().sum():,}",
                    "avg": f"Type: {df[col].dtype}"
                })

        return results

    @classmethod
    def save_transformed_version(
        cls,
        transformed_df: pd.DataFrame,
        dataset_id: str,
        version_num: int,
        original_format: str,
        operation_desc: str
    ) -> Tuple[str, int, Dict[str, Any]]:
        version_id = str(uuid.uuid4())
        ext = "parquet" if original_format == "parquet" else "csv"
        filename = f"{dataset_id}_v{version_num}_{version_id}.{ext}"
        output_path = settings.CLEANED_DIR / filename

        if ext == "parquet":
            transformed_df.to_parquet(output_path, index=False)
        else:
            transformed_df.to_csv(output_path, index=False, encoding="utf-8")

        size_bytes = output_path.stat().st_size
        new_quality = DataQualityEngine.evaluate_dataframe(transformed_df)

        return str(output_path), size_bytes, new_quality
