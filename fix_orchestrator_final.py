import re

# Read the orchestrator
with open('/workspaces/Expense-Tracker/agents/orchestrator.py', 'r') as f:
    content = f.read()

# Replace the allowed list with file commands included
old_list = '''        allowed = [
            r"^npm\b.*", r"^yarn\b.*", r"^pnpm\b.*",
            r"^supabase\b.*", r"^eslint\b.*", r"^tsc\b.*",
            r"^pytest\b.*", r"^vitest\b.*", r"^jest\b.*"
        ]'''

new_list = '''        allowed = [
            r"^npm\b.*", r"^yarn\b.*", r"^pnpm\b.*",
            r"^supabase\b.*", r"^eslint\b.*", r"^tsc\b.*",
            r"^pytest\b.*", r"^vitest\b.*", r"^jest\b.*",
            r"^ls\b.*", r"^cat\b.*", r"^head\b.*", r"^find\b.*",
            r"^pwd$", r"^tree\b.*", r"^wc\b.*", r"^grep\b.*"
        ]'''

# Replace the list
new_content = content.replace(old_list, new_list)

# Write the fixed file
with open('/workspaces/Expense-Tracker/agents/orchestrator.py', 'w') as f:
    f.write(new_content)

print("✅ Actually added file commands to orchestrator this time!")
