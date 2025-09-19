import re

# Read the executor file
with open('/workspaces/Expense-Tracker/agents/skills/executor.py', 'r') as f:
    content = f.read()

# Find the allowed_commands section and add basic file commands
old_commands = '''        self.allowed_commands = {
            "npm": ["install", "run", "test", "build", "start", "lint", "typecheck"],
            "yarn": ["install", "run", "test", "build", "start", "lint", "typecheck"],
            "pnpm": ["install", "run", "test", "build", "start", "lint", "typecheck"],
            "eslint": [".", "--ext", "--fix", "--cache"],
            "tsc": ["--noEmit", "--project", "."],
            "supabase": ["db", "reset", "lint", "status", "migration"],
            "git": ["status", "diff", "log", "branch", "show"]
        }'''

new_commands = '''        self.allowed_commands = {
            "npm": ["install", "run", "test", "build", "start", "lint", "typecheck"],
            "yarn": ["install", "run", "test", "build", "start", "lint", "typecheck"],
            "pnpm": ["install", "run", "test", "build", "start", "lint", "typecheck"],
            "eslint": [".", "--ext", "--fix", "--cache"],
            "tsc": ["--noEmit", "--project", "."],
            "supabase": ["db", "reset", "lint", "status", "migration"],
            "git": ["status", "diff", "log", "branch", "show"],
            "ls": ["-la", "-l", "-a", ".", "components", "pages", "app", "hooks", "lib"],
            "cat": ["components", "pages", "app", "hooks", "lib", "README.md", "package.json"],
            "head": ["-n", "50", "100", "components", "pages", "app"],
            "find": [".", "-name", "-type", "f", "d"],
            "pwd": [],
            "tree": ["-L", "2", "3", "."]
        }'''

# Replace the allowed commands
new_content = content.replace(old_commands, new_commands)

# Write the fixed file
with open('/workspaces/Expense-Tracker/agents/skills/executor.py', 'w') as f:
    f.write(new_content)

print("✅ Added basic file commands to executor")
