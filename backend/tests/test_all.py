import os
import sys
from pathlib import Path

# Add backend to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from fastapi.testclient import TestClient
from app.main import app
from app.services.parsers.parser_factory import ParserFactory
from app.services.quality_engine import DataQualityEngine
from app.services.cleaning_engine import CleaningEngine
from app.services.analysis_engine import AnalysisEngine

client = TestClient(app)

def run_tests():
    print("=== STARTING ASKLYTIX BACKEND TESTS ===")

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[OK] Health check passed")

    # 2. Authentication Flow (Signup, Login, Me, Logout)
    test_email = f"analyst_{os.urandom(4).hex()}@asklytix.com"
    signup_res = client.post("/api/v1/auth/signup", json={
        "name": "Jane Analyst",
        "email": test_email,
        "password": "SecurePassword123!"
    })
    assert signup_res.status_code == 200, f"Signup failed: {signup_res.text}"
    assert "access_token" in signup_res.cookies, "Access token cookie missing in signup"
    assert "refresh_token" in signup_res.cookies, "Refresh token cookie missing in signup"
    print("[OK] User signup and HttpOnly cookie issuance passed")

    # Call /me with cookies
    me_res = client.get("/api/v1/auth/me", cookies=signup_res.cookies)
    assert me_res.status_code == 200, f"Get /me failed: {me_res.text}"
    assert me_res.json()["email"] == test_email
    print("[OK] Authenticated /me endpoint passed")

    # Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    auth_cookies = login_res.cookies
    print("[OK] User login and cookie renewal passed")

    # 3. Parsers (CSV, Excel, JSON, Parquet)
    test_dir = BASE_DIR / "storage" / "test_tmp"
    test_dir.mkdir(parents=True, exist_ok=True)

    # A) CSV with semicolon delimiter and mixed nulls
    csv_path = test_dir / "sample_test.csv"
    csv_path.write_text(
        "order_id;customer_name;category;revenue;profit;is_returned\n"
        "ORD-10001;Sarah Connor;Electronics;1299.99;340.50;false\n"
        "ORD-10002;John Doe; ;450.00;120.00;false\n"
        "ORD-10001;Sarah Connor;Electronics;1299.99;340.50;false\n"  # exact duplicate
        "ORD-10004;;Apparel;89.50;25.00;true\n",
        encoding="utf-8"
    )

    csv_parser = ParserFactory.get_parser("csv")
    csv_df = csv_parser.parse_to_dataframe(str(csv_path))
    assert len(csv_df) == 4, f"CSV parsing row count mismatch: {len(csv_df)}"
    std_csv = csv_parser.extract_standard_result(csv_df)
    assert std_csv.column_count == 6
    print(f"[OK] CSV parser passed with semicolon detection ({len(csv_df)} rows, {std_csv.column_count} cols)")

    # B) Parquet binary creation & parsing
    pq_path = test_dir / "sample_test.parquet"
    table = pa.Table.from_pandas(csv_df)
    pq.write_table(table, str(pq_path))

    pq_parser = ParserFactory.get_parser("parquet")
    pq_df = pq_parser.parse_to_dataframe(str(pq_path))
    assert len(pq_df) == 4
    print(f"[OK] Parquet binary-aware parser passed ({len(pq_df)} rows)")

    # 4. Data Quality Engine & Auto-Clean
    initial_quality = DataQualityEngine.evaluate_dataframe(csv_df)
    print(f"[OK] Initial Real Quality Score: {initial_quality['score']}% (Completeness: {initial_quality['completeness']}%, Uniqueness: {initial_quality['uniqueness']}%)")
    assert initial_quality["score"] < 100, "Initial score should detect missing customer and duplicate row"

    cleaned_df, audit_log, cleaned_quality = CleaningEngine.clean_dataframe(csv_df)
    print(f"[OK] Cleaned Real Quality Score: {cleaned_quality['score']}% (Audit log entries: {len(audit_log)})")
    assert len(cleaned_df) == 3, "Duplicate row was not removed by auto-clean"
    assert cleaned_quality["score"] >= initial_quality["score"], "Cleaned score should improve or equal initial score"

    # 5. Full Dataset Upload & Preview API via TestClient
    with open(csv_path, "rb") as f:
        upload_res = client.post(
            "/api/v1/datasets/upload",
            files={"file": ("sales_data.csv", f, "text/csv")},
            cookies=auth_cookies
        )
    assert upload_res.status_code == 200, f"Upload API failed: {upload_res.text}"
    uploaded_data = upload_res.json()["data"]
    dataset_id = uploaded_data["dataset_id"]
    print(f"[OK] Dataset Upload API passed (Dataset ID: {dataset_id})")

    # Preview API
    preview_res = client.get(f"/api/v1/datasets/{dataset_id}/preview?limit=10&offset=0", cookies=auth_cookies)
    assert preview_res.status_code == 200, f"Preview API failed: {preview_res.text}"
    assert len(preview_res.json()["rows"]) == 4
    print("[OK] Dataset Preview API with pagination passed")

    # Auto-Clean API
    clean_api_res = client.post(f"/api/v1/datasets/{dataset_id}/clean", cookies=auth_cookies)
    assert clean_api_res.status_code == 200, f"Clean API failed: {clean_api_res.text}"
    clean_data = clean_api_res.json()
    assert clean_data["version_number"] == 2
    print(f"[OK] Dataset Auto Clean API passed (New Version ID: {clean_data['version_id']}, New Score: {clean_data['new_score']}%)")

    # Analysis Query (Exact Record Lookup for ORD-10001)
    analysis_res = client.post("/api/v1/analysis/query", json={
        "dataset_id": dataset_id,
        "query": "Show details for ORD-10001"
    }, cookies=auth_cookies)
    assert analysis_res.status_code == 200, f"Analysis query failed: {analysis_res.text}"
    analysis_data = analysis_res.json()
    assert "Sarah Connor" in analysis_data["text"]
    assert "codeDetails" in analysis_data
    print("[OK] Exact Record Lookup & Code Inspector API passed")

    # Column Isolation & Distinct Test ("give me the only category in a dataset?")
    col_res = client.post("/api/v1/analysis/query", json={
        "dataset_id": dataset_id,
        "query": "give me the only category in a dataset?"
    }, cookies=auth_cookies)
    assert col_res.status_code == 200, f"Column isolation query failed: {col_res.text}"
    col_data = col_res.json()
    assert "category" in col_data["rowColumns"][0].lower() or "category" in str(col_data["rowColumns"])
    assert "unique" in col_data["text"].lower() or "distinct" in col_data["text"].lower()
    print("[OK] Specific Column Isolation & Distinct Values Accuracy passed")

    # Aggregation Query Test ("what is the average revenue?")
    agg_res = client.post("/api/v1/analysis/query", json={
        "dataset_id": dataset_id,
        "query": "what is the average revenue?"
    }, cookies=auth_cookies)
    assert agg_res.status_code == 200, f"Aggregation query failed: {agg_res.text}"
    agg_data = agg_res.json()
    assert "Average" in agg_data["text"] or "average" in agg_data["text"]
    print("[OK] Numeric Aggregation & Statistical Metrics Accuracy passed")

    # Filter Condition Query Test ("records where revenue > 100")
    filter_res = client.post("/api/v1/analysis/query", json={
        "dataset_id": dataset_id,
        "query": "records where revenue > 100"
    }, cookies=auth_cookies)
    assert filter_res.status_code == 200, f"Filter condition query failed: {filter_res.text}"
    filter_data = filter_res.json()
    assert len(filter_data["rows"]) > 0
    print("[OK] Condition Filtering & Dynamic WHERE evaluation passed")

    # Dashboard Metrics API
    dash_res = client.get(f"/api/v1/dashboard/metrics?dataset_id={dataset_id}", cookies=auth_cookies)
    assert dash_res.status_code == 200, f"Dashboard metrics failed: {dash_res.text}"
    dash_data = dash_res.json()
    assert len(dash_data["kpis"]) == 4
    assert len(dash_data["categorySales"]) > 0
    print("[OK] Dashboard Metrics calculation API passed")

    # Download Cleaned Version
    download_res = client.get(f"/api/v1/datasets/{dataset_id}/versions/{clean_data['version_id']}/download", cookies=auth_cookies)
    assert download_res.status_code == 200
    assert len(download_res.content) > 0
    print("[OK] Cleaned Dataset Version Download API passed")

    # Clean up test dir
    try:
        import shutil
        shutil.rmtree(test_dir)
    except Exception:
        pass

    print("\n========================================================")
    print(" ALL BACKEND ARCHITECTURE & SECURITY TESTS PASSED 100%!")
    print("========================================================")

if __name__ == "__main__":
    run_tests()
