import subprocess
import re
from pathlib import Path
from typing import Dict, List, Any

class GitOps:
    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path)
    
    def get_current_branch(self) -> str:
        try:
            result = subprocess.run(
                ["git", "branch", "--show-current"],
                capture_output=True,
                text=True,
                cwd=self.repo_path
            )
            return result.stdout.strip()
        except Exception:
            return "main"
    
    def create_branch(self, branch_name: str) -> Dict[str, Any]:
        try:
            clean_name = self._clean_branch_name(branch_name)
            
            result = subprocess.run(
                ["git", "checkout", "-b", clean_name],
                capture_output=True,
                text=True,
                cwd=self.repo_path
            )
            
            if result.returncode == 0:
                return {
                    "success": True,
                    "branch_name": clean_name,
                    "message": f"Created branch '{clean_name}'"
                }
            else:
                return {"success": False, "error": result.stderr}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def commit_changes(self, message: str, files: List[str] = None) -> Dict[str, Any]:
        try:
            # Add files
            if files:
                subprocess.run(["git", "add"] + files, cwd=self.repo_path)
            else:
                subprocess.run(["git", "add", "."], cwd=self.repo_path)
            
            # Commit
            result = subprocess.run(
                ["git", "commit", "-m", message],
                capture_output=True,
                text=True,
                cwd=self.repo_path
            )
            
            return {
                "success": result.returncode == 0,
                "message": message,
                "output": result.stdout
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def create_pr(self, title: str, body: str) -> Dict[str, Any]:
        try:
            current_branch = self.get_current_branch()
            
            # Push branch
            subprocess.run(
                ["git", "push", "-u", "origin", current_branch],
                cwd=self.repo_path
            )
            
            # Create PR with GitHub CLI
            result = subprocess.run([
                "gh", "pr", "create",
                "--title", title,
                "--body", body,
                "--head", current_branch
            ], capture_output=True, text=True, cwd=self.repo_path)
            
            if result.returncode == 0:
                return {
                    "success": True,
                    "pr_url": result.stdout.strip(),
                    "title": title,
                    "branch": current_branch
                }
            else:
                return {"success": False, "error": result.stderr}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _clean_branch_name(self, name: str) -> str:
        clean = re.sub(r'[^\w\-/]', '-', name.lower())
        clean = re.sub(r'-+', '-', clean).strip('-')
        if len(clean) > 50:
            clean = clean[:50].rstrip('-')
        if not clean.startswith(('feature/', 'fix/', 'refactor/', 'chore/')):
            clean = f"feature/{clean}"
        return clean
