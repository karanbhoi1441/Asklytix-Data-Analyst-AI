import re
import warnings
import pandas as pd
from typing import Dict, Any, List, Optional

# Suppress dateutil parsing warnings during exploratory type sniffing
warnings.filterwarnings('ignore', category=UserWarning, module='pandas')


class SuggestionService:
    @classmethod
    def _normalize(cls, text: str) -> str:
        return re.sub(r'[^a-z0-9]', '', str(text).lower())

    @classmethod
    def _is_numeric_series(cls, col_name: str, df: pd.DataFrame) -> bool:
        series = df[col_name]
        if pd.api.types.is_numeric_dtype(series):
            return True
        norm_c = cls._normalize(col_name)
        if any(norm_c == cls._normalize(k) or cls._normalize(k) in norm_c for k in [
            "salary", "revenue", "sales", "price", "amount", "profit", "age", "quantity",
            "cost", "total", "score", "wage", "income", "package", "ctc", "discount", "unit", "value"
        ]):
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
    def _is_datetime_series(cls, col_name: str, df: pd.DataFrame) -> bool:
        series = df[col_name]
        if pd.api.types.is_datetime64_any_dtype(series):
            return True
        norm_c = cls._normalize(col_name)
        if any(k in norm_c for k in ["date", "time", "year", "month", "day", "joining", "hired", "timestamp", "period"]):
            return True
        try:
            sample = series.dropna().head(10).astype(str)
            if sample.empty:
                return False
            converted = pd.to_datetime(sample, errors='coerce')
            return converted.notna().sum() >= max(1, len(sample) // 2)
        except Exception:
            return False

    @classmethod
    def generate_dataset_suggestions(
        cls,
        df: pd.DataFrame,
        dataset_name: str,
        target_count: int = 12
    ) -> List[Dict[str, Any]]:
        """
        Deep Dataset Schema & Distribution Analysis:
        Inspects columns, types, cardinality, missing values, distributions, and generates
        10-15 high-quality, dataset-specific, schema-validated visualization suggestions.
        """
        if df is None or df.empty:
            return []

        cols = list(df.columns)
        row_count = len(df)

        # ── 1. COLUMN CLASSIFICATION & PROFILE ────────────────────────────────
        date_cols = [c for c in cols if cls._is_datetime_series(c, df)]
        num_cols = [c for c in cols if c not in date_cols and cls._is_numeric_series(c, df)]

        # ID & High-Cardinality Contact Filtering
        id_cols = [
            c for c in cols
            if re.search(r'(?:^|_)(?:id|key|code|uuid|pk|ssn|index)$', c, re.IGNORECASE)
            or (c not in num_cols and df[c].nunique() == row_count and row_count > 15)
        ]
        contact_cols = [
            c for c in cols
            if any(k in c.lower() for k in ["email", "mail", "phone", "contact", "url", "link", "address", "photo", "avatar", "image"])
        ]

        meaningful_num_cols = [c for c in num_cols if c not in id_cols]
        if not meaningful_num_cols and num_cols:
            meaningful_num_cols = num_cols

        # Prioritize primary metrics
        def num_priority(c: str) -> int:
            cl = c.lower()
            if any(k in cl for k in ["salary", "revenue", "sales", "price", "amount", "profit", "total", "value", "cost"]):
                return 0
            if any(k in cl for k in ["age", "quantity", "units", "score", "rating"]):
                return 1
            return 2

        meaningful_num_cols.sort(key=num_priority)

        # Categorical columns
        cat_cols = [
            c for c in cols
            if c not in date_cols and c not in num_cols and c not in id_cols and c not in contact_cols
        ]
        if not cat_cols:
            cat_cols = [c for c in cols if c not in id_cols and c not in contact_cols and df[c].nunique() < row_count] or [cols[0]]

        def cat_priority(c: str) -> int:
            cl = c.lower()
            if any(k in cl for k in ["department", "role", "designation", "category", "city", "model", "car", "product", "showroom", "gender"]):
                return 0
            if any(k in cl for k in ["name", "employee", "customer", "salesperson", "status", "type"]):
                return 1
            return 2

        cat_cols.sort(key=cat_priority)

        # Name / Entity columns (for Top N)
        name_cols = [
            c for c in cols
            if any(k in c.lower() for k in ["name", "employee", "customer", "person", "worker", "client", "model", "product", "showroom"])
            and c not in id_cols and c not in contact_cols
        ]
        if not name_cols and cat_cols:
            name_cols = cat_cols

        # Grouping dimensions (cardinality between 2 and 25)
        group_dims = [c for c in cat_cols if df[c].nunique() <= 25 and c not in contact_cols]
        if not group_dims:
            group_dims = cat_cols

        raw_candidates: List[Dict[str, Any]] = []

        # ── 2. SUGGESTION GENERATION RULES (DATA-DRIVEN) ───────────────────────

        # 1. Frequency / Count Breakdown by Primary Category (Bar Chart)
        if group_dims:
            p_cat = group_dims[0]
            cat_clean = p_cat.replace('_', ' ').title()
            is_emp = "employee" in p_cat.lower() or any("employee" in c.lower() for c in cols)
            raw_candidates.append({
                "title": f"{'Employee' if is_emp else 'Record'} Count by {cat_clean}",
                "description": f"Compare number of {'employees' if is_emp else 'records'} across {cat_clean.lower()}s.",
                "chart_type": "bar_chart",
                "x_column": p_cat,
                "y_column": None,
                "group_column": None,
                "aggregation": "count",
                "icon": "bar_chart",
                "prompt": f"Show {'employee' if is_emp else 'record'} count by {p_cat} as a bar chart.",
                "columns": [p_cat],
                "reason": f"Analyzes frequency distribution across {p_cat}.",
                "confidence": 0.98
            })

        # 2. Part-to-Whole Composition (Pie / Donut Chart) with Cardinality Protection
        if group_dims:
            pie_dim = next((c for c in group_dims if 2 <= df[c].nunique() <= 8), group_dims[0])
            dim_clean = pie_dim.replace('_', ' ').title()
            raw_candidates.append({
                "title": f"{dim_clean} Distribution",
                "description": f"View proportion and percentage breakdown of {dim_clean.lower()}.",
                "chart_type": "pie_chart",
                "x_column": pie_dim,
                "y_column": None,
                "group_column": None,
                "aggregation": "count",
                "icon": "pie_chart",
                "prompt": f"Show the frequency proportion breakdown of {pie_dim} as a pie chart.",
                "columns": [pie_dim],
                "reason": f"Visualizes proportional composition and percentages across {pie_dim}.",
                "confidence": 0.97
            })

        # 3. Average Metric by Primary Dimension (Bar Chart)
        if meaningful_num_cols and group_dims:
            num = meaningful_num_cols[0]
            cat = group_dims[0]
            num_clean = num.replace('_', ' ').title()
            cat_clean = cat.replace('_', ' ').title()
            raw_candidates.append({
                "title": f"Average {num_clean} by {cat_clean}",
                "description": f"Compare mean {num_clean.lower()} across {cat_clean.lower()}s.",
                "chart_type": "bar_chart",
                "x_column": cat,
                "y_column": num,
                "group_column": None,
                "aggregation": "mean",
                "icon": "bar_chart",
                "prompt": f"Show average {num} by {cat} as a bar chart.",
                "columns": [cat, num],
                "reason": f"Compares average {num} across {cat}.",
                "confidence": 0.96
            })

        # 4. Single Numeric Distribution Spread (Histogram)
        if meaningful_num_cols:
            num = meaningful_num_cols[0]
            num_clean = num.replace('_', ' ').title()
            raw_candidates.append({
                "title": f"{num_clean} Distribution",
                "description": f"Analyze density and frequency spread of {num_clean.lower()}.",
                "chart_type": "histogram",
                "x_column": num,
                "y_column": None,
                "group_column": None,
                "aggregation": "histogram",
                "icon": "activity",
                "prompt": f"Show {num} distribution as a histogram.",
                "columns": [num],
                "reason": f"Shows statistical distribution and concentration of {num}.",
                "confidence": 0.95
            })

        # 5. Two Numeric Correlation (Scatter Plot)
        if len(meaningful_num_cols) >= 2:
            num1 = meaningful_num_cols[0]
            num2 = meaningful_num_cols[1]
            n1_clean = num1.replace('_', ' ').title()
            n2_clean = num2.replace('_', ' ').title()
            raw_candidates.append({
                "title": f"{n1_clean} vs {n2_clean}",
                "description": f"Examine correlation and relationship between {n1_clean.lower()} and {n2_clean.lower()}.",
                "chart_type": "scatter_plot",
                "x_column": num2,
                "y_column": num1,
                "group_column": None,
                "aggregation": "scatter",
                "icon": "scatter_plot",
                "prompt": f"Show {num1} versus {num2} as a scatter chart.",
                "columns": [num1, num2],
                "reason": f"Evaluates bivariate correlation between {num1} and {num2}.",
                "confidence": 0.95
            })

        # 6. Chronological Trend Analysis (Line Chart)
        if date_cols:
            d_col = date_cols[0]
            d_clean = d_col.replace('_', ' ').title()
            is_hire = "joining" in d_col.lower() or "hire" in d_col.lower()
            if is_hire:
                raw_candidates.append({
                    "title": "Monthly Hiring Trend",
                    "description": "Track monthly hiring progression over time.",
                    "chart_type": "line_chart",
                    "x_column": d_col,
                    "y_column": None,
                    "group_column": None,
                    "aggregation": "count",
                    "icon": "trending_up",
                    "prompt": "Show monthly hiring trend as a line chart.",
                    "columns": [d_col],
                    "reason": f"Tracks employee onboarding volume over {d_col}.",
                    "confidence": 0.94
                })
            elif meaningful_num_cols:
                num = meaningful_num_cols[0]
                num_clean = num.replace('_', ' ').title()
                raw_candidates.append({
                    "title": f"Monthly {num_clean} Trend",
                    "description": f"Analyze trajectory and chronological trend of {num_clean.lower()}.",
                    "chart_type": "line_chart",
                    "x_column": d_col,
                    "y_column": num,
                    "group_column": None,
                    "aggregation": "sum",
                    "icon": "trending_up",
                    "prompt": f"Show monthly {num} trend over {d_col} as a line chart.",
                    "columns": [d_col, num],
                    "reason": f"Evaluates time-series progression of {num} over {d_col}.",
                    "confidence": 0.94
                })

        # 7. Top N Ranking (Horizontal Bar Chart)
        if name_cols and meaningful_num_cols:
            name_c = name_cols[0]
            num = meaningful_num_cols[0]
            n_clean = name_c.replace('_', ' ').title()
            num_clean = num.replace('_', ' ').title()
            raw_candidates.append({
                "title": f"Top 5 {n_clean} by {num_clean}",
                "description": f"Highlight top 5 highest {num_clean.lower()} records.",
                "chart_type": "horizontal_bar",
                "x_column": num,
                "y_column": name_c,
                "group_column": None,
                "aggregation": "top_5",
                "icon": "bar_chart_horizontal",
                "prompt": f"Show top 5 {name_c} by {num} as a horizontal bar chart.",
                "columns": [name_c, num],
                "reason": f"Ranks highest {name_c} records sorted by {num}.",
                "confidence": 0.93
            })

        # 8. Secondary Numeric Distribution (Histogram)
        if len(meaningful_num_cols) >= 2:
            num2 = meaningful_num_cols[1]
            n2_clean = num2.replace('_', ' ').title()
            raw_candidates.append({
                "title": f"{n2_clean} Distribution",
                "description": f"View frequency spread and distribution of {n2_clean.lower()}.",
                "chart_type": "histogram",
                "x_column": num2,
                "y_column": None,
                "group_column": None,
                "aggregation": "histogram",
                "icon": "activity",
                "prompt": f"Show {num2} distribution as a histogram.",
                "columns": [num2],
                "reason": f"Analyzes density and grouping spread of {num2}.",
                "confidence": 0.93
            })

        # 9. Total Sum Metric by Primary / Secondary Dimension (Bar Chart)
        if group_dims and meaningful_num_cols:
            dim = group_dims[1] if len(group_dims) > 1 else group_dims[0]
            num = meaningful_num_cols[0]
            d_clean = dim.replace('_', ' ').title()
            num_clean = num.replace('_', ' ').title()
            raw_candidates.append({
                "title": f"Total {num_clean} by {d_clean}",
                "description": f"Compare aggregate {num_clean.lower()} totals across {d_clean.lower()}s.",
                "chart_type": "bar_chart",
                "x_column": dim,
                "y_column": num,
                "group_column": None,
                "aggregation": "sum",
                "icon": "bar_chart",
                "prompt": f"Show total {num} by {dim} as a bar chart.",
                "columns": [dim, num],
                "reason": f"Aggregates total {num} across {dim}.",
                "confidence": 0.92
            })

        # 10. Secondary Numeric Average by Primary Dimension (Bar Chart)
        if len(meaningful_num_cols) >= 2 and group_dims:
            num2 = meaningful_num_cols[1]
            cat = group_dims[0]
            n2_clean = num2.replace('_', ' ').title()
            cat_clean = cat.replace('_', ' ').title()
            raw_candidates.append({
                "title": f"Average {n2_clean} by {cat_clean}",
                "description": f"Compare mean {n2_clean.lower()} across {cat_clean.lower()} groups.",
                "chart_type": "bar_chart",
                "x_column": cat,
                "y_column": num2,
                "group_column": None,
                "aggregation": "mean",
                "icon": "bar_chart",
                "prompt": f"Show average {num2} by {cat} as a bar chart.",
                "columns": [cat, num2],
                "reason": f"Evaluates average {num2} across {cat}.",
                "confidence": 0.92
            })

        # 11. Bottom N Ranking (Horizontal Bar Chart)
        if name_cols and meaningful_num_cols:
            name_c = name_cols[0]
            num = meaningful_num_cols[0]
            n_clean = name_c.replace('_', ' ').title()
            num_clean = num.replace('_', ' ').title()
            raw_candidates.append({
                "title": f"Bottom 5 {n_clean} by {num_clean}",
                "description": f"Identify 5 lowest {num_clean.lower()} records.",
                "chart_type": "horizontal_bar",
                "x_column": num,
                "y_column": name_c,
                "group_column": None,
                "aggregation": "bottom_5",
                "icon": "bar_chart_horizontal",
                "prompt": f"Show bottom 5 {name_c} by {num} as a horizontal bar chart.",
                "columns": [name_c, num],
                "reason": f"Ranks lowest {name_c} entries by {num}.",
                "confidence": 0.91
            })

        # 12. Secondary Categorical Share (Pie / Donut Chart)
        if len(group_dims) >= 2:
            cat2 = group_dims[1]
            c2_clean = cat2.replace('_', ' ').title()
            raw_candidates.append({
                "title": f"{c2_clean} Proportion Breakdown",
                "description": f"Examine distribution of records across {c2_clean.lower()}.",
                "chart_type": "pie_chart",
                "x_column": cat2,
                "y_column": None,
                "group_column": None,
                "aggregation": "count",
                "icon": "pie_chart",
                "prompt": f"Show the frequency proportion breakdown of {cat2} as a pie chart.",
                "columns": [cat2],
                "reason": f"Visualizes proportional composition of {cat2}.",
                "confidence": 0.91
            })

        # 13. Multi-Category Grouped Comparison (Grouped Bar Chart)
        if len(group_dims) >= 2 and meaningful_num_cols:
            cat1 = group_dims[0]
            cat2 = group_dims[1]
            num = meaningful_num_cols[0]
            c1_clean = cat1.replace('_', ' ').title()
            c2_clean = cat2.replace('_', ' ').title()
            num_clean = num.replace('_', ' ').title()
            raw_candidates.append({
                "title": f"{num_clean} Comparison ({c1_clean} vs {c2_clean})",
                "description": f"Compare {num_clean.lower()} grouped by {c1_clean.lower()} and {c2_clean.lower()}.",
                "chart_type": "bar_chart",
                "x_column": cat1,
                "y_column": num,
                "group_column": cat2,
                "aggregation": "mean",
                "icon": "bar_chart",
                "prompt": f"Compare average {num} across {cat1} and {cat2} as a bar chart.",
                "columns": [cat1, cat2, num],
                "reason": f"Multi-variable comparison of {num} across {cat1} and {cat2}.",
                "confidence": 0.90
            })

        # ── 3. SYNTHESIS FOR RICH DATASETS IF < 10 SUGGESTIONS ─────────────────
        if len(raw_candidates) < 10:
            for num in meaningful_num_cols:
                for cat in group_dims:
                    if len(raw_candidates) >= 15:
                        break
                    alt_title = f"{num.replace('_', ' ').title()} Spread by {cat.replace('_', ' ').title()}"
                    if not any(c['title'].lower() == alt_title.lower() for c in raw_candidates):
                        raw_candidates.append({
                            "title": alt_title,
                            "description": f"Analyze distribution of {num.lower()} across {cat.lower()} categories.",
                            "chart_type": "bar_chart",
                            "x_column": cat,
                            "y_column": num,
                            "group_column": None,
                            "aggregation": "mean",
                            "icon": "bar_chart",
                            "prompt": f"Show average {num} by {cat} as a bar chart.",
                            "columns": [cat, num],
                            "reason": f"Evaluates {num} metrics per {cat} category.",
                            "confidence": 0.90
                        })

        # ── 4. VALIDATION & DEDUPLICATION ─────────────────────────────────────
        valid_suggestions: List[Dict[str, Any]] = []
        seen_titles = set()
        seen_prompts = set()

        for cand in raw_candidates:
            # Check all referenced columns strictly exist in dataframe
            cand_cols = cand.get("columns", [])
            if not all(c in cols for c in cand_cols):
                continue

            title_key = cand["title"].lower().strip()
            prompt_key = cand["prompt"].lower().strip()

            if title_key in seen_titles or prompt_key in seen_prompts:
                continue

            seen_titles.add(title_key)
            seen_prompts.add(prompt_key)
            valid_suggestions.append(cand)

        # Final packaging with 1-based sequential numbers and clean metadata
        final_list: List[Dict[str, Any]] = []
        for i, item in enumerate(valid_suggestions[:15], 1):
            final_list.append({
                "id": f"sug_{i}_{abs(hash(item['title'])) % 100000}",
                "suggestion_number": i,
                "title": item["title"],
                "description": item.get("description", f"Analyze {item['title']}."),
                "chart_type": item["chart_type"],
                "x_column": item.get("x_column"),
                "y_column": item.get("y_column"),
                "group_column": item.get("group_column"),
                "aggregation": item.get("aggregation", "count"),
                "icon": item.get("icon", "bar_chart"),
                "prompt": item["prompt"],
                "columns": item.get("columns", []),
                "reason": item.get("reason", ""),
                "confidence": item.get("confidence", 0.95)
            })

        return final_list
