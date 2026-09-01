from typing import Tuple, List, Dict, Any
from app.core.sandbox_security import validate_python_code_security


class CodeValidationService:
    @classmethod
    def validate_code(cls, code: str, required_columns: List[str] = None, dataset_columns: List[str] = None) -> Dict[str, Any]:
        """
        Validates Python visualization code for syntax, AST safety, and column existence.
        """
        if not code or not code.strip():
            return {
                "valid": False,
                "errors": ["No code provided for execution."]
            }

        # 1. AST Security and Syntax Validation
        is_safe, security_errors = validate_python_code_security(code)
        if not is_safe:
            return {
                "valid": False,
                "errors": security_errors
            }

        # 2. Schema Column Validation (if provided)
        if required_columns and dataset_columns:
            ds_cols_lower = [c.lower() for c in dataset_columns]
            missing_cols = [c for c in required_columns if c.lower() not in ds_cols_lower]
            if missing_cols:
                return {
                    "valid": False,
                    "errors": [f"Code references missing columns: {', '.join(missing_cols)}."]
                }

        return {
            "valid": True,
            "errors": []
        }
