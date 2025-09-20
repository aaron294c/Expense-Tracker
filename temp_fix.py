# Simple fix - replace the problematic line
import re

# Read the file
with open('agents/orchestrator.py', 'r') as f:
    content = f.read()

# Replace the problematic line with a safe version
old_line = 'if "decision" in data and data["decision"] in {'
new_lines = '''if data is not None and "decision" in data and data["decision"] in {'''

content = content.replace(old_line, new_lines)

# Write back
with open('agents/orchestrator.py', 'w') as f:
    f.write(content)

print("Fixed the None check issue")
