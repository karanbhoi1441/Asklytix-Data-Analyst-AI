import pandas as pd
import pyarrow.parquet as pq
from app.services.parsers.base_parser import BaseParser

class ParquetParser(BaseParser):
    def parse_to_dataframe(self, file_path: str) -> pd.DataFrame:
        try:
            # Read via PyArrow Table then convert to pandas
            table = pq.read_table(file_path)
            df = table.to_pandas()
            df.columns = [str(c).strip() for c in df.columns]
            return df
        except Exception as e:
            try:
                # Fallback to pandas read_parquet directly
                df = pd.read_parquet(file_path)
                df.columns = [str(c).strip() for c in df.columns]
                return df
            except Exception as e2:
                raise ValueError(f"Failed to parse binary Parquet file: {str(e2)}")
