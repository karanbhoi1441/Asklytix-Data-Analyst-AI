import pandas as pd
from app.services.parsers.base_parser import BaseParser

class ExcelParser(BaseParser):
    def parse_to_dataframe(self, file_path: str) -> pd.DataFrame:
        # Supports .xlsx and .xls
        try:
            excel_file = pd.ExcelFile(file_path)
            sheet_name = excel_file.sheet_names[0]
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            df.columns = [str(c).strip() for c in df.columns]
            return df
        except Exception as e:
            raise ValueError(f"Failed to parse Excel file: {str(e)}")
