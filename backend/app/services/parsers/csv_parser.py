import csv
from pathlib import Path
import pandas as pd
from app.services.parsers.base_parser import BaseParser

class CSVParser(BaseParser):
    def detect_delimiter_and_encoding(self, file_path: str) -> tuple[str, str]:
        encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252", "iso-8859-1"]
        delimiters = [",", "\t", ";", "|"]
        
        selected_encoding = "utf-8"
        selected_delimiter = ","
        
        # Try reading first bytes with different encodings
        for enc in encodings:
            try:
                with open(file_path, "r", encoding=enc, errors="strict") as f:
                    sample = f.read(8192)
                    selected_encoding = enc
                    
                    # Try sniffer
                    try:
                        sniffer = csv.Sniffer()
                        dialect = sniffer.sniff(sample, delimiters=delimiters)
                        selected_delimiter = dialect.delimiter
                    except Exception:
                        # Fallback counting
                        counts = {d: sample.count(d) for d in delimiters}
                        selected_delimiter = max(counts, key=counts.get) if max(counts.values()) > 0 else ","
                    break
            except (UnicodeDecodeError, Exception):
                continue
                
        return selected_delimiter, selected_encoding

    def parse_to_dataframe(self, file_path: str) -> pd.DataFrame:
        delimiter, encoding = self.detect_delimiter_and_encoding(file_path)
        try:
            df = pd.read_csv(
                file_path,
                delimiter=delimiter,
                encoding=encoding,
                on_bad_lines="skip",
                low_memory=False
            )
            # Strip column whitespace
            df.columns = [str(c).strip() for c in df.columns]
            return df
        except Exception as e:
            # Fallback with python engine
            df = pd.read_csv(
                file_path,
                sep=None,
                engine="python",
                encoding=encoding,
                on_bad_lines="skip"
            )
            df.columns = [str(c).strip() for c in df.columns]
            return df
