import re

# Read the orchestrator
with open('/workspaces/Expense-Tracker/agents/orchestrator.py', 'r') as f:
    content = f.read()

# Find and replace the _is_allowed_command method
old_allowed = '''    def _is_allowed_command(self, command: str) -> bool:
        allowed = [
            r"^npm\b.*", r"^yarn\b.*", r"^pnpm\b.*",
            r"^supabase\b.*", r"^eslint\b.*", r"^tsc\b.*",
            r"^pytest\b.*", r"^vitest\b.*", r"^jest\b.*"
        ]
        for pat in allowed:
            if re.match(pat, command):
                return True
        return False'''

new_allowed = '''    def _is_allowed_command(self, command: str) -> bool:
        allowed = [
            r"^npm\b.*", r"^yarn\b.*", r"^pnpm\b.*",
            r"^supabase\b.*", r"^eslint\b.*", r"^tsc\b.*",
            r"^pytest\b.*", r"^vitest\b.*", r"^jest\b.*",
            r"^ls\b.*", r"^cat\b.*", r"^head\b.*", r"^find\b.*",
            r"^pwd$", r"^tree\b.*", r"^wc\b.*", r"^grep\b.*"
        ]
        for pat in allowed:
            if re.match(pat, command):
                return True
        return False'''

# Replace the method
new_content = content.replace(old_allowed, new_allowed)

# Write the fixed file  
with open('/workspaces/Expense-Tracker/agents/orchestrator.py', 'w') as f:
    f.write(new_content)

print("✅ Added basic file commands to orchestrator's allowed commands")
