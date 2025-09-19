# Read the current file
with open('/workspaces/Expense-Tracker/agents/orchestrator.py', 'r') as f:
    lines = f.readlines()

# Find and replace the _is_allowed_command method
new_lines = []
in_method = False
method_replaced = False

for line in lines:
    if '_is_allowed_command(self, command: str) -> bool:' in line:
        in_method = True
        new_lines.append(line)
        new_lines.append('        allowed = [\n')
        new_lines.append('            r"^npm\\b.*", r"^yarn\\b.*", r"^pnpm\\b.*",\n')
        new_lines.append('            r"^supabase\\b.*", r"^eslint\\b.*", r"^tsc\\b.*",\n')
        new_lines.append('            r"^pytest\\b.*", r"^vitest\\b.*", r"^jest\\b.*",\n')
        new_lines.append('            r"^ls\\b.*", r"^cat\\b.*", r"^head\\b.*", r"^find\\b.*",\n')
        new_lines.append('            r"^pwd$", r"^tree\\b.*", r"^wc\\b.*", r"^grep\\b.*"\n')
        new_lines.append('        ]\n')
        method_replaced = True
        continue
    elif in_method and ('def ' in line or line.strip() == '' and 'def ' in lines[lines.index(line)+1:lines.index(line)+3]):
        in_method = False
        new_lines.append(line)
    elif in_method and 'allowed = [' in line:
        continue  # skip old allowed list
    elif in_method and line.strip().startswith('r"'):
        continue  # skip old patterns
    elif in_method and line.strip() == ']':
        continue  # skip old closing bracket
    elif in_method and 'for pat in allowed:' in line:
        new_lines.append('        for pat in allowed:\n')
        in_method = False
    else:
        new_lines.append(line)

# Write the fixed file
with open('/workspaces/Expense-Tracker/agents/orchestrator.py', 'w') as f:
    f.writelines(new_lines)

print("✅ Fixed orchestrator with correct patterns")
