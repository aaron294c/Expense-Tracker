import re

# Read the orchestrator
with open('/workspaces/Expense-Tracker/agents/orchestrator.py', 'r') as f:
    content = f.read()

# The problem is in our natural language fallback - it's overriding valid JSON
# Let's make it only activate when JSON parsing truly fails

# Find the fallback section and make it less aggressive
old_fallback = '''        # Enhanced fallback: try to infer intent from natural language
        if self.debug:
            print(f"⚠️  No valid JSON found. Trying natural language fallback...")
            print(f"Response preview: {worker_output[:300]}...")
        
        # Look for action keywords to infer intent
        if any(word in worker_output.lower() for word in ['plan', 'analyze', 'examine', 'review']):
            decision = "PLAN"
        elif any(word in worker_output.lower() for word in ['edit', 'modify', 'write', 'create', 'update']):
            decision = "EDIT"
        elif any(word in worker_output.lower() for word in ['run', 'execute', 'command', 'install']):
            decision = "EXECUTE"
        elif any(word in worker_output.lower() for word in ['test', 'check', 'verify']):
            decision = "TEST"
        else:
            decision = "PLAN"  # Default to planning
        
        # Extract meaningful lines as plan items
        lines = [line.strip() for line in worker_output.split('\\n') if line.strip() and len(line.strip()) > 10]
        plan_items = lines[:3] if lines else ["Continue with the requested task"]
        
        return {
            "decision": decision,
            "plan": plan_items,
            "commands": [],
            "commit": {"message": "Auto-generated from natural language", "files": []},
            "pr": {"title": "Auto-generated", "body": ""},
            "reason": f"Natural language fallback - inferred {decision}"
        }'''

new_fallback = '''        # Last resort fallback - only if absolutely no JSON found
        if self.debug:
            print(f"⚠️  No valid JSON found. Using minimal fallback...")
            print(f"Response preview: {worker_output[:300]}...")
        
        # Default to PLAN to let Claude try again
        return {
            "decision": "PLAN",
            "plan": ["Continue with the requested task", "Try to provide clearer JSON format"],
            "commands": [],
            "commit": {"message": "Auto-generated", "files": []},
            "pr": {"title": "Auto-generated", "body": ""},
            "reason": "Fallback - no valid JSON found"
        }'''

# Replace the fallback
new_content = content.replace(old_fallback, new_fallback)

# Write the fixed file
with open('/workspaces/Expense-Tracker/agents/orchestrator.py', 'w') as f:
    f.write(new_content)

print("✅ Fixed overly aggressive natural language fallback")
