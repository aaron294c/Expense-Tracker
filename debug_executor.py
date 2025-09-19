import re

# Read the executor
with open('/workspaces/Expense-Tracker/agents/skills/executor.py', 'r') as f:
    content = f.read()

# Add debug logging to run_command method
old_run_command = '''    def run_command(self, command: str, working_dir: str = None) -> Dict[str, Any]:
        cmd_parts = command.strip().split()
        if not cmd_parts:
            return self._error_result("Empty command")
        
        cmd_name = cmd_parts[0]
        cmd_args = cmd_parts[1:]
        
        if not self._is_command_allowed(cmd_name, cmd_args):
            return self._error_result(f"Command '{command}' not allowed")'''

new_run_command = '''    def run_command(self, command: str, working_dir: str = None) -> Dict[str, Any]:
        print(f"🐛 EXECUTOR DEBUG: run_command called with: '{command}'")
        cmd_parts = command.strip().split()
        if not cmd_parts:
            print(f"🐛 EXECUTOR DEBUG: Empty command")
            return self._error_result("Empty command")
        
        cmd_name = cmd_parts[0]
        cmd_args = cmd_parts[1:]
        print(f"🐛 EXECUTOR DEBUG: cmd_name='{cmd_name}', cmd_args={cmd_args}")
        
        is_allowed = self._is_command_allowed(cmd_name, cmd_args)
        print(f"🐛 EXECUTOR DEBUG: _is_command_allowed returned: {is_allowed}")
        
        if not is_allowed:
            print(f"🐛 EXECUTOR DEBUG: Command not allowed: '{command}'")
            return self._error_result(f"Command '{command}' not allowed")'''

# Replace the method start
new_content = content.replace(old_run_command, new_run_command)

# Write the debug version
with open('/workspaces/Expense-Tracker/agents/skills/executor.py', 'w') as f:
    f.write(new_content)

print("✅ Added debug logging to executor")
