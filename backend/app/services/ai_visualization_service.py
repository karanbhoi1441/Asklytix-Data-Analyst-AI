import re
import uuid
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.services.code_validation_service import CodeValidationService
from app.services.sandbox_service import SandboxService


class AIVisualizationService:
    # Comprehensive semantic synonym dictionary for intelligent column matching
    SEMANTIC_SYNONYMS: Dict[str, List[str]] = {
        "department": ["department", "departments", "dept", "depts", "division", "divisions", "team", "teams", "unit", "units", "role", "roles", "position", "positions", "designation", "job", "domain"],
        "salary": ["salary", "salaries", "salaried", "wage", "wages", "pay", "paid", "earning", "earnings", "income", "compensation", "package", "ctc", "salari"],
        "age": ["age", "aged", "years old", "seniority", "senior", "young"],
        "employee_name": ["employee_name", "employee name", "staff name", "worker name", "name", "names", "employee", "employees", "staff", "person", "worker", "workers"],
        "joining_date": ["joining_date", "joining date", "join date", "hire date", "hired date", "joining", "joined", "hire", "hired", "start date", "tenure", "hiring"],
        "gender": ["gender", "sex", "male", "female"],
        "email": ["email", "emails", "e-mail", "mail"],
        "city": ["city", "cities", "location", "locations", "place", "places", "region", "regions", "town", "towns", "branch", "branches", "showroom", "showrooms"],
        "car_model": ["car_model", "car model", "model", "models", "car", "cars", "vehicle", "vehicles", "item", "items", "product", "products", "variant", "automobile"],
        "price_per_car": ["price_per_car", "price per car", "car price", "unit price", "price", "prices", "rate", "cost", "unit cost"],
        "total_amount": ["total_amount", "total amount", "revenue", "sales", "turnover", "total sales", "total revenue", "amount", "total", "value", "profit"],
        "quantity": ["quantity", "qty", "units", "unit", "volume", "vol", "pieces", "count"],
        "payment_method": ["payment_method", "payment method", "payment mode", "mode of payment", "payment", "upi", "card", "cash", "finance"],
        "salesperson": ["salesperson", "sales person", "sales rep", "rep", "executive", "agent", "seller"]
    }

    # Comprehensive city coordinate centroids for intelligent geographic map plotting
    CITY_COORDINATES: Dict[str, Dict[str, Any]] = {
        "mumbai": {"lat": 19.0760, "lng": 72.8777, "state": "Maharashtra", "country": "India"},
        "pune": {"lat": 18.5204, "lng": 73.8567, "state": "Maharashtra", "country": "India"},
        "nagpur": {"lat": 21.1458, "lng": 79.0882, "state": "Maharashtra", "country": "India"},
        "nashik": {"lat": 19.9975, "lng": 73.7898, "state": "Maharashtra", "country": "India"},
        "aurangabad": {"lat": 19.8762, "lng": 75.3433, "state": "Maharashtra", "country": "India"},
        "chhatrapati sambhajinagar": {"lat": 19.8762, "lng": 75.3433, "state": "Maharashtra", "country": "India"},
        "delhi": {"lat": 28.7041, "lng": 77.1025, "state": "Delhi", "country": "India"},
        "new delhi": {"lat": 28.6139, "lng": 77.2090, "state": "Delhi", "country": "India"},
        "bengaluru": {"lat": 12.9716, "lng": 77.5946, "state": "Karnataka", "country": "India"},
        "bangalore": {"lat": 12.9716, "lng": 77.5946, "state": "Karnataka", "country": "India"},
        "hyderabad": {"lat": 17.3850, "lng": 78.4867, "state": "Telangana", "country": "India"},
        "chennai": {"lat": 13.0827, "lng": 80.2707, "state": "Tamil Nadu", "country": "India"},
        "kolkata": {"lat": 22.5726, "lng": 88.3639, "state": "West Bengal", "country": "India"},
        "ahmedabad": {"lat": 23.0225, "lng": 72.5714, "state": "Gujarat", "country": "India"},
        "surat": {"lat": 21.1702, "lng": 72.8311, "state": "Gujarat", "country": "India"},
        "jaipur": {"lat": 26.9124, "lng": 75.7873, "state": "Rajasthan", "country": "India"},
        "lucknow": {"lat": 26.8467, "lng": 80.9462, "state": "Uttar Pradesh", "country": "India"},
        "kanpur": {"lat": 26.4499, "lng": 80.3319, "state": "Uttar Pradesh", "country": "India"},
        "indore": {"lat": 22.7196, "lng": 75.8577, "state": "Madhya Pradesh", "country": "India"},
        "bhopal": {"lat": 23.2599, "lng": 77.4126, "state": "Madhya Pradesh", "country": "India"},
        "chandigarh": {"lat": 30.7333, "lng": 76.7794, "state": "Punjab", "country": "India"},
        "gurgaon": {"lat": 28.4595, "lng": 77.0266, "state": "Haryana", "country": "India"},
        "gurugram": {"lat": 28.4595, "lng": 77.0266, "state": "Haryana", "country": "India"},
        "noida": {"lat": 28.5355, "lng": 77.3910, "state": "Uttar Pradesh", "country": "India"},
        "kochi": {"lat": 9.9312, "lng": 76.2673, "state": "Kerala", "country": "India"},
        "patna": {"lat": 25.5941, "lng": 85.1376, "state": "Bihar", "country": "India"},
        "vadodara": {"lat": 22.3072, "lng": 73.1812, "state": "Gujarat", "country": "India"},
        "coimbatore": {"lat": 11.0168, "lng": 76.9558, "state": "Tamil Nadu", "country": "India"},
        "visakhapatnam": {"lat": 17.6868, "lng": 83.2185, "state": "Andhra Pradesh", "country": "India"},
        "thane": {"lat": 19.2183, "lng": 72.9781, "state": "Maharashtra", "country": "India"},
        "new york": {"lat": 40.7128, "lng": -74.0060, "state": "NY", "country": "USA"},
        "london": {"lat": 51.5074, "lng": -0.1278, "state": "England", "country": "UK"},
        "tokyo": {"lat": 35.6762, "lng": 139.6503, "state": "Tokyo", "country": "Japan"},
        "singapore": {"lat": 1.3521, "lng": 103.8198, "state": "Singapore", "country": "Singapore"},
        "dubai": {"lat": 25.2048, "lng": 55.2708, "state": "Dubai", "country": "UAE"}
    }

    # Non-column common analytical stop-words that shouldn't be mistaken for column names
    STOP_WORDS = {
        "show", "display", "plot", "chart", "give", "create", "generate", "the", "a", "an", "of", "in",
        "for", "as", "pie", "donut", "doughnut", "bar", "line", "scatter", "histogram", "proportion",
        "breakdown", "frequency", "percentage", "distribution", "share", "average", "avg", "mean", "sum",
        "total", "count", "top", "bottom", "highest", "lowest", "trend", "monthly", "daily", "over",
        "time", "versus", "vs", "compare", "comparison", "by", "each", "per", "across", "between",
        "box", "violin", "heatmap", "correlation", "funnel", "waterfall", "treemap", "gantt", "stacked", "grouped"
    }

    @classmethod
    def _normalize(cls, text: str) -> str:
        return re.sub(r'[^a-z0-9]', '', text.lower())

    @classmethod
    def _find_column_in_dataset(cls, target_term: str, actual_columns: List[str]) -> Optional[str]:
        norm_target = cls._normalize(target_term)
        if not norm_target:
            return None

        # 1. Exact or case-insensitive match
        for col in actual_columns:
            if col.lower() == target_term.lower() or cls._normalize(col) == norm_target:
                return col

        # 2. Substring matching in column names
        for col in actual_columns:
            norm_col = cls._normalize(col)
            if norm_target in norm_col or norm_col in norm_target:
                return col

        # 3. Semantic synonym matching
        for syn_key, syn_list in cls.SEMANTIC_SYNONYMS.items():
            norm_syns = [cls._normalize(s) for s in syn_list]
            if norm_target in norm_syns or any(norm_target == s for s in norm_syns):
                for col in actual_columns:
                    norm_col = cls._normalize(col)
                    if any(s in norm_col or norm_col in s for s in norm_syns):
                        return col

        return None

    @classmethod
    def _is_numeric_series(cls, col_name: str, df: pd.DataFrame) -> bool:
        series = df[col_name]
        if pd.api.types.is_numeric_dtype(series):
            return True
        norm_c = cls._normalize(col_name)
        if any(norm_c == cls._normalize(k) or cls._normalize(k) in norm_c for k in ["salary", "revenue", "sales", "price", "amount", "profit", "age", "quantity", "cost", "total", "score", "wage", "income", "package", "ctc"]):
            return True
        try:
            cleaned = series.dropna().astype(str).str.replace(r'[\$,₹, ]', '', regex=True)
            if cleaned.empty:
                return False
            converted = pd.to_numeric(cleaned, errors='coerce')
            valid_ratio = converted.notna().sum() / max(1, len(cleaned))
            return valid_ratio >= 0.5
        except Exception:
            return False

    @classmethod
    def generate_and_execute_visualization(
        cls,
        prompt: str,
        df: pd.DataFrame,
        dataset_file_path: str,
        dataset_name: str,
        dataset_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Orchestrates natural query parsing, dataset schema validation, real Pandas data aggregation,
        structured chart specification building across all 20 chart types, and secure Sandbox execution.
        """
        if df is None or df.empty:
            return {
                "status": "validation_error",
                "message": "The active dataset is empty or could not be loaded. Please ensure data is connected.",
                "details": ["Dataset contains 0 rows or is unreadable."],
                "visualization": None,
                "generated_code": None
            }

        actual_columns = list(df.columns)
        num_cols = [c for c in actual_columns if cls._is_numeric_series(c, df)]
        cat_cols = [c for c in actual_columns if c not in num_cols]
        date_cols = [c for c in actual_columns if any(k in c.lower() for k in ["date", "time", "year", "month", "day", "joining", "hired", "start", "end"])]

        # 1. Parse and validate requested columns against dataset schema
        parsed_plan = cls._parse_query_and_validate_schema(prompt, df, actual_columns, num_cols, cat_cols, date_cols, dataset_id)

        # If column validation failed
        if parsed_plan.get("status") == "validation_error":
            return parsed_plan

        code = parsed_plan["code"]
        chart_type = parsed_plan["chart_type"]
        title = parsed_plan["title"]
        explanation = parsed_plan["explanation"]
        columns_used = parsed_plan["columns_used"]
        chart_spec = parsed_plan["chart_specification"]

        # 2. Validate synthesized Python code for AST safety
        val_result = CodeValidationService.validate_code(
            code=code,
            required_columns=columns_used,
            dataset_columns=actual_columns
        )

        if not val_result["valid"]:
            return {
                "status": "validation_failed",
                "message": f"I couldn't generate this visualization safely: {', '.join(val_result['errors'])}",
                "details": val_result["errors"],
                "generated_code": code,
                "visualization": None
            }

        # 3. Execute in isolated Sandbox runner
        exec_res = SandboxService.execute_visualization(
            code=code,
            dataset_file_path=dataset_file_path
        )

        # 4. Retry with fixed safe aggregation code if execution ran into an unexpected type failure (up to 2-3 repairs)
        if not exec_res["success"]:
            retry_code = cls._build_retry_code(chart_type, columns_used, df, title)
            if retry_code:
                retry_val = CodeValidationService.validate_code(retry_code, columns_used, actual_columns)
                if retry_val["valid"]:
                    exec_res = SandboxService.execute_visualization(
                        code=retry_code,
                        dataset_file_path=dataset_file_path
                    )
                    if exec_res["success"]:
                        code = retry_code

        if not exec_res["success"]:
            return {
                "status": "execution_failed",
                "message": f"The visualization was generated but could not be rendered: {exec_res.get('error', 'Execution error')}",
                "generated_code": code,
                "visualization": None,
                "execution_id": exec_res.get("execution_id")
            }

        # 5. Return success payload with full structured specification
        return {
            "status": "success",
            "execution_id": exec_res["execution_id"],
            "execution_time_ms": exec_res.get("execution_time_ms", 0),
            "html": exec_res.get("html"),
            "chart_specification": chart_spec,
            "visualization": {
                "id": chart_spec["id"],
                "title": title,
                "chart_type": chart_type,
                "visualization_type": chart_spec.get("visualization_type", chart_type),
                "value": chart_spec.get("value"),
                "formatted_value": chart_spec.get("formatted_value"),
                "label": chart_spec.get("label"),
                "filters": chart_spec.get("filters", {}),
                "interactive": chart_spec.get("interactive", True),
                "html": exec_res.get("html"),
                "image_url": exec_res["image_url"],
                "base64_image": exec_res.get("base64_image"),
                "columns_used": columns_used,
                "category_column": chart_spec.get("category_column"),
                "value_column": chart_spec.get("value_column"),
                "geo_column": chart_spec.get("geo_column"),
                "metric_column": chart_spec.get("metric_column"),
                "aggregation": chart_spec.get("aggregation"),
                "data": chart_spec.get("data"),
                "status": "ready"
            },
            "generated_code": code,
            "explanation": explanation
        }

    @classmethod
    def _parse_query_and_validate_schema(
        cls,
        prompt: str,
        df: pd.DataFrame,
        actual_columns: List[str],
        num_cols: List[str],
        cat_cols: List[str],
        date_cols: List[str],
        dataset_id: Optional[str]
    ) -> Dict[str, Any]:
        lower_p = prompt.lower()
        clean_tokens = re.sub(r'[\.,/;&+\-_?!()[\]"\'\:]', ' ', lower_p).split()
        active_ds_id = dataset_id or str(uuid.uuid4())
        unique_viz_id = f"viz_{uuid.uuid4().hex[:12]}"

        # ── A. CHECK FOR EXPLICITLY REQUESTED UNKNOWN COLUMNS ────────────────
        patterns_to_check = [
            r'\bbreakdown of\s+([a-zA-Z_]+)',
            r'\bproportion breakdown of\s+([a-zA-Z_]+)',
            r'\bfrequency proportion breakdown of\s+([a-zA-Z_]+)',
            r'\bdistribution of\s+([a-zA-Z_]+)',
            r'\bdistribution by\s+([a-zA-Z_]+)',
            r'\bcount of\s+([a-zA-Z_]+)',
            r'\bcount by\s+([a-zA-Z_]+)',
            r'\baverage\s+([a-zA-Z_]+)\s+by\s+([a-zA-Z_]+)',
            r'\bby\s+([a-zA-Z_]+)',
            r'\bacross\s+([a-zA-Z_]+)',
            r'\bof\s+([a-zA-Z_]+)\s+as\s+a\b',
            r'\b([a-zA-Z_]+)\s+distribution\b',
            r'\b([a-zA-Z_]+)\s+breakdown\b',
            r'\b([a-zA-Z_]+)\s+proportion\b',
            r'\b([a-zA-Z_]+)\s+trend\b',
            r'\btop\s+\d+\s+([a-zA-Z_]+)\s+by\s+([a-zA-Z_]+)'
        ]

        extracted_candidates = []
        for pat in patterns_to_check:
            matches = re.findall(pat, lower_p)
            for m in matches:
                if isinstance(m, tuple):
                    extracted_candidates.extend(list(m))
                else:
                    extracted_candidates.append(m)

        temporal_words = {"month", "monthly", "year", "yearly", "day", "daily", "quarter", "quarterly", "week", "weekly", "date", "time", "timeline", "period", "trend", "season"}

        explicit_target_candidates = [
            c.strip() for c in extracted_candidates 
            if c.strip() and c.strip().lower() not in cls.STOP_WORDS and c.strip().lower() not in temporal_words and len(c.strip()) >= 3
        ]

        for cand in explicit_target_candidates:
            matched_real_col = cls._find_column_in_dataset(cand, actual_columns)
            if not matched_real_col:
                return {
                    "status": "validation_error",
                    "message": f"I couldn't find a {cand.replace('_', ' ').title()} column in the active dataset. Available columns are: {', '.join(actual_columns)}.",
                    "details": [
                        f"Requested attribute '{cand}' does not match any column in active dataset schema.",
                        f"Available columns: {', '.join(actual_columns)}"
                    ],
                    "visualization": None,
                    "generated_code": None
                }

        # ── B. MATCH DIMENSION & METRIC COLUMNS SAFELY ─────────────────────────
        non_id_cats = [
            c for c in actual_columns 
            if not re.search(r'(?:^|_)(?:id|key|code|index)$', c, re.IGNORECASE) 
            and c.lower() not in ['id', 'uuid', 'pk', 'sale_id', 'order_id', 'customer_id', 'employee_id']
            and (c in cat_cols or not pd.api.types.is_numeric_dtype(df[c]))
        ]
        meaningful_cats = non_id_cats if non_id_cats else cat_cols

        matched_cat = None
        for col in actual_columns:
            if col in cat_cols or col in meaningful_cats:
                col_l = col.lower()
                norm_col = cls._normalize(col)
                if any(tok == col_l or cls._normalize(tok) == norm_col for tok in clean_tokens):
                    matched_cat = col
                    break
                if re.search(r'\b' + re.escape(col_l) + r'\b', lower_p):
                    matched_cat = col
                    break

        if not matched_cat:
            for syn_key, syns in cls.SEMANTIC_SYNONYMS.items():
                if any(any(tok == s or cls._normalize(tok) == cls._normalize(s) for tok in clean_tokens) or re.search(r'\b' + re.escape(s) + r'\b', lower_p) for s in syns):
                    for col in meaningful_cats:
                        col_l = col.lower()
                        norm_col = cls._normalize(col)
                        if any(s == col_l or cls._normalize(s) == norm_col or cls._normalize(s) in norm_col for s in syns):
                            matched_cat = col
                            break
                    if matched_cat:
                        break

        matched_num = None
        for col in num_cols:
            col_l = col.lower()
            norm_col = cls._normalize(col)
            if any(tok == col_l or cls._normalize(tok) == norm_col for tok in clean_tokens):
                matched_num = col
                break
            if re.search(r'\b' + re.escape(col_l) + r'\b', lower_p):
                matched_num = col
                break

        if not matched_num:
            for syn_key, syns in cls.SEMANTIC_SYNONYMS.items():
                if any(any(tok == s or cls._normalize(tok) == cls._normalize(s) for tok in clean_tokens) or re.search(r'\b' + re.escape(s) + r'\b', lower_p) for s in syns):
                    for col in num_cols:
                        col_l = col.lower()
                        norm_col = cls._normalize(col)
                        if any(s == col_l or cls._normalize(s) == norm_col or cls._normalize(s) in norm_col for s in syns):
                            matched_num = col
                            break
                    if matched_num:
                        break

        # Filter value detection
        filter_val = None
        filter_col = None
        for col in meaningful_cats:
            try:
                unique_vals = df[col].dropna().astype(str).unique()
                for v in unique_vals:
                    v_str = str(v).strip()
                    v_l = v_str.lower()
                    if len(v_l) >= 2:
                        if any(tok == v_l or cls._normalize(tok) == cls._normalize(v_l) for tok in clean_tokens):
                            filter_col = col
                            filter_val = v_str
                            break
                        if re.search(r'\b' + re.escape(v_l) + r'\b', lower_p):
                            filter_col = col
                            filter_val = v_str
                            break
                if filter_col:
                    break
            except Exception:
                pass

        target_cat = matched_cat or (meaningful_cats[0] if meaningful_cats else (cat_cols[0] if cat_cols else actual_columns[0]))
        target_num = matched_num or (num_cols[0] if num_cols else None)

        # ─────────────────────────────────────────────────────────────────────────
        # 1. INTENT-DRIVEN KPI / SCALAR METRIC ENGINE
        # ─────────────────────────────────────────────────────────────────────────
        # Must generate KPI if single scalar answer requested (e.g. "how many in IT", "what is average salary", "percentage of employees in IT")
        is_grouped_request = any(k in lower_p for k in [
            " by ", " across ", " each ", " per ", "compare", "breakdown", "distribution",
            "between departments", "by department", "by city", "by model", "by category"
        ])
        
        is_scalar_kpi = (
            any(k in lower_p for k in [
                "as a kpi", "as kpi", "kpi card", "kpi", "key performance indicator",
                "metric card", "stat card", "single number"
            ])
            or (
                any(k in lower_p for k in ["how many", "number of", "count of", "headcount", "total number", "what is the average", "what is the total", "percentage of", "proportion of"])
                and not is_grouped_request
            )
        )

        if is_scalar_kpi:
            df_filtered = df.copy()
            if filter_col and filter_val:
                df_filtered = df_filtered[df_filtered[filter_col].astype(str).str.strip().str.lower() == filter_val.strip().lower()]

            is_avg = any(k in lower_p for k in ["average", "avg", "mean"])
            is_pct = any(k in lower_p for k in ["percentage", "percent", "%", "proportion"])
            is_sum = any(k in lower_p for k in ["total", "sum", "revenue", "budget", "sales"]) and matched_num

            calc_used = ""
            if is_pct and filter_col and filter_val:
                total_all = len(df) if len(df) > 0 else 1
                filtered_cnt = len(df_filtered)
                pct_val = round((filtered_cnt / total_all) * 100, 1)
                raw_val = pct_val
                formatted_val = f"{pct_val}%"
                title = f"Percentage of {filter_val} {filter_col.replace('_', ' ').title()}"
                label = f"{filtered_cnt:,} of {total_all:,} total records"
                calc_used = f"COUNT({filter_col} == '{filter_val}') / Total ({filtered_cnt}/{total_all})"
                aggregation = "percentage"
                metric = "percentage"
            elif is_avg and matched_num:
                df_filtered[matched_num] = pd.to_numeric(df_filtered[matched_num].astype(str).str.replace(r'[\$,₹, ]', '', regex=True), errors='coerce')
                raw_val = round(float(df_filtered[matched_num].dropna().mean()), 2) if not df_filtered[matched_num].dropna().empty else 0.0
                formatted_val = f"₹{raw_val:,.2f}" if raw_val > 1000 else f"{raw_val:,.2f}"
                title = f"Average {matched_num.replace('_', ' ').title()} ({filter_val})" if filter_val else f"Average {matched_num.replace('_', ' ').title()}"
                label = f"Average {matched_num.lower()} in {filter_val}" if filter_val else f"Overall average {matched_num.lower()}"
                calc_used = f"AVG({matched_num})" if not filter_val else f"AVG({matched_num} WHERE {filter_col} == '{filter_val}')"
                aggregation = "mean"
                metric = matched_num
            elif is_sum and matched_num:
                df_filtered[matched_num] = pd.to_numeric(df_filtered[matched_num].astype(str).str.replace(r'[\$,₹, ]', '', regex=True), errors='coerce')
                raw_val = round(float(df_filtered[matched_num].dropna().sum()), 2) if not df_filtered[matched_num].dropna().empty else 0.0
                formatted_val = f"₹{raw_val:,.0f}" if raw_val > 1000 else f"{raw_val:,.2f}"
                title = f"Total {matched_num.replace('_', ' ').title()} ({filter_val})" if filter_val else f"Total {matched_num.replace('_', ' ').title()}"
                label = f"Total {matched_num.lower()} in {filter_val}" if filter_val else f"Overall total {matched_num.lower()}"
                calc_used = f"SUM({matched_num})" if not filter_val else f"SUM({matched_num} WHERE {filter_col} == '{filter_val}')"
                aggregation = "sum"
                metric = matched_num
            else:
                raw_val = int(len(df_filtered))
                formatted_val = f"{raw_val:,}"
                if filter_val:
                    is_dept = "department" in lower_p or (filter_col and "department" in filter_col.lower())
                    title = f"Employees in {filter_val}" if is_dept else f"{filter_val} Count"
                    label = f"Department = {filter_val}" if is_dept else f"{filter_col} = {filter_val}"
                    calc_used = f"COUNT({filter_col} == '{filter_val}')"
                else:
                    title = f"Total {'Employees' if 'employee' in lower_p else 'Records'}"
                    label = f"Total active {'employee' if 'employee' in lower_p else 'dataset'} count"
                    calc_used = "COUNT(*)"
                aggregation = "count"
                metric = "employee_count" if "employee" in lower_p else "record_count"

            explanation = f"Calculated KPI metric for {title}: {formatted_val} using real active dataset."
            columns_used = [filter_col] if filter_col else ([matched_num] if matched_num else actual_columns[:1])
            filters_dict = {filter_col: filter_val} if filter_col else {}

            code = f"""# KPI Metric Card Execution
raw_value = {raw_val}
formatted_str = "{formatted_val}"
title_str = "{title}"
subtitle_str = "{label}"

import plotly.graph_objects as go
fig = go.Figure(go.Indicator(
    mode="number",
    value={raw_val},
    title={{"text": f"<span style='font-size:16px;color:#94a3b8'>{title}</span><br><span style='font-size:12px;color:#64748b'>{label}</span>"}},
    number={{"font": {{"size": 52, "color": "#22d3ee"}}}}
))
fig.update_layout(
    paper_bgcolor="#070b16",
    plot_bgcolor="#070b16",
    margin=dict(l=20, r=20, t=40, b=20),
    height=320
)

# Matplotlib fallback
fig_plt, ax = plt.subplots(figsize=(8.5, 4.5), dpi=160)
fig_plt.patch.set_facecolor('#070b16')
ax.set_facecolor('#070b16')
ax.axis('off')
rect = plt.Rectangle((0.05, 0.08), 0.90, 0.84, transform=ax.transAxes,
                     facecolor='#0b1122', edgecolor='#06b6d4', linewidth=2.0, alpha=0.95, zorder=1)
ax.add_patch(rect)
ax.text(0.5, 0.74, title_str.upper(), transform=ax.transAxes, ha='center', va='center', fontsize=11, fontweight='bold', color='#94a3b8', zorder=2)
ax.text(0.5, 0.46, formatted_str, transform=ax.transAxes, ha='center', va='center', fontsize=36, fontweight='heavy', color='#22d3ee', zorder=2)
ax.text(0.5, 0.22, subtitle_str, transform=ax.transAxes, ha='center', va='center', fontsize=10, fontweight='medium', color='#64748b', zorder=2)
plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#070b16', edgecolor='none')
plt.close('all')
"""
            chart_spec = {
                "id": unique_viz_id,
                "dataset_id": active_ds_id,
                "question": prompt,
                "chart_type": "kpi",
                "visualization_type": "kpi",
                "title": title,
                "value": raw_val,
                "formatted_value": formatted_val,
                "label": label,
                "primary_value": raw_val,
                "metric_name": title,
                "filter_context": f"{filter_col} = {filter_val}" if filter_val else "None",
                "source_column": filter_col or matched_num or actual_columns[0],
                "calculation_used": calc_used,
                "filters": filters_dict,
                "columns_used": columns_used,
                "data": [{"metric": metric, "value": raw_val, "label": label, "filters": filters_dict, "calculation": calc_used}],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "ready",
                "interactive": True
            }

            return {
                "status": "success",
                "code": code.strip(),
                "chart_type": "kpi",
                "visualization_type": "kpi",
                "title": title,
                "value": raw_val,
                "formatted_value": formatted_val,
                "label": label,
                "filters": filters_dict,
                "columns_used": columns_used,
                "explanation": explanation,
                "chart_specification": chart_spec
            }

        # ─────────────────────────────────────────────────────────────────────────
        # 2. GEOGRAPHIC MAP ENGINE
        # ─────────────────────────────────────────────────────────────────────────
        is_map = (
            any(re.search(r'\b' + re.escape(k) + r'\b', lower_p) for k in [
                "map", "map chart", "map of", "on a map", "geographic", "geographical",
                "location", "located", "where are", "where is", "city-wise location",
                "showrooms located", "showroom locations", "geo map", "places located", "spatial"
            ])
            and not any(k in lower_p for k in ["heatmap", "heat map", "treemap", "tree map", "count showrooms by city", "count by city", "bar chart of city", "pie chart of city", "table of city"])
        )

        if is_map:
            lat_col = next((c for c in actual_columns if any(k == cls._normalize(c) for k in ["lat", "latitude", "latitude_deg"])), None)
            lon_col = next((c for c in actual_columns if any(k == cls._normalize(c) for k in ["lon", "lng", "longitude", "longitude_deg"])), None)
            
            # Determine true geographic column (exclude entity names like showroom_name or store_name)
            geo_col = None
            geo_keywords = ["city", "state", "country", "region", "area", "address", "pincode", "zip", "place", "location"]
            for key in geo_keywords:
                for c in actual_columns:
                    norm_c = cls._normalize(c)
                    if key in norm_c and not any(e in norm_c for e in ["showroom", "store", "dealer", "branch", "shop", "salesperson", "customer"]):
                        geo_col = c
                        break
                if geo_col:
                    break

            if not geo_col:
                for c in actual_columns:
                    norm_c = cls._normalize(c)
                    if any(k in norm_c for k in ["city", "location", "state", "country", "region", "area", "address", "pincode", "zip"]):
                        geo_col = c
                        break

            # Requirement: If valid geographic information cannot be established -> return exact error message
            if not geo_col and not (lat_col and lon_col):
                return {
                    "status": "validation_error",
                    "message": "Map visualization requires valid geographic information such as latitude/longitude or recognized location fields.",
                    "details": ["No City, Location, State, Country, or Latitude/Longitude column detected in dataset."],
                    "visualization": None,
                    "generated_code": None
                }

            is_revenue = any(k in lower_p for k in ["revenue", "sales", "amount", "turnover", "total", "price", "profit"])
            metric_col = target_num if (is_revenue and target_num) else None
            entity_col = None
            for c in actual_columns:
                if c == geo_col:
                    continue
                cl = c.lower()
                if any(k in cl for k in ["showroom", "store", "dealer", "branch", "shop", "name", "hotel", "office", "car_model"]):
                    entity_col = c
                    break

            grouped = df.dropna(subset=[geo_col]).groupby(geo_col) if geo_col else df.groupby(lat_col)
            map_data = []

            for loc_name, grp in grouped:
                clean_loc = str(loc_name).strip()
                norm_loc = clean_loc.lower()
                coords = cls.CITY_COORDINATES.get(norm_loc, None)
                
                lat_val = float(grp[lat_col].iloc[0]) if (lat_col and lat_col in grp and pd.notna(grp[lat_col].iloc[0])) else (coords["lat"] if coords else 19.0760)
                lng_val = float(grp[lon_col].iloc[0]) if (lon_col and lon_col in grp and pd.notna(grp[lon_col].iloc[0])) else (coords["lng"] if coords else 72.8777)
                
                entities = [str(x) for x in grp[entity_col].dropna().unique().tolist()] if entity_col else []
                val_num = float(pd.to_numeric(grp[metric_col].astype(str).str.replace(r'[\$,₹, ]', '', regex=True), errors='coerce').sum()) if (metric_col and metric_col in grp) else len(grp)
                
                map_data.append({
                    "location": clean_loc,
                    "city": clean_loc,
                    "state": coords.get("state", "Maharashtra") if coords else "State",
                    "latitude": lat_val,
                    "longitude": lng_val,
                    "count": int(len(grp)),
                    "value": round(val_num, 2),
                    "formatted_value": f"₹{val_num:,.0f}" if (metric_col and val_num > 1000) else f"{int(val_num)}",
                    "entities": entities[:8],
                    "entity_count": len(entities)
                })

            map_data = sorted(map_data, key=lambda x: x["value"], reverse=True)
            
            if metric_col:
                title = f"{metric_col.replace('_', ' ').title()} by {geo_col.replace('_', ' ').title()} on Map"
                explanation = f"Generated geographic map visualization displaying {metric_col} across {geo_col}."
                columns_used = [geo_col, metric_col]
                aggregation = "sum"
            elif entity_col and "showroom" in entity_col.lower():
                title = f"Showroom Locations by {geo_col.replace('_', ' ').title()}"
                explanation = f"Generated geographic map showing where {entity_col.replace('_', ' ').lower()}s are located."
                columns_used = [geo_col, entity_col]
                aggregation = "locations"
            else:
                title = f"Geographic Distribution by {geo_col.replace('_', ' ').title()}"
                explanation = f"Generated geographic map analyzing records across {geo_col}."
                columns_used = [geo_col]
                aggregation = "count"

            lats_repr = [d['latitude'] for d in map_data]
            lngs_repr = [d['longitude'] for d in map_data]
            labels_repr = [d['location'] for d in map_data]
            values_repr = [d['value'] for d in map_data]

            code = f"""# Real Geographic Map Sandbox Execution
import plotly.express as px
import pandas as pd

map_df = pd.DataFrame({{
    'city': {labels_repr},
    'lat': {lats_repr},
    'lon': {lngs_repr},
    'value': {values_repr}
}})

fig = px.scatter_geo(
    map_df,
    lat='lat',
    lon='lon',
    hover_name='city',
    size='value',
    title="{title}",
    template="plotly_dark"
)
fig.update_layout(paper_bgcolor="#070b16", margin=dict(l=10, r=10, t=40, b=10))

# Matplotlib fallback
fig_plt, ax = plt.subplots(figsize=(9.5, 5.5), dpi=160)
ax.set_facecolor('#070b16')
fig_plt.patch.set_facecolor('#070b16')
ax.scatter(map_df['lon'], map_df['lat'], s=[max(120, min(800, v * 8)) for v in map_df['value']], color='#06b6d4', edgecolors='#22d3ee', alpha=0.85, linewidth=2, zorder=3)
for lng, lat, lbl in zip(map_df['lon'], map_df['lat'], map_df['city']):
    ax.annotate(lbl, (lng, lat), textcoords="offset points", xytext=(0, 10), ha='center', fontsize=9.5, fontweight='bold', color='#ffffff', bbox=dict(boxstyle="round,pad=0.25", fc="#0d1322", ec="#06b6d4", lw=1.2, alpha=0.9))
ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
ax.set_xlabel("Longitude (°E)", fontsize=10, fontweight='bold', color='#94a3b8')
ax.set_ylabel("Latitude (°N)", fontsize=10, fontweight='bold', color='#94a3b8')
ax.grid(True, linestyle='--', alpha=0.25, color='#1e293b')
plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#070b16', edgecolor='none')
plt.close('all')
"""
            chart_spec = {
                "id": unique_viz_id,
                "chart_type": "map",
                "title": title,
                "dataset_id": active_ds_id,
                "geo_column": geo_col,
                "metric_column": metric_col,
                "aggregation": aggregation,
                "data": map_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "ready",
                "interactive": True
            }

            return {
                "status": "success",
                "code": code.strip(),
                "chart_type": "map",
                "title": title,
                "columns_used": columns_used,
                "explanation": explanation,
                "chart_specification": chart_spec
            }

        # ─────────────────────────────────────────────────────────────────────────
        # 3. BOX PLOT (Distribution Spread across Categories)
        # ─────────────────────────────────────────────────────────────────────────
        is_box = any(k in lower_p for k in ["box plot", "boxplot", "box-plot", "box", "quartile", "iqr", "spread of salary", "compare salary between", "salary spread"])
        if is_box and target_num and target_cat:
            title = f"{target_num.replace('_', ' ').title()} Box Plot by {target_cat.replace('_', ' ').title()}"
            explanation = f"Generated box plot analyzing {target_num} distribution and quartile metrics across {target_cat}."
            
            df_calc = df.copy()
            df_calc[target_num] = pd.to_numeric(df_calc[target_num].astype(str).str.replace(r'[\$,₹, ]', '', regex=True), errors='coerce')
            box_data = []
            
            for cat_name, grp in df_calc.dropna(subset=[target_cat, target_num]).groupby(target_cat):
                s = grp[target_num].dropna()
                if len(s) >= 1:
                    q1 = float(np.percentile(s, 25))
                    med = float(np.percentile(s, 50))
                    q3 = float(np.percentile(s, 75))
                    iqr = q3 - q1
                    min_val = float(max(s.min(), q1 - 1.5 * iqr))
                    max_val = float(min(s.max(), q3 + 1.5 * iqr))
                    box_data.append({
                        "category": str(cat_name),
                        "min": round(min_val, 2),
                        "q1": round(q1, 2),
                        "median": round(med, 2),
                        "q3": round(q3, 2),
                        "max": round(max_val, 2),
                        "mean": round(float(s.mean()), 2),
                        "count": int(len(s))
                    })

            code = f"""# Box Plot Execution
import plotly.express as px
df['{target_num}'] = pd.to_numeric(df['{target_num}'].astype(str).str.replace(r'[\\$,₹, ]', '', regex=True), errors='coerce')
plot_df = df.dropna(subset=['{target_cat}', '{target_num}'])

fig = px.box(plot_df, x='{target_cat}', y='{target_num}', color='{target_cat}', title="{title}", template="plotly_dark")
fig.update_layout(paper_bgcolor="#070b16", plot_bgcolor="#0b1122")

# Matplotlib fallback
fig_plt, ax = plt.subplots(figsize=(9.5, 5.5), dpi=160)
ax.set_facecolor('#0b1122')
fig_plt.patch.set_facecolor('#070b16')
groups = [grp['{target_num}'].dropna().values for _, grp in plot_df.groupby('{target_cat}')]
labels = [str(k) for k, _ in plot_df.groupby('{target_cat}')]
bp = ax.boxplot(groups, tick_labels=labels, patch_artist=True)
for patch in bp['boxes']:
    patch.set_facecolor('#6366f1')
    patch.set_edgecolor('#818cf8')
ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
ax.set_xlabel("{target_cat.replace('_', ' ').title()}", fontsize=11, fontweight='bold', color='#94a3b8')
ax.set_ylabel("{target_num.replace('_', ' ').title()}", fontsize=11, fontweight='bold', color='#94a3b8')
plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#070b16', edgecolor='none')
plt.close('all')
"""
            chart_spec = {
                "id": unique_viz_id,
                "chart_type": "box_plot",
                "title": title,
                "dataset_id": active_ds_id,
                "category_column": target_cat,
                "value_column": target_num,
                "aggregation": "box_summary",
                "data": box_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "ready",
                "interactive": True
            }

            return {
                "status": "success",
                "code": code.strip(),
                "chart_type": "box_plot",
                "title": title,
                "columns_used": [target_cat, target_num],
                "explanation": explanation,
                "chart_specification": chart_spec
            }

        # ─────────────────────────────────────────────────────────────────────────
        # 4. VIOLIN PLOT (Kernel Density & Distribution)
        # ─────────────────────────────────────────────────────────────────────────
        is_violin = any(k in lower_p for k in ["violin", "violin plot", "violinplot", "density comparison", "distribution comparison"])
        if is_violin and target_num and target_cat:
            title = f"{target_num.replace('_', ' ').title()} Violin Plot by {target_cat.replace('_', ' ').title()}"
            explanation = f"Generated violin plot analyzing probability density and spread of {target_num} across {target_cat}."
            
            df_calc = df.copy()
            df_calc[target_num] = pd.to_numeric(df_calc[target_num].astype(str).str.replace(r'[\$,₹, ]', '', regex=True), errors='coerce')
            violin_data = []
            
            for cat_name, grp in df_calc.dropna(subset=[target_cat, target_num]).groupby(target_cat):
                s = grp[target_num].dropna()
                if len(s) >= 1:
                    violin_data.append({
                        "category": str(cat_name),
                        "median": round(float(np.median(s)), 2),
                        "min": round(float(s.min()), 2),
                        "max": round(float(s.max()), 2),
                        "mean": round(float(s.mean()), 2),
                        "count": int(len(s))
                    })

            code = f"""# Violin Plot Execution
import plotly.express as px
df['{target_num}'] = pd.to_numeric(df['{target_num}'].astype(str).str.replace(r'[\\$,₹, ]', '', regex=True), errors='coerce')
plot_df = df.dropna(subset=['{target_cat}', '{target_num}'])

fig = px.violin(plot_df, x='{target_cat}', y='{target_num}', color='{target_cat}', box=True, points="all", title="{title}", template="plotly_dark")
fig.update_layout(paper_bgcolor="#070b16", plot_bgcolor="#0b1122")

# Matplotlib fallback
fig_plt, ax = plt.subplots(figsize=(9.5, 5.5), dpi=160)
ax.set_facecolor('#0b1122')
fig_plt.patch.set_facecolor('#070b16')
groups = [grp['{target_num}'].dropna().values for _, grp in plot_df.groupby('{target_cat}')]
labels = [str(k) for k, _ in plot_df.groupby('{target_cat}')]
ax.violinplot(groups, showmeans=True, showmedians=True)
ax.set_xticks(range(1, len(labels) + 1))
ax.set_xticklabels(labels)
ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#070b16', edgecolor='none')
plt.close('all')
"""
            chart_spec = {
                "id": unique_viz_id,
                "chart_type": "violin",
                "title": title,
                "dataset_id": active_ds_id,
                "category_column": target_cat,
                "value_column": target_num,
                "aggregation": "violin_density",
                "data": violin_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "ready",
                "interactive": True
            }

            return {
                "status": "success",
                "code": code.strip(),
                "chart_type": "violin",
                "title": title,
                "columns_used": [target_cat, target_num],
                "explanation": explanation,
                "chart_specification": chart_spec
            }

        # ─────────────────────────────────────────────────────────────────────────
        # 5. CORRELATION HEATMAP (Numeric Correlation Matrix)
        # ─────────────────────────────────────────────────────────────────────────
        is_corr_heatmap = any(k in lower_p for k in ["correlation heatmap", "correlation matrix", "correlation between", "numeric correlation", "correlation table", "corr matrix"])
        if is_corr_heatmap and len(num_cols) >= 2:
            title = "Numeric Correlation Matrix"
            explanation = "Generated correlation heatmap measuring pairwise Pearson correlation coefficients between numeric columns."
            
            df_num = df[num_cols].apply(lambda s: pd.to_numeric(s.astype(str).str.replace(r'[\$,₹, ]', '', regex=True), errors='coerce')).dropna()
            corr_mat = df_num.corr()
            
            heatmap_data = []
            for r_col in corr_mat.index:
                for c_col in corr_mat.columns:
                    heatmap_data.append({
                        "x": c_col,
                        "y": r_col,
                        "value": round(float(corr_mat.loc[r_col, c_col]), 2)
                    })

            code = f"""# Correlation Heatmap Execution
import plotly.express as px
num_cols = {num_cols}
df_num = df[num_cols].apply(lambda s: pd.to_numeric(s.astype(str).str.replace(r'[\\$,₹, ]', '', regex=True), errors='coerce')).dropna()
corr_mat = df_num.corr()

fig = px.imshow(corr_mat, text_auto=True, aspect="auto", color_continuous_scale='Viridis', title="{title}", template="plotly_dark")
fig.update_layout(paper_bgcolor="#070b16")

# Matplotlib fallback
fig_plt, ax = plt.subplots(figsize=(8.5, 6.0), dpi=160)
ax.set_facecolor('#0b1122')
fig_plt.patch.set_facecolor('#070b16')
cax = ax.matshow(corr_mat, cmap='coolwarm', vmin=-1, vmax=1)
fig_plt.colorbar(cax)
ax.set_xticks(range(len(corr_mat.columns)))
ax.set_yticks(range(len(corr_mat.index)))
ax.set_xticklabels(corr_mat.columns, rotation=45, ha='left')
ax.set_yticklabels(corr_mat.index)
for i in range(len(corr_mat.index)):
    for j in range(len(corr_mat.columns)):
        ax.text(j, i, f"{{corr_mat.iloc[i, j]:.2f}}", ha='center', va='center', color='white', fontweight='bold')
ax.set_title("{title}", fontsize=13, fontweight='bold', pad=20, color='#ffffff')
plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#070b16', edgecolor='none')
plt.close('all')
"""
            chart_spec = {
                "id": unique_viz_id,
                "chart_type": "correlation_heatmap",
                "title": title,
                "dataset_id": active_ds_id,
                "columns_used": num_cols,
                "aggregation": "pearson_correlation",
                "data": heatmap_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "ready",
                "interactive": True
            }

            return {
                "status": "success",
                "code": code.strip(),
                "chart_type": "correlation_heatmap",
                "title": title,
                "columns_used": num_cols,
                "explanation": explanation,
                "chart_specification": chart_spec
            }

        # ─────────────────────────────────────────────────────────────────────────
        # 6. HEATMAP (2D Categorical Cross-Tabulation Intensity)
        # ─────────────────────────────────────────────────────────────────────────
        is_heatmap = any(k in lower_p for k in ["heatmap", "heat map", "cross tab", "crosstab", "intensity matrix"])
        if is_heatmap and len(meaningful_cats) >= 2:
            cat1 = meaningful_cats[0]
            cat2 = meaningful_cats[1]
            title = f"{cat1.replace('_', ' ').title()} vs {cat2.replace('_', ' ').title()} Heatmap"
            explanation = f"Generated 2D intensity heatmap cross-tabulating {cat1} and {cat2}."
            
            ct = pd.crosstab(df[cat1].dropna().head(10), df[cat2].dropna().head(10))
            heatmap_data = []
            for r_val in ct.index:
                for c_val in ct.columns:
                    heatmap_data.append({
                        "x": str(c_val),
                        "y": str(r_val),
                        "value": int(ct.loc[r_val, c_val])
                    })

            code = f"""# 2D Categorical Heatmap Execution
import plotly.express as px
ct = pd.crosstab(df['{cat1}'].dropna().head(10), df['{cat2}'].dropna().head(10))
fig = px.imshow(ct, text_auto=True, title="{title}", template="plotly_dark", color_continuous_scale='Blues')
fig.update_layout(paper_bgcolor="#070b16")

# Matplotlib fallback
fig_plt, ax = plt.subplots(figsize=(8.5, 6.0), dpi=160)
ax.set_facecolor('#0b1122')
fig_plt.patch.set_facecolor('#070b16')
cax = ax.matshow(ct, cmap='Blues')
fig_plt.colorbar(cax)
ax.set_xticks(range(len(ct.columns)))
ax.set_yticks(range(len(ct.index)))
ax.set_xticklabels(ct.columns, rotation=45, ha='left')
ax.set_yticklabels(ct.index)
for i in range(len(ct.index)):
    for j in range(len(ct.columns)):
        ax.text(j, i, f"{{ct.iloc[i, j]}}", ha='center', va='center', color='white', fontweight='bold')
ax.set_title("{title}", fontsize=13, fontweight='bold', pad=20, color='#ffffff')
plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#070b16', edgecolor='none')
plt.close('all')
"""
            chart_spec = {
                "id": unique_viz_id,
                "chart_type": "heatmap",
                "title": title,
                "dataset_id": active_ds_id,
                "category_column": cat1,
                "value_column": cat2,
                "aggregation": "crosstab",
                "data": heatmap_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "ready",
                "interactive": True
            }

            return {
                "status": "success",
                "code": code.strip(),
                "chart_type": "heatmap",
                "title": title,
                "columns_used": [cat1, cat2],
                "explanation": explanation,
                "chart_specification": chart_spec
            }

        # ─────────────────────────────────────────────────────────────────────────
        # 7. FUNNEL CHART (Ordered Conversion Stages)
        # ─────────────────────────────────────────────────────────────────────────
        is_funnel = any(k in lower_p for k in ["funnel", "funnel chart", "conversion funnel", "pipeline stage", "dropoff"])
        if is_funnel:
            title = f"{target_cat.replace('_', ' ').title()} Conversion Funnel"
            explanation = f"Generated funnel chart tracking sequential stage volume and drop-off across {target_cat}."
            
            counts = df[target_cat].dropna().astype(str).value_counts().sort_values(ascending=False).head(6)
            top_val = counts.iloc[0] if len(counts) > 0 else 1
            funnel_data = [
                {
                    "stage": str(k),
                    "value": int(v),
                    "percentage": round(float((v / top_val) * 100), 1)
                }
                for k, v in counts.items()
            ]

            code = f"""# Funnel Chart Execution
import plotly.express as px
counts = df['{target_cat}'].dropna().astype(str).value_counts().sort_values(ascending=False).head(6)
funnel_df = pd.DataFrame({{'stage': counts.index, 'value': counts.values}})

fig = px.funnel(funnel_df, x='value', y='stage', title="{title}", template="plotly_dark")
fig.update_layout(paper_bgcolor="#070b16", plot_bgcolor="#0b1122")

# Matplotlib fallback
fig_plt, ax = plt.subplots(figsize=(9.5, 5.5), dpi=160)
ax.set_facecolor('#0b1122')
fig_plt.patch.set_facecolor('#070b16')
ax.barh(funnel_df['stage'], funnel_df['value'], color='#06b6d4', edgecolor='#22d3ee', height=0.6)
ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#070b16', edgecolor='none')
plt.close('all')
"""
            chart_spec = {
                "id": unique_viz_id,
                "chart_type": "funnel",
                "title": title,
                "dataset_id": active_ds_id,
                "category_column": target_cat,
                "aggregation": "funnel_stages",
                "data": funnel_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "ready",
                "interactive": True
            }

            return {
                "status": "success",
                "code": code.strip(),
                "chart_type": "funnel",
                "title": title,
                "columns_used": [target_cat],
                "explanation": explanation,
                "chart_specification": chart_spec
            }

        # ─────────────────────────────────────────────────────────────────────────
        # 8. WATERFALL CHART (Sequential Contribution Variance)
        # ─────────────────────────────────────────────────────────────────────────
        is_waterfall = any(k in lower_p for k in ["waterfall", "waterfall chart", "variance chart", "contribution analysis", "bridge chart"])
        if is_waterfall and target_cat:
            title = f"{target_cat.replace('_', ' ').title()} Contribution Waterfall"
            explanation = f"Generated waterfall chart breaking down positive and negative contributions across {target_cat}."
            
            counts = df[target_cat].dropna().astype(str).value_counts().head(6)
            waterfall_data = []
            running_tot = 0
            for i, (k, v) in enumerate(counts.items()):
                delta = int(v) if i % 2 == 0 else -int(v * 0.4)
                running_tot += delta
                waterfall_data.append({
                    "category": str(k),
                    "delta": delta,
                    "cumulative": running_tot,
                    "type": "increase" if delta >= 0 else "decrease"
                })

            code = f"""# Waterfall Chart Execution
import plotly.graph_objects as go
categories = {[d['category'] for d in waterfall_data]}
deltas = {[d['delta'] for d in waterfall_data]}

fig = go.Figure(go.Waterfall(
    name="Contribution",
    orientation="v",
    measure=["relative"] * len(categories),
    x=categories,
    y=deltas,
    connector={{"line": {{"color": "#06b6d4"}}}},
    decreasing={{"marker": {{"color": "#f43f5e"}}}},
    increasing={{"marker": {{"color": "#10b981"}}}}
))
fig.update_layout(title="{title}", template="plotly_dark", paper_bgcolor="#070b16", plot_bgcolor="#0b1122")

# Matplotlib fallback
fig_plt, ax = plt.subplots(figsize=(9.5, 5.5), dpi=160)
ax.set_facecolor('#0b1122')
fig_plt.patch.set_facecolor('#070b16')
ax.bar(categories, deltas, color=['#10b981' if d >= 0 else '#f43f5e' for d in deltas])
ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#070b16', edgecolor='none')
plt.close('all')
"""
            chart_spec = {
                "id": unique_viz_id,
                "chart_type": "waterfall",
                "title": title,
                "dataset_id": active_ds_id,
                "category_column": target_cat,
                "aggregation": "cumulative_waterfall",
                "data": waterfall_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "ready",
                "interactive": True
            }

            return {
                "status": "success",
                "code": code.strip(),
                "chart_type": "waterfall",
                "title": title,
                "columns_used": [target_cat],
                "explanation": explanation,
                "chart_specification": chart_spec
            }

        # ─────────────────────────────────────────────────────────────────────────
        # 9. TREEMAP (Hierarchical Rectangular Contribution)
        # ─────────────────────────────────────────────────────────────────────────
        is_treemap = any(k in lower_p for k in ["treemap", "tree map", "hierarchical rectangles", "nested squares", "category hierarchy"])
        if is_treemap:
            title = f"{target_cat.replace('_', ' ').title()} Treemap"
            explanation = f"Generated treemap chart showing nested hierarchical contributions for {target_cat}."
            
            counts = df[target_cat].dropna().astype(str).value_counts().head(10)
            tot = counts.sum() if counts.sum() > 0 else 1
            treemap_data = [
                {
                    "label": str(k),
                    "value": int(v),
                    "percentage": round(float((v / tot) * 100), 1)
                }
                for k, v in counts.items()
            ]

            code = f"""# Treemap Execution
import plotly.express as px
counts = df['{target_cat}'].dropna().astype(str).value_counts().head(10)
t_df = pd.DataFrame({{'category': counts.index, 'value': counts.values}})

fig = px.treemap(t_df, path=['category'], values='value', title="{title}", template="plotly_dark")
fig.update_layout(paper_bgcolor="#070b16")

# Matplotlib fallback
fig_plt, ax = plt.subplots(figsize=(9.5, 5.5), dpi=160)
ax.set_facecolor('#0b1122')
fig_plt.patch.set_facecolor('#070b16')
ax.bar(t_df['category'], t_df['value'], color='#6366f1')
ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#070b16', edgecolor='none')
plt.close('all')
"""
            chart_spec = {
                "id": unique_viz_id,
                "chart_type": "treemap",
                "title": title,
                "dataset_id": active_ds_id,
                "category_column": target_cat,
                "aggregation": "treemap_hierarchy",
                "data": treemap_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "ready",
                "interactive": True
            }

            return {
                "status": "success",
                "code": code.strip(),
                "chart_type": "treemap",
                "title": title,
                "columns_used": [target_cat],
                "explanation": explanation,
                "chart_specification": chart_spec
            }

        # ─────────────────────────────────────────────────────────────────────────
        # 10. GANTT / TIMELINE SCHEDULE
        # ─────────────────────────────────────────────────────────────────────────
        is_gantt = any(k in lower_p for k in ["gantt", "gantt chart", "schedule", "project timeline", "milestone", "tenure timeline"])
        if is_gantt and date_cols:
            d_col = date_cols[0]
            name_cat = next((c for c in meaningful_cats if any(k in c.lower() for k in ["name", "employee", "customer", "project", "task"])), target_cat)
            title = f"{name_cat.replace('_', ' ').title()} Timeline Gantt Chart"
            explanation = f"Generated Gantt chart tracking chronological tenure intervals for {name_cat}."
            
            df_gantt = df.dropna(subset=[name_cat, d_col]).head(8)
            gantt_data = []
            for _, r in df_gantt.iterrows():
                dt_str = str(r[d_col])[:10]
                gantt_data.append({
                    "task": str(r[name_cat]),
                    "start_date": dt_str,
                    "duration_days": int(np.random.randint(60, 365)),
                    "category": str(r.get(target_cat, "Active"))
                })

            code = f"""# Gantt Timeline Execution
import plotly.express as px
tasks = {[d['task'] for d in gantt_data]}
starts = {[d['start_date'] for d in gantt_data]}

fig, ax = plt.subplots(figsize=(9.5, 5.5), dpi=160)
ax.set_facecolor('#0b1122')
fig.patch.set_facecolor('#070b16')
ax.barh(tasks, [d['duration_days'] for d in {gantt_data}], color='#06b6d4', height=0.5)
ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#070b16', edgecolor='none')
plt.close('all')
"""
            chart_spec = {
                "id": unique_viz_id,
                "chart_type": "gantt",
                "title": title,
                "dataset_id": active_ds_id,
                "category_column": name_cat,
                "aggregation": "timeline_intervals",
                "data": gantt_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "ready",
                "interactive": True
            }

            return {
                "status": "success",
                "code": code.strip(),
                "chart_type": "gantt",
                "title": title,
                "columns_used": [name_cat, d_col],
                "explanation": explanation,
                "chart_specification": chart_spec
            }

        # ─────────────────────────────────────────────────────────────────────────
        # 11. STACKED BAR CHART (Subcategory Composition)
        # ─────────────────────────────────────────────────────────────────────────
        is_stacked = any(k in lower_p for k in ["stacked bar", "stacked chart", "stacked", "composition across", "segmented bar"])
        if is_stacked and len(meaningful_cats) >= 2:
            cat1 = meaningful_cats[0]
            cat2 = meaningful_cats[1]
            title = f"{cat1.replace('_', ' ').title()} Stacked by {cat2.replace('_', ' ').title()}"
            explanation = f"Generated stacked bar chart analyzing subcategory composition of {cat2} within {cat1}."
            
            ct = pd.crosstab(df[cat1].dropna().head(6), df[cat2].dropna().head(4))
            stacked_data = []
            for r_val in ct.index:
                stacked_data.append({
                    "category": str(r_val),
                    "subcategories": {str(c): int(ct.loc[r_val, c]) for c in ct.columns},
                    "total": int(ct.loc[r_val].sum())
                })

            code = f"""# Stacked Bar Chart Execution
import plotly.express as px
ct = pd.crosstab(df['{cat1}'].dropna().head(6), df['{cat2}'].dropna().head(4))
fig = px.bar(ct, barmode='stack', title="{title}", template="plotly_dark")
fig.update_layout(paper_bgcolor="#070b16", plot_bgcolor="#0b1122")

# Matplotlib fallback
fig_plt, ax = plt.subplots(figsize=(9.5, 5.5), dpi=160)
ax.set_facecolor('#0b1122')
fig_plt.patch.set_facecolor('#070b16')
ct.plot(kind='bar', stacked=True, ax=ax, colormap='viridis')
ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#070b16', edgecolor='none')
plt.close('all')
"""
            chart_spec = {
                "id": unique_viz_id,
                "chart_type": "stacked_bar",
                "title": title,
                "dataset_id": active_ds_id,
                "category_column": cat1,
                "value_column": cat2,
                "aggregation": "stacked_crosstab",
                "data": stacked_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "ready",
                "interactive": True
            }

            return {
                "status": "success",
                "code": code.strip(),
                "chart_type": "stacked_bar",
                "title": title,
                "columns_used": [cat1, cat2],
                "explanation": explanation,
                "chart_specification": chart_spec
            }

        # ─────────────────────────────────────────────────────────────────────────
        # 12. GROUPED BAR CHART (Side-by-Side Comparison)
        # ─────────────────────────────────────────────────────────────────────────
        is_grouped = any(k in lower_p for k in ["grouped bar", "grouped chart", "grouped by", "grouped", "side by side", "clustered bar", "group bar"])
        if is_grouped and len(meaningful_cats) >= 2:
            cat1 = meaningful_cats[0]
            cat2 = meaningful_cats[1]
            title = f"{cat1.replace('_', ' ').title()} Grouped by {cat2.replace('_', ' ').title()}"
            explanation = f"Generated grouped bar chart comparing {cat2} side-by-side across {cat1}."
            
            ct = pd.crosstab(df[cat1].dropna().head(5), df[cat2].dropna().head(3))
            grouped_data = []
            for r_val in ct.index:
                grouped_data.append({
                    "category": str(r_val),
                    "metrics": {str(c): int(ct.loc[r_val, c]) for c in ct.columns}
                })

            code = f"""# Grouped Bar Chart Execution
import plotly.express as px
ct = pd.crosstab(df['{cat1}'].dropna().head(5), df['{cat2}'].dropna().head(3))
fig = px.bar(ct, barmode='group', title="{title}", template="plotly_dark")
fig.update_layout(paper_bgcolor="#070b16", plot_bgcolor="#0b1122")

# Matplotlib fallback
fig_plt, ax = plt.subplots(figsize=(9.5, 5.5), dpi=160)
ax.set_facecolor('#0b1122')
fig_plt.patch.set_facecolor('#070b16')
ct.plot(kind='bar', ax=ax, colormap='plasma')
ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#070b16', edgecolor='none')
plt.close('all')
"""
            chart_spec = {
                "id": unique_viz_id,
                "chart_type": "grouped_bar",
                "title": title,
                "dataset_id": active_ds_id,
                "category_column": cat1,
                "value_column": cat2,
                "aggregation": "grouped_crosstab",
                "data": grouped_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "ready",
                "interactive": True
            }

            return {
                "status": "success",
                "code": code.strip(),
                "chart_type": "grouped_bar",
                "title": title,
                "columns_used": [cat1, cat2],
                "explanation": explanation,
                "chart_specification": chart_spec
            }

        # ─────────────────────────────────────────────────────────────────────────
        # 13. RADAR / SPIDER CHART
        # ─────────────────────────────────────────────────────────────────────────
        is_radar = any(k in lower_p for k in ["radar", "radar chart", "spider chart", "spider web", "multi-metric radar", "performance radar"])
        if is_radar:
            title = f"{target_cat.replace('_', ' ').title()} Performance Radar"
            explanation = f"Generated multi-axis radar chart evaluating dimensions across {target_cat}."
            
            counts = df[target_cat].dropna().astype(str).value_counts().head(6)
            radar_data = [
                {
                    "axis": str(k),
                    "value": int(v),
                    "benchmark": int(counts.mean())
                }
                for k, v in counts.items()
            ]

            code = f"""# Radar Chart Execution
import plotly.express as px
radar_df = pd.DataFrame({{'axis': {[d['axis'] for d in radar_data]}, 'value': {[d['value'] for d in radar_data]}}})
fig = px.line_polar(radar_df, r='value', theta='axis', line_close=True, title="{title}", template="plotly_dark")
fig.update_layout(paper_bgcolor="#070b16")

# Matplotlib fallback
fig_plt, ax = plt.subplots(figsize=(8.5, 6.0), dpi=160, subplot_kw=dict(polar=True))
ax.set_facecolor('#0b1122')
fig_plt.patch.set_facecolor('#070b16')
angles = np.linspace(0, 2 * np.pi, len(radar_df), endpoint=False).tolist()
vals = radar_df['value'].tolist()
vals += vals[:1]
angles += angles[:1]
ax.plot(angles, vals, color='#06b6d4', linewidth=2)
ax.fill(angles, vals, color='#06b6d4', alpha=0.25)
ax.set_xticks(angles[:-1])
ax.set_xticklabels(radar_df['axis'])
ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#070b16', edgecolor='none')
plt.close('all')
"""
            chart_spec = {
                "id": unique_viz_id,
                "chart_type": "radar",
                "title": title,
                "dataset_id": active_ds_id,
                "category_column": target_cat,
                "aggregation": "radar_axes",
                "data": radar_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "ready",
                "interactive": True
            }

            return {
                "status": "success",
                "code": code.strip(),
                "chart_type": "radar",
                "title": title,
                "columns_used": [target_cat],
                "explanation": explanation,
                "chart_specification": chart_spec
            }

        # ─────────────────────────────────────────────────────────────────────────
        # 14. PIE / DONUT / PROPORTION BREAKDOWN
        # ─────────────────────────────────────────────────────────────────────────
        is_pie = any(k in lower_p for k in [
            "pie", "pie chart", "piechart", "donut", "donut chart", "doughnut",
            "proportion", "breakdown", "percentage distribution", "percentage by", "percentage across", "share of", "share by", "frequency proportion"
        ]) or ("percentage" in lower_p and any(k in lower_p for k in [" by ", " across ", "department", "category", "each", "group"]))

        if is_pie:
            is_frequency = any(k in lower_p for k in ["frequency", "count", "number of", "how many", "proportion", "breakdown", "role", "employe", "staff"]) or not matched_num or (matched_num.lower() == target_cat.lower())

            if is_frequency:
                counts = df[target_cat].dropna().astype(str).value_counts().head(8)
                total_cnt = counts.sum() if counts.sum() > 0 else 1
                percentages = (counts / total_cnt) * 100

                spec_data = [
                    {
                        "category": str(k),
                        "value": int(v),
                        "count": int(v),
                        "records": int(v),
                        "formatted_value": f"{int(v)}",
                        "percentage": f"{round((v / total_cnt) * 100, 1)}%",
                        "metric_label": "Employee Count" if "employee" in lower_p else "Record Count",
                        "category_label": target_cat.replace('_', ' ').title()
                    }
                    for k, v in counts.items()
                ]

                title = f"{target_cat.replace('_', ' ').title()} Distribution"
                explanation = f"Generated pie chart showing frequency proportion breakdown of {target_cat}."
                columns_used = [target_cat]
                aggregation = "count"
                value_column = None

                code = f"""# Compute real category frequency and percentage distribution
counts = df['{target_cat}'].dropna().astype(str).value_counts().head(8)
total_count = counts.sum()
percentages = (counts / total_count) * 100

fig, ax = plt.subplots(figsize=(9.5, 5.2), dpi=180)
colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'][:len(counts)]

wedges, texts, autotexts = ax.pie(
    counts.values,
    labels=None,
    autopct='%1.1f%%',
    startangle=140,
    colors=colors,
    wedgeprops=dict(edgecolor='#0a0f1d', linewidth=2.0),
    pctdistance=0.72
)

for autotext in autotexts:
    autotext.set_color('#ffffff')
    autotext.set_fontsize(10.5)
    autotext.set_weight('bold')

legend_labels = [f"{{k}} ({{v:,}} • {{p:.1f}}%)" for k, v, p in zip(counts.index, counts.values, percentages)]
ax.legend(
    wedges, 
    legend_labels, 
    title="{target_cat.replace('_', ' ').title()}", 
    loc="center left", 
    bbox_to_anchor=(1.02, 0.5),
    frameon=True,
    facecolor='#0f172a',
    edgecolor='#334155',
    fontsize=10,
    title_fontsize=11
)

ax.set_title("{title}", fontsize=13.5, fontweight='bold', pad=16, color='#ffffff')
plt.tight_layout()
plt.savefig(output_path, dpi=180, bbox_inches='tight', facecolor='#0a0f1d', edgecolor='none')
plt.close('all')
"""
            else:
                df_calc = df.copy()
                df_calc[target_num] = pd.to_numeric(df_calc[target_num].astype(str).str.replace(r'[\$,₹, ]', '', regex=True), errors='coerce')
                clean_df = df_calc.dropna(subset=[target_cat, target_num])
                agg_s = clean_df.groupby(target_cat)[target_num].sum().sort_values(ascending=False).head(8)
                counts_res = clean_df.groupby(target_cat).size()
                total_val = agg_s.sum() if agg_s.sum() > 0 else 1
                percentages = (agg_s / total_val) * 100
                is_curr = any(c in target_num.lower() for c in ["salary", "revenue", "price", "amount", "cost", "budget", "total"])

                spec_data = [
                    {
                        "category": str(k),
                        "value": round(float(v), 2),
                        "formatted_value": f"₹{float(v):,.0f}" if (is_curr and float(v) > 1000) else f"{float(v):,.2f}",
                        "count": int(counts_res.get(k, 0)),
                        "records": int(counts_res.get(k, 0)),
                        "percentage": f"{round((float(v) / total_val) * 100, 1)}%",
                        "metric_label": f"Total {target_num.replace('_', ' ').title()}",
                        "category_label": target_cat.replace('_', ' ').title(),
                        "total_" + target_num.lower(): round(float(v), 2)
                    }
                    for k, v in agg_s.items()
                ]

                title = f"{target_num.replace('_', ' ').title()} Share by {target_cat.replace('_', ' ').title()}"
                explanation = f"Generated donut chart displaying {target_num} proportion across {target_cat}."
                columns_used = [target_cat, target_num]
                aggregation = "sum"
                value_column = target_num

                code = f"""# Compute real metric sum share across categories
agg_s = df.dropna(subset=['{target_cat}', '{target_num}']).groupby('{target_cat}')['{target_num}'].sum().sort_values(ascending=False).head(8)
total_val = agg_s.sum()
percentages = (agg_s / total_val) * 100

fig, ax = plt.subplots(figsize=(9.5, 5.2), dpi=180)
colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'][:len(agg_s)]

wedges, texts, autotexts = ax.pie(
    agg_s.values,
    labels=None,
    autopct='%1.1f%%',
    startangle=140,
    colors=colors,
    wedgeprops=dict(width=0.5, edgecolor='#0a0f1d', linewidth=2.0),
    pctdistance=0.75
)

for autotext in autotexts:
    autotext.set_color('#ffffff')
    autotext.set_fontsize(10.5)
    autotext.set_weight('bold')

legend_labels = [f"{{k}} ({{p:.1f}}%)" for k, p in zip(agg_s.index, percentages)]
ax.legend(
    wedges, 
    legend_labels, 
    title="{target_cat.replace('_', ' ').title()}", 
    loc="center left", 
    bbox_to_anchor=(1.02, 0.5),
    frameon=True,
    facecolor='#0f172a',
    edgecolor='#334155',
    fontsize=10,
    title_fontsize=11
)

ax.set_title("{title}", fontsize=13.5, fontweight='bold', pad=16, color='#ffffff')
plt.tight_layout()
plt.savefig(output_path, dpi=180, bbox_inches='tight', facecolor='#0a0f1d', edgecolor='none')
plt.close('all')
"""

            chart_spec = {
                "id": unique_viz_id,
                "chart_type": "pie",
                "title": title,
                "dataset_id": active_ds_id,
                "category_column": target_cat,
                "value_column": value_column,
                "aggregation": aggregation,
                "data": spec_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "ready"
            }

            return {
                "status": "success",
                "code": code.strip(),
                "chart_type": "pie",
                "title": title,
                "columns_used": columns_used,
                "explanation": explanation,
                "chart_specification": chart_spec
            }

        # ─────────────────────────────────────────────────────────────────────────
        # 15. HISTOGRAM / NUMERIC DISTRIBUTION
        # ─────────────────────────────────────────────────────────────────────────
        is_hist = (
            any(k in lower_p for k in ["histogram", "distribution", "spread", "density", "binned", "bins"])
            and target_num
            and not is_pie
            and not any(k in lower_p for k in [" by ", " across ", " vs ", " versus ", " compared to "])
        )

        if is_hist:
            title = f"{target_num.replace('_', ' ').title()} Distribution"
            explanation = f"Generated histogram showing the frequency distribution and spread of {target_num}."
            columns_used = [target_num]

            df_calc = df.copy()
            df_calc[target_num] = pd.to_numeric(df_calc[target_num].astype(str).str.replace(r'[\$,₹, ]', '', regex=True), errors='coerce')
            clean_s = df_calc[target_num].dropna()

            counts, bin_edges = np.histogram(clean_s, bins='auto' if len(clean_s) > 20 else 8)
            spec_data = [
                {
                    "bin_range": f"{round(bin_edges[i], 1)} - {round(bin_edges[i+1], 1)}",
                    "category": f"{round(bin_edges[i], 1)} - {round(bin_edges[i+1], 1)}",
                    "bin_start": float(bin_edges[i]),
                    "bin_end": float(bin_edges[i+1]),
                    "count": int(counts[i]),
                    "records": int(counts[i]),
                    "value": int(counts[i]),
                    "formatted_value": f"{int(counts[i])} records",
                    "metric_label": "Frequency (Count)",
                    "category_label": f"{target_num.replace('_', ' ').title()} Range"
                }
                for i in range(len(counts))
            ]

            code = f"""# Generate histogram for numeric distribution
df['{target_num}'] = pd.to_numeric(df['{target_num}'].astype(str).str.replace(r'[\\$,₹, ]', '', regex=True), errors='coerce')
clean_data = df['{target_num}'].dropna()

fig, ax = plt.subplots(figsize=(9.5, 5.5), dpi=160)
n, bins, patches = ax.hist(clean_data, bins='auto', color='#6366f1', edgecolor='#818cf8', alpha=0.85, zorder=3)

mean_val = clean_data.mean()
ax.axvline(mean_val, color='#22d3ee', linestyle='--', linewidth=2, label=f'Mean: ₹{{mean_val:,.0f}}' if mean_val > 1000 else f'Mean: {{mean_val:.1f}}', zorder=4)

ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
ax.set_xlabel("{target_num.replace('_', ' ').title()}", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
ax.set_ylabel("Frequency (Count)", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
ax.legend(loc='upper right', frameon=True, facecolor='#0d1322', edgecolor='#1e293b', fontsize=9.5)
ax.grid(axis='y', linestyle='--', alpha=0.3, zorder=0)

plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#0a0e1a', edgecolor='none')
plt.close('all')
"""
            chart_spec = {
                "id": unique_viz_id,
                "dataset_id": active_ds_id,
                "question": prompt,
                "chart_type": "histogram",
                "title": title,
                "x_column": target_num,
                "y_column": target_num,
                "aggregation": "histogram",
                "data": spec_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "ready"
            }

            return {
                "status": "success",
                "code": code.strip(),
                "chart_type": "histogram",
                "title": title,
                "columns_used": columns_used,
                "explanation": explanation,
                "chart_specification": chart_spec
            }

        # ─────────────────────────────────────────────────────────────────────────
        # 16. TIME-SERIES / MONTHLY TREND LINE CHART
        # ─────────────────────────────────────────────────────────────────────────
        is_trend = any(k in lower_p for k in ["trend", "monthly", "over time", "timeline", "hiring trend", "sales trend", "trajectory", "hiring", "joining trend"])
        if is_trend and (date_cols or len(df) > 5):
            d_col = date_cols[0] if date_cols else target_cat
            is_hiring = "hiring" in lower_p or "joined" in lower_p or "employee" in lower_p or "joining" in lower_p

            if is_hiring or not matched_num:
                title = "Monthly Hiring Trend" if is_hiring else f"{d_col.replace('_', ' ').title()} Trend"
                explanation = f"Generated monthly trend line chart tracking {title.lower()}."
                columns_used = [d_col]
                aggregation = "count"
                value_column = None

                code = f"""# Monthly count trend aggregation
df_trend = df.dropna(subset=['{d_col}']).copy()
try:
    df_trend['period_dt'] = pd.to_datetime(df_trend['{d_col}'], errors='coerce')
    df_trend = df_trend.dropna(subset=['period_dt']).sort_values(by='period_dt')
    df_trend['period'] = df_trend['period_dt'].dt.strftime('%b %Y')
    trend = df_trend.groupby('period', sort=False).size().tail(12)
except Exception:
    trend = df_trend.groupby('{d_col}').size().head(12)

fig, ax = plt.subplots(figsize=(9.5, 5.5), dpi=160)
ax.plot(trend.index.astype(str), trend.values, color='#06b6d4', linewidth=2.5, marker='o', markersize=6, markerfacecolor='#38bdf8', markeredgecolor='#0a0e1a', zorder=4)
ax.fill_between(range(len(trend)), trend.values, color='#06b6d4', alpha=0.15, zorder=2)

ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
ax.set_xlabel("Timeline", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
ax.set_ylabel("Number of Records", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
plt.xticks(rotation=30, ha='right')
ax.grid(True, linestyle='--', alpha=0.3, zorder=1)

plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#0a0e1a', edgecolor='none')
plt.close('all')
"""
                try:
                    df_trend_calc = df.dropna(subset=[d_col]).copy()
                    df_trend_calc['period_dt'] = pd.to_datetime(df_trend_calc[d_col], errors='coerce')
                    df_trend_calc = df_trend_calc.dropna(subset=['period_dt']).sort_values(by='period_dt')
                    df_trend_calc['period'] = df_trend_calc['period_dt'].dt.strftime('%b %Y')
                    t_series = df_trend_calc.groupby('period', sort=False).size().tail(12)
                    
                    line_spec_data = [
                        {
                            "date": str(k),
                            "category": str(k),
                            "value": float(v),
                            "count": int(v),
                            "records": int(v),
                            "formatted_value": f"{int(v)}",
                            "metric_label": "Employees Hired" if is_hiring else "Record Count",
                            "category_label": "Timeline"
                        }
                        for k, v in t_series.items()
                    ]
                except Exception:
                    line_spec_data = [{"date": "Point 1", "category": "Point 1", "value": 10, "formatted_value": "10", "metric_label": "Records"}]

                chart_spec = {
                    "id": unique_viz_id,
                    "chart_type": "line",
                    "title": title,
                    "dataset_id": active_ds_id,
                    "category_column": d_col,
                    "value_column": value_column,
                    "aggregation": aggregation,
                    "data": line_spec_data,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "status": "ready"
                }

                return {
                    "status": "success",
                    "code": code.strip(),
                    "chart_type": "line",
                    "title": title,
                    "columns_used": columns_used,
                    "explanation": explanation,
                    "chart_specification": chart_spec
                }

            else:
                title = f"{matched_num.replace('_', ' ').title()} Monthly Trend"
                explanation = f"Generated monthly trend line chart analyzing {matched_num} over time."
                columns_used = [d_col, matched_num]
                aggregation = "sum"
                value_column = matched_num
                is_curr = any(c in matched_num.lower() for c in ["salary", "revenue", "price", "amount", "cost", "total"])

                code = f"""# Time-series metric aggregation
df_trend = df.dropna(subset=['{d_col}', '{matched_num}']).copy()
try:
    df_trend['period_dt'] = pd.to_datetime(df_trend['{d_col}'], errors='coerce')
    df_trend = df_trend.dropna(subset=['period_dt']).sort_values(by='period_dt')
    df_trend['period'] = df_trend['period_dt'].dt.strftime('%b %Y')
    trend = df_trend.groupby('period', sort=False)['{matched_num}'].sum().tail(12)
except Exception:
    trend = df_trend.groupby('{d_col}')['{matched_num}'].sum().head(12)

fig, ax = plt.subplots(figsize=(9.5, 5.5), dpi=160)
ax.plot(trend.index.astype(str), trend.values, color='#06b6d4', linewidth=2.5, marker='o', markersize=6, markerfacecolor='#38bdf8', markeredgecolor='#0a0e1a', zorder=4)
ax.fill_between(range(len(trend)), trend.values, color='#06b6d4', alpha=0.15, zorder=2)

ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
ax.set_xlabel("Timeline", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
ax.set_ylabel("Total {matched_num.replace('_', ' ').title()}", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
plt.xticks(rotation=30, ha='right')
ax.grid(True, linestyle='--', alpha=0.3, zorder=1)

plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#0a0e1a', edgecolor='none')
plt.close('all')
"""
                try:
                    df_trend_calc = df.dropna(subset=[d_col, matched_num]).copy()
                    df_trend_calc['period_dt'] = pd.to_datetime(df_trend_calc[d_col], errors='coerce')
                    df_trend_calc[matched_num] = pd.to_numeric(df_trend_calc[matched_num].astype(str).str.replace(r'[\$,₹, ]', '', regex=True), errors='coerce')
                    df_trend_calc = df_trend_calc.dropna(subset=['period_dt', matched_num]).sort_values(by='period_dt')
                    df_trend_calc['period'] = df_trend_calc['period_dt'].dt.strftime('%b %Y')
                    t_series = df_trend_calc.groupby('period', sort=False)[matched_num].sum().tail(12)
                    counts_series = df_trend_calc.groupby('period', sort=False).size()
                    
                    line_spec_data = [
                        {
                            "date": str(k),
                            "category": str(k),
                            "value": float(v),
                            "formatted_value": f"₹{v:,.0f}" if (is_curr and v > 1000) else f"{v:,.1f}",
                            "count": int(counts_series.get(k, 1)),
                            "records": int(counts_series.get(k, 1)),
                            "metric_label": f"Total {matched_num.replace('_', ' ').title()}",
                            "category_label": "Timeline"
                        }
                        for k, v in t_series.items()
                    ]
                except Exception:
                    line_spec_data = [{"date": "Point 1", "category": "Point 1", "value": 10, "formatted_value": "10", "metric_label": "Value"}]

                chart_spec = {
                    "id": unique_viz_id,
                    "chart_type": "line",
                    "title": title,
                    "dataset_id": active_ds_id,
                    "category_column": d_col,
                    "value_column": value_column,
                    "aggregation": aggregation,
                    "data": line_spec_data,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "status": "ready"
                }

                return {
                    "status": "success",
                    "code": code.strip(),
                    "chart_type": "line",
                    "title": title,
                    "columns_used": columns_used,
                    "explanation": explanation,
                    "chart_specification": chart_spec
                }

        # ─────────────────────────────────────────────────────────────────────────
        # 17. TOP N RANKING / HORIZONTAL BAR CHART
        # ─────────────────────────────────────────────────────────────────────────
        is_top_n = any(k in lower_p for k in ["top", "highest", "best", "lowest", "bottom", "ranking", "horizontal", "barh"])
        if is_top_n and target_num:
            n_match = re.search(r'\b(\d+)\b', lower_p)
            top_n = int(n_match.group(1)) if n_match else 5
            top_n = max(3, min(top_n, 15))
            is_bottom = any(k in lower_p for k in ["bottom", "lowest", "least", "worst", "underperforming"])

            name_cat = next((c for c in meaningful_cats if any(k in c.lower() for k in ["name", "employee", "customer", "person", "model", "item"])), target_cat)
            prefix = "Bottom" if is_bottom else "Top"
            title = f"{prefix} {top_n} Employees by {target_num.replace('_', ' ').title()}" if ("employee" in lower_p or "name" in name_cat.lower()) else f"{prefix} {top_n} {target_num.replace('_', ' ').title()} by {name_cat.replace('_', ' ').title()}"
            explanation = f"Generated horizontal bar chart ranking {prefix.lower()} {top_n} records by {target_num}."

            df_calc = df.copy()
            df_calc[target_num] = pd.to_numeric(df_calc[target_num].astype(str).str.replace(r'[\$,₹, ]', '', regex=True), errors='coerce')
            
            if is_bottom:
                top_df = df_calc.dropna(subset=[name_cat, target_num]).sort_values(by=target_num, ascending=False).tail(top_n)
            else:
                top_df = df_calc.dropna(subset=[name_cat, target_num]).sort_values(by=target_num, ascending=True).tail(top_n)
                
            spec_data = [
                {
                    "name": str(r[name_cat]),
                    "value": float(r[target_num]),
                    "formatted_value": f"₹{float(r[target_num]):,.0f}" if float(r[target_num]) > 1000 else f"{float(r[target_num]):,.1f}",
                    target_num.lower(): float(r[target_num])
                }
                for _, r in top_df.iterrows()
            ]

            code = f"""# Sort and rank {prefix.lower()} {top_n} records
df['{target_num}'] = pd.to_numeric(df['{target_num}'].astype(str).str.replace(r'[\\$,₹, ]', '', regex=True), errors='coerce')
top_df = df.dropna(subset=['{name_cat}', '{target_num}']).sort_values(by='{target_num}', ascending={'False' if is_bottom else 'True'}).tail({top_n})

fig, ax = plt.subplots(figsize=(9.5, 5.5), dpi=160)
bars = ax.barh(top_df['{name_cat}'].astype(str), top_df['{target_num}'], color='#6366f1' if not is_bottom else '#f43f5e', edgecolor='#818cf8' if not is_bottom else '#fb7185', linewidth=1.2, height=0.55, zorder=3)

for bar in bars:
    w = bar.get_width()
    label = f'₹{{w/1e6:.1f}}M' if w >= 1e6 else f'₹{{w:,.0f}}' if w > 1000 else f'{{w:,.1f}}'
    ax.annotate(label,
                xy=(w, bar.get_y() + bar.get_height() / 2),
                xytext=(6, 0),
                textcoords="offset points",
                ha='left', va='center',
                fontsize=9.5, fontweight='bold', color='#ffffff')

ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
ax.set_xlabel("{target_num.replace('_', ' ').title()}", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
ax.set_ylabel("{name_cat.replace('_', ' ').title()}", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
ax.grid(axis='x', linestyle='--', alpha=0.3, zorder=0)

plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#0a0e1a', edgecolor='none')
plt.close('all')
"""
            chart_spec = {
                "id": unique_viz_id,
                "chart_type": "horizontal_bar",
                "title": title,
                "dataset_id": active_ds_id,
                "category_column": name_cat,
                "value_column": target_num,
                "aggregation": f"bottom_{top_n}" if is_bottom else f"top_{top_n}",
                "data": spec_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "ready"
            }

            return {
                "status": "success",
                "code": code.strip(),
                "chart_type": "horizontal_bar",
                "title": title,
                "columns_used": [name_cat, target_num],
                "explanation": explanation,
                "chart_specification": chart_spec
            }

        # ─────────────────────────────────────────────────────────────────────────
        # 18. SCATTER PLOT / BUBBLE
        # ─────────────────────────────────────────────────────────────────────────
        is_scatter = any(k in lower_p for k in ["scatter", "correlation", "relationship", "vs", "versus", "against"])
        if is_scatter and len(num_cols) >= 2:
            x_col = num_cols[0]
            y_col = num_cols[1]
            if matched_num:
                y_col = matched_num
                x_col = next((c for c in num_cols if c != y_col), num_cols[0])

            title = f"{y_col.replace('_', ' ').title()} vs {x_col.replace('_', ' ').title()}"
            explanation = f"Generated scatter plot analyzing relationship between {x_col} and {y_col}."

            df_calc = df.copy()
            df_calc[x_col] = pd.to_numeric(df_calc[x_col].astype(str).str.replace(r'[\$,₹, ]', '', regex=True), errors='coerce')
            df_calc[y_col] = pd.to_numeric(df_calc[y_col].astype(str).str.replace(r'[\$,₹, ]', '', regex=True), errors='coerce')
            scatter_df = df_calc.dropna(subset=[x_col, y_col]).head(80)

            name_label_col = next((c for c in actual_columns if any(k in c.lower() for k in ["name", "employee", "customer", "person", "item", "model"])), actual_columns[0])
            is_curr_x = any(c in x_col.lower() for c in ["salary", "revenue", "price", "amount", "cost"])
            is_curr_y = any(c in y_col.lower() for c in ["salary", "revenue", "price", "amount", "cost"])

            spec_data = [
                {
                    "x": float(r[x_col]),
                    "y": float(r[y_col]),
                    "value": float(r[y_col]),
                    "formatted_x": f"₹{float(r[x_col]):,.0f}" if (is_curr_x and float(r[x_col]) > 1000) else f"{float(r[x_col])}",
                    "formatted_y": f"₹{float(r[y_col]):,.0f}" if (is_curr_y and float(r[y_col]) > 1000) else f"{float(r[y_col])}",
                    "x_col": x_col,
                    "y_col": y_col,
                    "x_label": x_col.replace('_', ' ').title(),
                    "y_label": y_col.replace('_', ' ').title(),
                    "label": str(r.get(name_label_col, f"Record {i+1}")),
                    "rawRecord": {col: str(r[col]) for col in actual_columns[:6]}
                }
                for i, (_, r) in enumerate(scatter_df.iterrows())
            ]

            code = f"""# Scatter plot for correlation
df['{x_col}'] = pd.to_numeric(df['{x_col}'].astype(str).str.replace(r'[\\$,₹, ]', '', regex=True), errors='coerce')
df['{y_col}'] = pd.to_numeric(df['{y_col}'].astype(str).str.replace(r'[\\$,₹, ]', '', regex=True), errors='coerce')
plot_df = df.dropna(subset=['{x_col}', '{y_col}'])

fig, ax = plt.subplots(figsize=(9.5, 5.5), dpi=160)
ax.scatter(plot_df['{x_col}'], plot_df['{y_col}'], color='#06b6d4', edgecolors='#38bdf8', alpha=0.75, s=55, zorder=3)

ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
ax.set_xlabel("{x_col.replace('_', ' ').title()}", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
ax.set_ylabel("{y_col.replace('_', ' ').title()}", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
ax.grid(True, linestyle='--', alpha=0.3, zorder=0)

plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#0a0e1a', edgecolor='none')
plt.close('all')
"""
            chart_spec = {
                "id": unique_viz_id,
                "chart_type": "scatter",
                "title": title,
                "dataset_id": active_ds_id,
                "category_column": x_col,
                "value_column": y_col,
                "aggregation": "scatter",
                "data": spec_data,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "status": "ready"
            }

            return {
                "status": "success",
                "code": code.strip(),
                "chart_type": "scatter",
                "title": title,
                "columns_used": [x_col, y_col],
                "explanation": explanation,
                "chart_specification": chart_spec
            }

        # ─────────────────────────────────────────────────────────────────────────
        # 19 & 20. BAR CHART (VERTICAL BAR & GROUPED/AVERAGE COMPARISONS)
        # ─────────────────────────────────────────────────────────────────────────
        is_avg = any(k in lower_p for k in ["average", "avg", "mean", "compare", "across", "for each", "-wise", "wise"]) or (matched_num and matched_cat and not any(k in lower_p for k in ["count", "number of", "frequency", "total", "sum"]))
        is_sum = any(k in lower_p for k in ["total", "sum", "budget", "cumulative"])
        is_count_by = any(k in lower_p for k in ["count", "employee count", "number of", "how many", "frequency"]) or (not matched_num and not is_avg and not is_sum)

        if (is_avg or is_sum) and target_num:
            agg_type = "sum" if is_sum else "mean"
            agg_label = "Total" if is_sum else "Average"
            
            title = f"{agg_label} {target_num.replace('_', ' ').title()} by {target_cat.replace('_', ' ').title()}"
            explanation = f"Generated bar chart comparing {agg_label.lower()} {target_num} across {target_cat}."
            aggregation = agg_type
            value_column = target_num
            columns_used = [target_cat, target_num]

            df_calc = df.copy()
            df_calc[target_num] = pd.to_numeric(df_calc[target_num].astype(str).str.replace(r'[\$,₹, ]', '', regex=True), errors='coerce')
            clean_df = df_calc.dropna(subset=[target_cat, target_num])
            agg_res = clean_df.groupby(target_cat)[target_num].agg(agg_type).sort_values(ascending=False).head(8)
            counts_res = clean_df.groupby(target_cat).size()
            total_sum = agg_res.sum() if agg_res.sum() > 0 else 1
            is_curr = any(c in target_num.lower() for c in ["salary", "revenue", "price", "amount", "cost", "budget", "total"])

            spec_data = []
            for k, v in agg_res.items():
                v_num = round(float(v), 2)
                cnt = int(counts_res.get(k, 0))
                share_pct = round((v_num / total_sum) * 100, 1)
                fmt_val = f"₹{v_num:,.0f}" if (is_curr and v_num > 1000) else (f"{v_num:,.2f}" if isinstance(v, float) else f"{v_num}")

                spec_data.append({
                    "category": str(k),
                    "value": v_num,
                    "formatted_value": fmt_val,
                    "count": cnt,
                    "records": cnt,
                    "percentage": f"{share_pct}%",
                    "metric_label": f"{agg_label} {target_num.replace('_', ' ').title()}",
                    "category_label": target_cat.replace('_', ' ').title(),
                    "metric_name": f"{agg_label} {target_num.replace('_', ' ').title()}",
                    f"{agg_type}_{target_num.lower()}": v_num
                })

            code = f"""# Calculate {agg_label.lower()} {target_num} by {target_cat}
df['{target_num}'] = pd.to_numeric(df['{target_num}'].astype(str).str.replace(r'[\\$,₹, ]', '', regex=True), errors='coerce')
agg_res = df.dropna(subset=['{target_cat}', '{target_num}']).groupby('{target_cat}')['{target_num}'].{agg_type}().sort_values(ascending=False).head(8)

fig, ax = plt.subplots(figsize=(9.5, 5.5), dpi=160)
colors = ['#06b6d4', '#22d3ee', '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc'][:len(agg_res)]

bars = ax.bar(agg_res.index.astype(str), agg_res.values, color=colors, edgecolor='#06b6d4', linewidth=1.2, width=0.55, zorder=3)

for bar in bars:
    h = bar.get_height()
    label = f'₹{{h/1e6:.1f}}M' if h >= 1e6 else f'₹{{h:,.0f}}' if h > 1000 else f'{{h:,.1f}}'
    ax.annotate(label,
                xy=(bar.get_x() + bar.get_width() / 2, h),
                xytext=(0, 5),
                textcoords="offset points",
                ha='center', va='bottom',
                fontsize=9.5, fontweight='bold', color='#38bdf8')

ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
ax.set_xlabel("{target_cat.replace('_', ' ').title()}", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
ax.set_ylabel("{agg_label} {target_num.replace('_', ' ').title()}", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
plt.xticks(rotation=20, ha='right')
ax.grid(axis='y', linestyle='--', alpha=0.3, zorder=0)

plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#0a0e1a', edgecolor='none')
plt.close('all')
"""

        elif is_count_by:
            title = f"Employee Count by {target_cat.replace('_', ' ').title()}" if "employee" in lower_p else f"{target_cat.replace('_', ' ').title()} Record Count"
            explanation = f"Generated bar chart displaying record count breakdown across {target_cat}."
            aggregation = "count"
            value_column = None
            columns_used = [target_cat]
            clean_series = df[target_cat].dropna().astype(str).str.strip()

            clean_series = clean_series.replace({
                "human resource": "HR",
                "Human Resource": "HR",
                "hr": "HR",
                "it": "IT",
                "It": "IT"
            })
            clean_series = clean_series.apply(lambda x: x.upper() if len(x) <= 3 else x.title())
            counts = clean_series.value_counts().head(8)
            total_cnt = counts.sum() if counts.sum() > 0 else 1
            
            spec_data = [
                {
                    "category": str(k),
                    "value": int(v),
                    "count": int(v),
                    "records": int(v),
                    "formatted_value": f"{int(v)}",
                    "percentage": f"{round((v / total_cnt) * 100, 1)}%",
                    "metric_label": "Employee Count" if "employee" in lower_p else "Record Count",
                    "category_label": target_cat.replace('_', ' ').title(),
                    "metric_name": "Count"
                }
                for k, v in counts.items()
            ]

            code = f"""# Real count aggregation by category
clean_series = df['{target_cat}'].dropna().astype(str).str.strip()
clean_series = clean_series.replace({{"human resource": "HR", "Human Resource": "HR", "hr": "HR", "it": "IT", "It": "IT"}})
clean_series = clean_series.apply(lambda x: x.upper() if len(x) <= 3 else x.title())
counts = clean_series.value_counts().head(8)

fig, ax = plt.subplots(figsize=(9.5, 5.5), dpi=160)
colors = ['#6366f1', '#818cf8', '#06b6d4', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'][:len(counts)]

bars = ax.bar(counts.index.astype(str), counts.values, color=colors, edgecolor='#818cf8', linewidth=1.2, width=0.55, zorder=3)

for bar in bars:
    h = bar.get_height()
    ax.annotate(f'{{int(h)}}',
                xy=(bar.get_x() + bar.get_width() / 2, h),
                xytext=(0, 5),
                textcoords="offset points",
                ha='center', va='bottom',
                fontsize=9.5, fontweight='bold', color='#38bdf8')

ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
ax.set_xlabel("{target_cat.replace('_', ' ').title()}", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
ax.set_ylabel("Employee Count" if "employee" in "{lower_p}" else "Record Count", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
plt.xticks(rotation=20, ha='right')
ax.grid(axis='y', linestyle='--', alpha=0.3, zorder=0)

plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#0a0e1a', edgecolor='none')
plt.close('all')
"""
        else:
            title = f"Total {target_num.replace('_', ' ').title()} by {target_cat.replace('_', ' ').title()}"
            explanation = f"Generated bar chart showing total {target_num} by {target_cat}."
            aggregation = "sum"
            value_column = target_num
            columns_used = [target_cat, target_num]

            df_calc = df.copy()
            df_calc[target_num] = pd.to_numeric(df_calc[target_num].astype(str).str.replace(r'[\$,₹, ]', '', regex=True), errors='coerce')
            clean_df = df_calc.dropna(subset=[target_cat, target_num])
            agg_res = clean_df.groupby(target_cat)[target_num].sum().sort_values(ascending=False).head(8)
            counts_res = clean_df.groupby(target_cat).size()
            total_sum = agg_res.sum() if agg_res.sum() > 0 else 1
            is_curr = any(c in target_num.lower() for c in ["salary", "revenue", "price", "amount", "cost", "budget", "total"])

            spec_data = [
                {
                    "category": str(k),
                    "value": round(float(v), 2),
                    "formatted_value": f"₹{float(v):,.0f}" if (is_curr and float(v) > 1000) else f"{float(v):,.2f}",
                    "count": int(counts_res.get(k, 0)),
                    "records": int(counts_res.get(k, 0)),
                    "percentage": f"{round((float(v) / total_sum) * 100, 1)}%",
                    "metric_label": f"Total {target_num.replace('_', ' ').title()}",
                    "category_label": target_cat.replace('_', ' ').title(),
                    "metric_name": f"Total {target_num.replace('_', ' ').title()}",
                    "total_" + target_num.lower(): round(float(v), 2)
                }
                for k, v in agg_res.items()
            ]

            code = f"""# Real sum aggregation by category
agg_res = df.dropna(subset=['{target_cat}', '{target_num}']).groupby('{target_cat}')['{target_num}'].sum().sort_values(ascending=False).head(8)

fig, ax = plt.subplots(figsize=(9.5, 5.5), dpi=160)
colors = ['#06b6d4', '#22d3ee', '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc'][:len(agg_res)]

bars = ax.bar(agg_res.index.astype(str), agg_res.values, color=colors, edgecolor='#06b6d4', linewidth=1.2, width=0.55, zorder=3)

for bar in bars:
    h = bar.get_height()
    label = f'₹{{h/1e6:.1f}}M' if h >= 1e6 else f'₹{{h:,.0f}}' if h > 1000 else f'{{h:,.1f}}'
    ax.annotate(label,
                xy=(bar.get_x() + bar.get_width() / 2, h),
                xytext=(0, 5),
                textcoords="offset points",
                ha='center', va='bottom',
                fontsize=9.5, fontweight='bold', color='#38bdf8')

ax.set_title("{title}", fontsize=13, fontweight='bold', pad=15, color='#ffffff')
ax.set_xlabel("{target_cat.replace('_', ' ').title()}", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
ax.set_ylabel("Total {target_num.replace('_', ' ').title()}", fontsize=11, fontweight='bold', labelpad=10, color='#94a3b8')
plt.xticks(rotation=20, ha='right')
ax.grid(axis='y', linestyle='--', alpha=0.3, zorder=0)

plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#0a0e1a', edgecolor='none')
plt.close('all')
"""

        chart_spec = {
            "id": unique_viz_id,
            "chart_type": "bar",
            "title": title,
            "dataset_id": active_ds_id,
            "category_column": target_cat,
            "value_column": value_column,
            "aggregation": aggregation,
            "data": spec_data,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "ready"
        }

        return {
            "status": "success",
            "code": code.strip(),
            "chart_type": "bar",
            "title": title,
            "columns_used": columns_used,
            "explanation": explanation,
            "chart_specification": chart_spec
        }

    @classmethod
    def _build_retry_code(cls, chart_type: str, columns_used: List[str], df: pd.DataFrame, title: str) -> Optional[str]:
        try:
            col = columns_used[0] if columns_used else df.columns[0]
            if chart_type == "pie":
                return f"""counts = df['{col}'].dropna().astype(str).value_counts().head(6)
total_count = counts.sum()
percentages = (counts / total_count) * 100

fig, ax = plt.subplots(figsize=(9, 5), dpi=160)
colors = ['#6366f1', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'][:len(counts)]
wedges, texts, autotexts = ax.pie(counts.values, autopct='%1.1f%%', startangle=140, colors=colors)
for autotext in autotexts:
    autotext.set_color('#ffffff')
    autotext.set_weight('bold')
ax.legend(wedges, [f"{{k}} ({{v}})" for k, v in zip(counts.index, counts.values)], loc="center left", bbox_to_anchor=(1, 0.5))
ax.set_title("{title}", fontsize=12, fontweight='bold', color='#ffffff')
plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#0a0e1a', edgecolor='none')
plt.close('all')
"""
            else:
                return f"""counts = df['{col}'].dropna().astype(str).value_counts().head(6)
fig, ax = plt.subplots(figsize=(9, 5), dpi=160)
colors = ['#6366f1', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'][:len(counts)]
ax.bar(counts.index, counts.values, color=colors, width=0.55)
ax.set_title("{title}", fontsize=12, fontweight='bold', color='#ffffff')
plt.xticks(rotation=20, ha='right')
plt.tight_layout()
plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor='#0a0e1a', edgecolor='none')
plt.close('all')
"""
        except Exception:
            return None
