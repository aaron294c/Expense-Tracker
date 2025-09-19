import os
from pathlib import Path
from typing import Dict, Any
from datetime import datetime
import re

class SupabaseHelper:
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root)
        self.migrations_dir = self.project_root / "supabase" / "migrations"
        self.migrations_dir.mkdir(parents=True, exist_ok=True)
    
    def create_migration(self, description: str, sql_content: str) -> Dict[str, Any]:
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        clean_desc = re.sub(r'[^a-zA-Z0-9_]', '_', description.lower())
        clean_desc = re.sub(r'_+', '_', clean_desc).strip('_')
        
        filename = f"{timestamp}__{clean_desc}.sql"
        migration_path = self.migrations_dir / filename
        
        migration_content = f"""-- Migration: {description}
-- Created: {datetime.now().isoformat()}
-- Timestamp: {timestamp}

{sql_content.strip()}

-- End of migration: {description}
"""
        
        try:
            with open(migration_path, 'w', encoding='utf-8') as f:
                f.write(migration_content)
            
            print(f"📝 Created migration: {filename}")
            
            return {
                "success": True,
                "filename": filename,
                "path": str(migration_path),
                "description": description,
                "timestamp": timestamp
            }
        except Exception as e:
            return {"success": False, "error": f"Failed to create migration: {str(e)}"}
    
    def validate_sql(self, sql_content: str) -> Dict[str, Any]:
        issues = []
        warnings = []
        
        dangerous_patterns = [
            (r'DROP\s+DATABASE', "DROP DATABASE is not allowed"),
            (r'DELETE\s+FROM\s+[^;]*(?:WHERE|$)', "DELETE without WHERE clause"),
        ]
        
        sql_upper = sql_content.upper()
        
        for pattern, message in dangerous_patterns:
            if re.search(pattern, sql_upper):
                issues.append(message)
        
        if 'CREATE TABLE' in sql_upper and 'IF NOT EXISTS' not in sql_upper:
            warnings.append("Consider using 'IF NOT EXISTS' for CREATE TABLE")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "warnings": warnings,
            "sql_length": len(sql_content)
        }
