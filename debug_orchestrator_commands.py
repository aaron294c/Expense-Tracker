import re

# Read the orchestrator
with open('/workspaces/Expense-Tracker/agents/orchestrator.py', 'r') as f:
    content = f.read()

# Add detailed debug logging to _handle_execute_commands
old_handle = '''    def _handle_execute_commands(self, commands: List[Dict[str, Any]]) -> Dict[str, Any]:
        if self.debug:
            print(f"🐛 DEBUG: _handle_execute_commands called with {len(commands)} commands")
            for i, cmd in enumerate(commands):
                print(f"🐛 DEBUG: Command {i}: {cmd}")
        results = []
        for cmd in commands:
            if "run" in cmd:
                command = cmd["run"]
                if self._is_allowed_command(command):
                    try:
                        exec_result = self.executor.run_command(command)
                        results.append({
                            "command": command,
                            "success": exec_result["returncode"] == 0,
                            "stdout": exec_result["stdout"],
                            "stderr": exec_result["stderr"],
                            "returncode": exec_result["returncode"]
                        })
                    except Exception as e:
                        results.append({"command": command, "success": False, "error": str(e)})
                else:
                    results.append({"command": command, "success": False, "error": f"Command not allowed: {command}"})
        return {"success": True, "results": results}'''

new_handle = '''    def _handle_execute_commands(self, commands: List[Dict[str, Any]]) -> Dict[str, Any]:
        if self.debug:
            print(f"🐛 DEBUG: _handle_execute_commands called with {len(commands)} commands")
            for i, cmd in enumerate(commands):
                print(f"🐛 DEBUG: Command {i}: {cmd}")
        results = []
        for cmd in commands:
            if self.debug:
                print(f"🐛 DEBUG: Processing command: {cmd}")
            if "run" in cmd:
                command = cmd["run"]
                if self.debug:
                    print(f"🐛 DEBUG: Extracted command string: '{command}'")
                is_allowed = self._is_allowed_command(command)
                if self.debug:
                    print(f"🐛 DEBUG: _is_allowed_command('{command}') returned: {is_allowed}")
                if is_allowed:
                    if self.debug:
                        print(f"🐛 DEBUG: About to call self.executor.run_command('{command}')")
                    try:
                        exec_result = self.executor.run_command(command)
                        if self.debug:
                            print(f"🐛 DEBUG: executor.run_command returned: {exec_result}")
                        results.append({
                            "command": command,
                            "success": exec_result["returncode"] == 0,
                            "stdout": exec_result["stdout"],
                            "stderr": exec_result["stderr"],
                            "returncode": exec_result["returncode"]
                        })
                    except Exception as e:
                        if self.debug:
                            print(f"🐛 DEBUG: Exception calling executor: {e}")
                        results.append({"command": command, "success": False, "error": str(e)})
                else:
                    if self.debug:
                        print(f"🐛 DEBUG: Command rejected by orchestrator validation")
                    results.append({"command": command, "success": False, "error": f"Command not allowed: {command}"})
            else:
                if self.debug:
                    print(f"🐛 DEBUG: Command missing 'run' key: {cmd}")
        if self.debug:
            print(f"🐛 DEBUG: _handle_execute_commands returning {len(results)} results")
        return {"success": True, "results": results}'''

# Replace the method
new_content = content.replace(old_handle, new_handle)

# Write the debug version
with open('/workspaces/Expense-Tracker/agents/orchestrator.py', 'w') as f:
    f.write(new_content)

print("✅ Added detailed debug logging to orchestrator command handling")
