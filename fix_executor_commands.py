import re

# Read the executor
with open('/workspaces/Expense-Tracker/agents/skills/executor.py', 'r') as f:
    content = f.read()

# Find the allowed_commands dictionary and add missing commands
pattern = r'(self\.allowed_commands = \{.*?"git": \[.*?\])(.*?)(\s*\})'

replacement = r'''\1,
            "ls": ["-la", "-l", "-a", ".", "components", "pages", "app", "hooks", "lib"],
            "cat": ["components", "pages", "app", "hooks", "lib", "README.md", "package.json"],
            "head": ["-n", "50", "100", "components", "pages", "app"],
            "find": [".", "-name", "-type", "f", "d"],
            "pwd": [],
            "tree": ["-L", "2", "3", "."],
            "grep": ["-n", "-r", "--include", "components", "pages", "app", "hooks"]\3'''

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Write the fixed file
with open('/workspaces/Expense-Tracker/agents/skills/executor.py', 'w') as f:
    f.write(new_content)

print("✅ Added missing commands to executor")
