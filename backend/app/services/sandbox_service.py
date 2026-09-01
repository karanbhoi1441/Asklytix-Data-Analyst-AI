import os
import shutil
import subprocess
import sys
import time
import uuid
import base64
import json
from typing import Dict, Any, Optional
from pathlib import Path

# Base sandbox directories
SANDBOX_BASE_DIR = Path("storage/sandbox")
OUTPUTS_DIR = SANDBOX_BASE_DIR / "outputs"


class SandboxService:
    @classmethod
    def _ensure_directories(cls):
        SANDBOX_BASE_DIR.mkdir(parents=True, exist_ok=True)
        OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

    @classmethod
    def execute_visualization(
        cls,
        code: str,
        dataset_file_path: str,
        execution_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes Python visualization code inside an isolated workspace directory.
        Generates interactive HTML (Plotly), structured JSON, and optional PNG.
        Returns full execution contract matching AskLytix Sandbox-first specifications.
        """
        cls._ensure_directories()
        exec_id = execution_id or str(uuid.uuid4())
        workspace_dir = SANDBOX_BASE_DIR / f"run_{exec_id}"
        workspace_dir.mkdir(parents=True, exist_ok=True)

        start_time = time.perf_counter()
        stdout_output = ""
        stderr_output = ""
        saved_image_path = None
        base64_image = None
        interactive_html = None
        chart_spec = None
        success = False
        error_message = None

        try:
            # 1. Copy dataset file into isolated workspace
            ext = Path(dataset_file_path).suffix.lower()
            workspace_data_file = workspace_dir / f"dataset{ext}"
            shutil.copy2(dataset_file_path, workspace_data_file)

            # 2. Build self-contained runner script with Plotly + Matplotlib headless runtime
            runner_code = f"""
import os
import sys
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# Try importing Plotly for interactive visualization
try:
    import plotly
    import plotly.express as px
    import plotly.graph_objects as go
    import plotly.io as pio
    pio.templates.default = "plotly_dark"
except Exception:
    pass

# Apply AskLytix Dark Cyber Aesthetic for Matplotlib fallback
plt.style.use('dark_background')
plt.rcParams['figure.facecolor'] = '#070b16'
plt.rcParams['axes.facecolor'] = '#0b1122'
plt.rcParams['axes.edgecolor'] = '#1e293b'
plt.rcParams['axes.labelcolor'] = '#94a3b8'
plt.rcParams['xtick.color'] = '#94a3b8'
plt.rcParams['ytick.color'] = '#94a3b8'
plt.rcParams['grid.color'] = '#1e293b'
plt.rcParams['grid.linestyle'] = '--'
plt.rcParams['grid.alpha'] = 0.4
plt.rcParams['text.color'] = '#f8fafc'
plt.rcParams['font.sans-serif'] = ['Inter', 'Segoe UI', 'DejaVu Sans', 'Arial']

# Load dataset into df
data_path = 'dataset{ext}'
if data_path.endswith('.csv'):
    with open(data_path, 'r', encoding='utf-8', errors='ignore') as f:
        first_line = f.readline()
        sep = ';' if ';' in first_line and first_line.count(';') > first_line.count(',') else ','
    df = pd.read_csv(data_path, sep=sep)
elif data_path.endswith(('.xlsx', '.xls')):
    df = pd.read_excel(data_path)
elif data_path.endswith('.json'):
    df = pd.read_json(data_path)
else:
    df = pd.read_csv(data_path)

output_path = 'output.png'
output_html = 'output.html'
output_json = 'output.json'

fig = None

# --- USER VISUALIZATION CODE START ---
{code}
# --- USER VISUALIZATION CODE END ---

# Auto-save Plotly Figure to HTML & PNG if fig exists
if 'fig' in locals() and fig is not None:
    try:
        # Write standalone interactive HTML
        fig.write_html(output_html, full_html=False, include_plotlyjs='cdn')
        # Also write JSON spec
        with open(output_json, 'w', encoding='utf-8') as jf:
            jf.write(fig.to_json())
    except Exception as e:
        pass

# Ensure Matplotlib image is saved if generated
if not os.path.exists(output_path) and plt.get_fignums():
    plt.tight_layout()
    plt.savefig(output_path, dpi=160, bbox_inches='tight', facecolor=plt.gcf().get_facecolor(), edgecolor='none')
    plt.close('all')
"""

            script_path = workspace_dir / "visualize.py"
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(runner_code)

            # 3. Create restricted environment for subprocess
            safe_env = {
                "PATH": os.environ.get("PATH", ""),
                "SYSTEMROOT": os.environ.get("SYSTEMROOT", ""),
                "WINDIR": os.environ.get("WINDIR", ""),
                "TEMP": str(workspace_dir),
                "TMP": str(workspace_dir),
                "PYTHONPATH": os.pathsep.join(sys.path),
                "MPLCONFIGDIR": str(workspace_dir),
            }

            # 4. Execute in isolated subprocess with timeout
            process = subprocess.run(
                [sys.executable, str(script_path.name)],
                cwd=str(workspace_dir),
                capture_output=True,
                text=True,
                timeout=12,
                env=safe_env
            )

            stdout_output = process.stdout
            stderr_output = process.stderr
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

            workspace_output_png = workspace_dir / "output.png"
            workspace_output_html = workspace_dir / "output.html"
            workspace_output_json = workspace_dir / "output.json"

            # Check if execution succeeded (either interactive HTML or PNG or JSON produced)
            has_output = (workspace_output_html.exists() and workspace_output_html.stat().st_size > 0) or \
                         (workspace_output_png.exists() and workspace_output_png.stat().st_size > 0) or \
                         (workspace_output_json.exists() and workspace_output_json.stat().st_size > 0)

            if process.returncode == 0 and has_output:
                success = True

                # Read interactive HTML if produced
                if workspace_output_html.exists():
                    with open(workspace_output_html, "r", encoding="utf-8", errors="ignore") as hf:
                        interactive_html = hf.read()
                    # Also persist HTML
                    persistent_html_path = OUTPUTS_DIR / f"{exec_id}.html"
                    shutil.copy2(workspace_output_html, persistent_html_path)

                # Read JSON spec if produced
                if workspace_output_json.exists():
                    try:
                        with open(workspace_output_json, "r", encoding="utf-8", errors="ignore") as jf:
                            chart_spec = json.load(jf)
                    except Exception:
                        pass

                # Read & persist PNG if produced
                if workspace_output_png.exists():
                    persistent_image_path = OUTPUTS_DIR / f"{exec_id}.png"
                    shutil.copy2(workspace_output_png, persistent_image_path)
                    saved_image_path = str(persistent_image_path)

                    # Generate base64 data URL for fast direct client embedding
                    with open(persistent_image_path, "rb") as img_f:
                        b64_str = base64.b64encode(img_f.read()).decode("utf-8")
                        base64_image = f"data:image/png;base64,{b64_str}"

            else:
                success = False
                error_message = stderr_output.strip() or "No output chart was produced by the execution script."
                error_message = error_message.replace(str(workspace_dir), "").replace(str(SANDBOX_BASE_DIR), "")

        except subprocess.TimeoutExpired:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            success = False
            error_message = "Execution timed out (limit: 12 seconds). Optimization required."

        except Exception as e:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            success = False
            error_message = f"Sandbox execution error: {str(e)}"

        finally:
            # 5. Clean up temporary workspace directory
            try:
                if workspace_dir.exists():
                    shutil.rmtree(workspace_dir, ignore_errors=True)
            except Exception:
                pass

        return {
            "success": success,
            "execution_id": exec_id,
            "execution_time_ms": elapsed_ms,
            "html": interactive_html,
            "spec": chart_spec,
            "image_url": f"/api/v1/visualizations/output/{exec_id}" if saved_image_path else None,
            "base64_image": base64_image,
            "stdout": stdout_output,
            "stderr": stderr_output,
            "error": error_message
        }
