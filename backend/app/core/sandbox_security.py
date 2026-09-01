import ast
from typing import List, Tuple, Set

FORBIDDEN_MODULES: Set[str] = {
    "os", "sys", "subprocess", "shutil", "socket", "requests", "httpx", "urllib",
    "urllib3", "aiohttp", "pty", "posix", "nt", "pickle", "shelve", "marshal",
    "ctypes", "threading", "multiprocessing", "gc", "importlib", "builtins",
    "webbrowser", "tempfile", "platform", "signal", "inspect"
}

ALLOWED_MODULES: Set[str] = {
    "pandas", "pd",
    "numpy", "np",
    "matplotlib", "matplotlib.pyplot", "plt",
    "plotly", "plotly.express", "px", "plotly.graph_objects", "go", "plotly.io", "pio",
    "seaborn", "sns",
    "scipy", "statsmodels",
    "math", "datetime", "dateutil",
    "collections", "itertools", "json", "re"
}

FORBIDDEN_CALLS: Set[str] = {
    "eval", "exec", "compile", "__import__", "globals", "locals",
    "getattr", "setattr", "delattr", "vars", "breakpoint",
    "exit", "quit", "input", "system"
}

FORBIDDEN_ATTRIBUTES: Set[str] = {
    "__code__", "__subclasses__", "__bases__", "__globals__",
    "__dict__", "__class__", "__builtins__", "__import__"
}


class SecurityASTVisitor(ast.NodeVisitor):
    def __init__(self):
        self.errors: List[str] = []

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            mod_name = alias.name.split('.')[0]
            if mod_name in FORBIDDEN_MODULES:
                self.errors.append(f"Forbidden module import: '{alias.name}'")
            elif mod_name not in ALLOWED_MODULES and alias.name not in ALLOWED_MODULES:
                self.errors.append(f"Disallowed module import: '{alias.name}'. Only visualization libraries (pandas, numpy, matplotlib) are permitted.")
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        if node.module:
            mod_name = node.module.split('.')[0]
            if mod_name in FORBIDDEN_MODULES:
                self.errors.append(f"Forbidden module import from '{node.module}'")
            elif mod_name not in ALLOWED_MODULES and node.module not in ALLOWED_MODULES:
                self.errors.append(f"Disallowed module import from '{node.module}'.")
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call):
        # Direct function calls (e.g., eval("..."), exec("..."))
        if isinstance(node.func, ast.Name):
            if node.func.id in FORBIDDEN_CALLS:
                self.errors.append(f"Forbidden function call: '{node.func.id}()'")
        # Method calls on forbidden attributes
        elif isinstance(node.func, ast.Attribute):
            if node.func.attr in FORBIDDEN_CALLS or node.func.attr in FORBIDDEN_ATTRIBUTES:
                self.errors.append(f"Forbidden method call: '.{node.func.attr}()'")
        self.generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute):
        if node.attr in FORBIDDEN_ATTRIBUTES:
            self.errors.append(f"Forbidden access to internal attribute: '{node.attr}'")
        self.generic_visit(node)


def validate_python_code_security(code_str: str) -> Tuple[bool, List[str]]:
    """
    Parses Python code and checks it against AST security rules.
    Returns (is_safe, error_messages).
    """
    try:
        tree = ast.parse(code_str)
    except SyntaxError as e:
        return False, [f"Syntax error at line {e.lineno}: {e.msg}"]
    except Exception as e:
        return False, [f"Code parsing failed: {str(e)}"]

    visitor = SecurityASTVisitor()
    visitor.visit(tree)

    if visitor.errors:
        return False, visitor.errors

    return True, []
