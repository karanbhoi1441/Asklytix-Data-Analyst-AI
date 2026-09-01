import sys
import io
from pathlib import Path

# Ensure backend root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.db.session import SessionLocal
from app.db.models import Dataset
from app.services.analysis_engine import AnalysisEngine
from app.services.ai_visualization_service import AIVisualizationService

def test_all_interaction_cases():
    db = SessionLocal()
    emp_ds = db.query(Dataset).filter(Dataset.name.like('%Employee%')).first()
    honda_ds = db.query(Dataset).filter(Dataset.name.like('%honda%')).first()

    if not emp_ds or not honda_ds:
        print("[SKIP] Datasets not seeded in database. Skipping live dataset interaction assertions.")
        return

    emp_df = AnalysisEngine.get_dataframe(emp_ds.file_path)
    honda_df = AnalysisEngine.get_dataframe(honda_ds.file_path)

    print("=================================================================")
    print("TEST SUITE: CRITICAL VISUALIZATION INTERACTION & DATA-BINDING")
    print("=================================================================")

    # 1. KPI: How many employees work in IT?
    res1 = AIVisualizationService.generate_and_execute_visualization("How many employees work in IT?", emp_df, emp_ds.file_path, emp_ds.name, emp_ds.id)
    assert res1["status"] == "success"
    spec1 = res1["chart_specification"]
    assert spec1["chart_type"] == "kpi"
    assert spec1["value"] == 20
    print(f"[PASS] 1. KPI: IT Employee Count = {spec1['value']} ({spec1['metric_name']})")

    # 2. Bar: Show average salary by department
    res2 = AIVisualizationService.generate_and_execute_visualization("Show average salary by department.", emp_df, emp_ds.file_path, emp_ds.name, emp_ds.id)
    assert res2["status"] == "success"
    spec2 = res2["chart_specification"]
    assert spec2["chart_type"] == "bar"
    assert len(spec2["data"]) > 0
    it_datum = next((d for d in spec2["data"] if d["category"] == "IT"), spec2["data"][0])
    assert it_datum.get("value") is not None and it_datum.get("value") > 0, "Bar chart datum value is missing!"
    assert it_datum.get("formatted_value") is not None and "₹" in it_datum.get("formatted_value"), f"Formatted value missing: {it_datum}"
    assert it_datum.get("records") is not None, "Records field missing"
    assert it_datum.get("metric_label") == "Average Salary", f"Metric label is wrong: {it_datum.get('metric_label')}"
    print(f"[PASS] 2. Bar: IT Avg Salary = {it_datum['formatted_value']} (Records: {it_datum['records']}, Share: {it_datum['percentage']}, Metric: {it_datum['metric_label']})")

    # 3. Pie: Show employee percentage by department
    res3 = AIVisualizationService.generate_and_execute_visualization("Show employee percentage by department.", emp_df, emp_ds.file_path, emp_ds.name, emp_ds.id)
    assert res3["status"] == "success"
    spec3 = res3["chart_specification"]
    assert spec3["chart_type"] == "pie"
    assert len(spec3["data"]) > 0
    pie_datum = spec3["data"][0]
    assert pie_datum.get("value") is not None, "Pie datum value missing"
    assert "%" in str(pie_datum.get("percentage")), "Pie percentage missing"
    print(f"[PASS] 3. Pie: Category = {pie_datum['category']}, Count = {pie_datum['value']}, Percentage = {pie_datum['percentage']}")

    # 4. Histogram: Show salary distribution
    res4 = AIVisualizationService.generate_and_execute_visualization("Show salary distribution.", emp_df, emp_ds.file_path, emp_ds.name, emp_ds.id)
    assert res4["status"] == "success"
    spec4 = res4["chart_specification"]
    assert spec4["chart_type"] == "histogram"
    assert len(spec4["data"]) > 0
    hist_datum = spec4["data"][0]
    assert hist_datum.get("bin_range") is not None
    assert hist_datum.get("value") is not None
    print(f"[PASS] 4. Histogram: Bin = {hist_datum['bin_range']}, Frequency = {hist_datum['value']}")

    # 5. Scatter: Show age versus salary
    res5 = AIVisualizationService.generate_and_execute_visualization("Show age versus salary.", emp_df, emp_ds.file_path, emp_ds.name, emp_ds.id)
    assert res5["status"] == "success"
    spec5 = res5["chart_specification"]
    assert spec5["chart_type"] == "scatter"
    assert len(spec5["data"]) > 0
    scatter_datum = spec5["data"][0]
    assert scatter_datum.get("x") is not None and scatter_datum.get("y") is not None
    assert scatter_datum.get("label") is not None
    assert scatter_datum.get("formatted_y") is not None
    print(f"[PASS] 5. Scatter: Label = {scatter_datum['label']}, Age = {scatter_datum['x']}, Salary = {scatter_datum['formatted_y']}")

    # 6. Line: Show employee count trend by month
    res6 = AIVisualizationService.generate_and_execute_visualization("Show employee count trend by month.", emp_df, emp_ds.file_path, emp_ds.name, emp_ds.id)
    assert res6["status"] == "success"
    spec6 = res6["chart_specification"]
    assert spec6["chart_type"] == "line"
    assert len(spec6["data"]) > 0
    line_datum = spec6["data"][0]
    assert line_datum.get("date") is not None and line_datum.get("value") is not None
    print(f"[PASS] 6. Line: Month = {line_datum['date']}, Records = {line_datum['value']}")

    # 7. Horizontal Bar: Show top 5 highest paid employees
    res7 = AIVisualizationService.generate_and_execute_visualization("Show top 5 highest paid employees.", emp_df, emp_ds.file_path, emp_ds.name, emp_ds.id)
    assert res7["status"] == "success"
    spec7 = res7["chart_specification"]
    assert spec7["chart_type"] == "horizontal_bar"
    assert len(spec7["data"]) == 5
    top_datum = spec7["data"][-1]
    assert top_datum.get("name") is not None and top_datum.get("value") is not None
    print(f"[PASS] 7. Horizontal Bar: Top 1 = {top_datum['name']} ({top_datum['formatted_value']})")

    # 8. Map: Show showroom locations on a map
    res8 = AIVisualizationService.generate_and_execute_visualization("Show showroom locations on a map.", honda_df, honda_ds.file_path, honda_ds.name, honda_ds.id)
    assert res8["status"] == "success"
    spec8 = res8["chart_specification"]
    assert spec8["chart_type"] == "map"
    assert len(spec8["data"]) == 5
    pune_datum = next((d for d in spec8["data"] if d["city"] == "Pune"), spec8["data"][0])
    assert pune_datum.get("latitude") == 18.5204 and pune_datum.get("longitude") == 73.8567
    assert len(pune_datum.get("entities", [])) > 0
    print(f"[PASS] 8. Map: City = {pune_datum['city']} ({pune_datum['latitude']}°N, {pune_datum['longitude']}°E), Showrooms = {pune_datum['entities'][:2]}")

    # Map Validation on non-geo dataset
    res_err = AIVisualizationService.generate_and_execute_visualization("Show showroom locations on a map.", emp_df, emp_ds.file_path, emp_ds.name, emp_ds.id)
    assert res_err["status"] == "validation_error"
    print(f"[PASS] Map Validation: Non-geo dataset correctly prevented with message: '{res_err['message']}'")

    print("\n=================================================================")
    print("ALL 8 CRITICAL DATA-BINDING & INTERACTION TEST CASES PASSED 100%!")
    print("=================================================================")

if __name__ == '__main__':
    test_all_interaction_cases()
