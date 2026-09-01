from pathlib import Path
from typing import Dict, Type
from app.services.parsers.base_parser import BaseParser
from app.services.parsers.csv_parser import CSVParser
from app.services.parsers.excel_parser import ExcelParser
from app.services.parsers.json_parser import JSONParser
from app.services.parsers.parquet_parser import ParquetParser

class ParserFactory:
    _parsers: Dict[str, Type[BaseParser]] = {
        "csv": CSVParser,
        "xlsx": ExcelParser,
        "xls": ExcelParser,
        "json": JSONParser,
        "parquet": ParquetParser,
    }

    @classmethod
    def get_parser(cls, filename_or_format: str) -> BaseParser:
        ext = filename_or_format.split(".")[-1].lower() if "." in filename_or_format else filename_or_format.lower()
        parser_cls = cls._parsers.get(ext)
        if not parser_cls:
            raise ValueError(f"Unsupported file format: '.{ext}'. Supported formats: CSV, XLSX, XLS, JSON, PARQUET.")
        return parser_cls()
