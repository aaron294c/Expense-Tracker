import re

# Read the original file
with open('/workspaces/Expense-Tracker/agents/orchestrator.py', 'r') as f:
    content = f.read()

# Find the line that returns the failure case and replace it
old_return = '''        # If nothing parsed, nudge the loop forward with STOP (no progress)
        return {"decision": "STOP", "reason": "Failed to parse control protocol", "commands": [], "next_hint": "Check AI response format"}'''

new_return = '''        # Enhanced fallback: try to infer intent from natural language
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

# Replace the return statement
new_content = content.replace(old_return, new_return)

# Write the patched file
with open('/workspaces/Expense-Tracker/agents/orchestrator.py', 'w') as f:
    f.write(new_content)

print("✅ Orchestrator patched with natural language fallback")
