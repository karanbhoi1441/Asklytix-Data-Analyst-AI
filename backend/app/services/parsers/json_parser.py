import json
import pandas as pd
from app.services.parsers.base_parser import BaseParser

class JSONParser(BaseParser):
    def parse_to_dataframe(self, file_path: str) -> pd.DataFrame:
        try:
            # Try json lines first or regular json
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            try:
                data = json.loads(content)
                if isinstance(data, list):
                    df = pd.json_normalize(data)
                elif isinstance(data, dict):
                    # Check if data contains a records key or list of rows
                    for key in ["data", "records", "rows", "items", "results"]:
                        if key in data and isinstance(data[key], list):
                            df = pd.json_normalize(data[key])
                            break
                    else:
                        df = pd.json_normalize([data])
                else:
                    raise ValueError("JSON must contain an array or object of records.")
            except json.JSONDecodeError:
                # Try JSONLines
                df = pd.read_json(file_path, lines=True)

            df.columns = [str(c).strip() for c in df.columns]
            return df
        except Exception as e:
            raise ValueError(f"Failed to parse JSON file: {str(e)}")
