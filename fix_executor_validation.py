import re

# Read the current executor
with open('/workspaces/Expense-Tracker/agents/skills/executor.py', 'r') as f:
    content = f.read()

# Find the _is_command_allowed method and make it more permissive
old_method = '''    def _is_command_allowed(self, cmd_name: str, cmd_args: List[str]) -> bool:
        if cmd_name not in self.allowed_commands:
            return False
        
        allowed_args = self.allowed_commands[cmd_name]
        for arg in cmd_args:
            if arg.startswith('-'):
                continue
            if arg in allowed_args:
                continue
            if self._is_safe_path_arg(arg):
                continue
            return False
        
        return True'''

new_method = '''    def _is_command_allowed(self, cmd_name: str, cmd_args: List[str]) -> bool:
        if cmd_name not in self.allowed_commands:
            return False
        
        # More permissive validation for basic file commands
        if cmd_name in ['ls', 'cat', 'head', 'find', 'pwd', 'tree']:
            # Allow any safe file paths for these commands
            for arg in cmd_args:
                if arg.startswith('-'):
                    continue
                if self._is_safe_path_arg(arg):
                    continue
                # Also allow common directories and file extensions
                if any(allowed in arg for allowed in ['components/', 'pages/', 'app/', 'hooks/', 'lib/', '.tsx', '.ts', '.js', '.json', '.md']):
                    continue
                return False
            return True
        
        # Original strict validation for other commands
        allowed_args = self.allowed_commands[cmd_name]
        for arg in cmd_args:
            if arg.startswith('-'):
                continue
            if arg in allowed_args:
                continue
            if self._is_safe_path_arg(arg):
                continue
            return False
        
        return True'''

# Replace the method
if old_method in content:
    new_content = content.replace(old_method, new_method)
    with open('/workspaces/Expense-Tracker/agents/skills/executor.py', 'w') as f:
        f.write(new_content)
    print("✅ Made executor validation more permissive for file commands")
else:
    print("❌ Could not find the exact method to replace")
    
# Add _is_safe_path_arg method if it doesn't exist
if '_is_safe_path_arg' not in content:
    safe_path_method = '''
    def _is_safe_path_arg(self, path_arg: str) -> bool:
        """Check if a path argument is safe to use"""
        # Block dangerous patterns
        dangerous = ['../', '../', '~/', '/etc/', '/usr/', '/var/', '/root/']
        if any(danger in path_arg for danger in dangerous):
            return False
        
        # Allow project-relative paths
        safe_patterns = ['components/', 'pages/', 'app/', 'hooks/', 'lib/', 'styles/', 'public/']
        if any(pattern in path_arg for pattern in safe_patterns):
            return True
            
        # Allow common files
        safe_files = ['package.json', 'README.md', 'tsconfig.json', '.env.example']
        if path_arg in safe_files:
            return True
            
        # Allow files with safe extensions in current directory
        if '/' not in path_arg and any(path_arg.endswith(ext) for ext in ['.tsx', '.ts', '.js', '.json', '.md']):
            return True
            
        return False
'''
    
    # Add the method before the last method
    content_with_method = content.replace('    def _error_result', safe_path_method + '\n    def _error_result')
    with open('/workspaces/Expense-Tracker/agents/skills/executor.py', 'w') as f:
        f.write(content_with_method)
    print("✅ Added _is_safe_path_arg method")
