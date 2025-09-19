import re

# Read the orchestrator
with open('/workspaces/Expense-Tracker/agents/orchestrator.py', 'r') as f:
    content = f.read()

# Add debug logging to _handle_execute_commands
old_method = '''    def _handle_execute_commands(self, commands: List[Dict[str, Any]]) -> Dict[str, Any]:
        results = []
        for cmd in commands:'''

new_method = '''    def _handle_execute_commands(self, commands: List[Dict[str, Any]]) -> Dict[str, Any]:
        if self.debug:
            print(f"🐛 DEBUG: _handle_execute_commands called with {len(commands)} commands")
            for i, cmd in enumerate(commands):
                print(f"🐛 DEBUG: Command {i}: {cmd}")
        results = []
        for cmd in commands:'''

# Replace the method
new_content = content.replace(old_method, new_method)

# Also add debug to _execute_decision to see what decision is being processed
old_execute = '''    def _execute_decision(self, control_data: Dict[str, Any]) -> Dict[str, Any]:
        decision = control_data.get("decision")
        commands = control_data.get("commands", [])
        result: Dict[str, Any] = {"decision": decision, "outputs": []}'''

new_execute = '''    def _execute_decision(self, control_data: Dict[str, Any]) -> Dict[str, Any]:
        decision = control_data.get("decision")
        commands = control_data.get("commands", [])
        if self.debug:
            print(f"🐛 DEBUG: _execute_decision called with decision='{decision}', {len(commands)} commands")
        result: Dict[str, Any] = {"decision": decision, "outputs": []}'''

new_content = new_content.replace(old_execute, new_execute)

# Write the debug version
with open('/workspaces/Expense-Tracker/agents/orchestrator.py', 'w') as f:
    f.write(new_content)

print("✅ Added debug logging to orchestrator")
