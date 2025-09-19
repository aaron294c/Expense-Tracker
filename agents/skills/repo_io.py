import os
import re
from pathlib import Path
from typing import Dict, List, Any, Optional

class RepoInterface:
    def __init__(self, root_path: str = "."):
        self.root_path = Path(root_path).resolve()
    
    def get_repo_structure(self, max_depth: int = 3) -> str:
        lines = []
        
        def add_tree_line(path: Path, level: int):
            if level > max_depth:
                return
            
            name = path.name
            if name.startswith('.') and name not in ['.gitignore', '.env.example']:
                return
            
            skip_dirs = {'node_modules', '__pycache__', '.git', 'dist', 'build', '.next'}
            if path.is_dir() and name in skip_dirs:
                return
            
            indent = "  " * level
            if path.is_dir():
                lines.append(f"{indent}{name}/")
                try:
                    children = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
                    for child in children:
                        add_tree_line(child, level + 1)
                except PermissionError:
                    pass
            else:
                lines.append(f"{indent}{name}")
        
        add_tree_line(self.root_path, 0)
        return "\n".join(lines[:100])
    
    def read_file(self, file_path: str) -> Optional[str]:
        try:
            full_path = self._resolve_path(file_path)
            if not self._is_safe_path(full_path):
                raise ValueError(f"Unsafe file path: {file_path}")
            
            if not full_path.exists():
                return None
            
            with open(full_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            return "[Binary file]"
        except Exception as e:
            raise ValueError(f"Error reading {file_path}: {str(e)}")
    
    def write_file(self, file_path: str, content: str) -> Dict[str, Any]:
        full_path = self._resolve_path(file_path)
        if not self._is_safe_path(full_path):
            raise ValueError(f"Unsafe file path: {file_path}")
        
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        existed_before = full_path.exists()
        old_content = ""
        if existed_before:
            old_content = self.read_file(file_path) or ""
        
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        lines_added = len(content.split('\n'))
        lines_removed = len(old_content.split('\n')) if existed_before else 0
        
        return {
            "action": "updated" if existed_before else "created",
            "lines_added": lines_added,
            "lines_removed": lines_removed,
            "path": str(file_path)
        }
    
    def apply_patch(self, file_path: str, patch_content: str) -> Dict[str, Any]:
        full_path = self._resolve_path(file_path)
        if not self._is_safe_path(full_path):
            raise ValueError(f"Unsafe file path: {file_path}")
        
        current_content = ""
        if full_path.exists():
            current_content = self.read_file(file_path) or ""
        
        # Simple patch application - treat as full file content for now
        self.write_file(file_path, patch_content)
        return {
            "method": "full_replacement",
            "changed_lines": len(patch_content.split('\n')),
            "diff_summary": f"Replaced file with {len(patch_content)} characters"
        }
    
    def _resolve_path(self, file_path: str) -> Path:
        if os.path.isabs(file_path):
            return Path(file_path)
        else:
            return (self.root_path / file_path).resolve()
    
    def _is_safe_path(self, path: Path) -> bool:
        try:
            path.resolve().relative_to(self.root_path)
            path_str = str(path)
            dangerous_patterns = [r'/\.env$', r'/\.git/', r'/node_modules/', r'/__pycache__/']
            for pattern in dangerous_patterns:
                if re.search(pattern, path_str):
                    return False
            return True
        except ValueError:
            return False
