import json
import re
from typing import Dict, Any, Optional

def improved_parse_control_protocol(worker_output: str) -> Optional[Dict[str, Any]]:
    """
    Improved parsing for Claude's control protocol responses.
    More aggressive at finding and extracting valid JSON.
    """
    
    # Handle common transient provider error text as RETRY
    if ("model is overloaded" in worker_output) or (" 503" in worker_output) or ("UNAVAILABLE" in worker_output):
        return {"decision": "RETRY", "reason": "Upstream 503/overloaded"}

    # More aggressive JSON extraction patterns
    json_patterns = [
        # JSON in code blocks (most common)
        r'```(?:json)?\s*(\{.*?\})\s*```',
        # JSON at end of response
        r'.*?(\{[^{}]*"decision"[^{}]*\})\s*$',
        # JSON anywhere in response (greedy)
        r'(\{[^{}]*"decision"[^{}]*\})',
        # Multi-line JSON (more permissive)
        r'(\{(?:[^{}]|\{[^{}]*\})*"decision"(?:[^{}]|\{[^{}]*\})*\})',
        # JSON with newlines and whitespace
        r'(\{[\s\S]*?"decision"[\s\S]*?\})',
    ]
    
    for pattern in json_patterns:
        matches = re.finditer(pattern, worker_output, re.DOTALL | re.MULTILINE)
        for match in matches:
            try:
                json_str = match.group(1).strip()
                
                # Clean up the JSON string
                json_str = re.sub(r'^```(?:json)?\s*', '', json_str)
                json_str = re.sub(r'\s*```$', '', json_str)
                json_str = json_str.strip()
                
                # Try to parse
                data = json.loads(json_str)
                
                # Validate structure
                if isinstance(data, dict) and "decision" in data:
                    decision = data["decision"]
                    valid_decisions = {"PLAN", "EDIT", "EXECUTE", "TEST", "MIGRATE", "DOCS", "PR", "STOP", "RETRY"}
                    
                    if decision in valid_decisions:
                        # Ensure required fields exist
                        if "commands" not in data:
                            data["commands"] = []
                        if "commit" not in data:
                            data["commit"] = {"message": "Auto-generated", "files": []}
                        if "pr" not in data:
                            data["pr"] = {"title": "Auto-generated", "body": ""}
                            
                        return data
                        
            except (json.JSONDecodeError, KeyError, AttributeError):
                continue
    
    # If no JSON found, try to extract intent from natural language
    lines = worker_output.strip().split('\n')
    
    # Look for action words that might indicate intent
    action_patterns = {
        r'\b(?:plan|planning|analyze)\b': "PLAN",
        r'\b(?:edit|modify|change|update|write)\b': "EDIT", 
        r'\b(?:run|execute|command)\b': "EXECUTE",
        r'\b(?:test|testing|check)\b': "TEST",
        r'\b(?:migrate|migration)\b': "MIGRATE",
        r'\b(?:document|docs)\b': "DOCS",
        r'\b(?:pr|pull request|commit)\b': "PR",
        r'\b(?:done|complete|finish|stop)\b': "STOP"
    }
    
    inferred_decision = "PLAN"  # default
    for pattern, decision in action_patterns.items():
        if re.search(pattern, worker_output, re.IGNORECASE):
            inferred_decision = decision
            break
    
    # Create a fallback response with extracted content
    plan_items = []
    for i, line in enumerate(lines[:10]):  # First 10 lines
        line = line.strip()
        if line and not line.startswith('#') and len(line) > 10:
            plan_items.append(line[:100])  # Truncate long lines
    
    if not plan_items:
        plan_items = ["Continue with the requested task", "Analyze current implementation"]
    
    return {
        "decision": inferred_decision,
        "plan": plan_items,
        "commands": [],
        "commit": {"message": "Auto-generated from natural language response", "files": []},
        "pr": {"title": "Auto-generated", "body": ""},
        "reason": f"Parsed from natural language response ({len(worker_output)} chars)"
    }

# Test with example responses
test_cases = [
    '''I'll help you fix the UX of the signup page. Let me start by analyzing the current implementation.

```json
{
  "decision": "PLAN",
  "plan": [
    "Analyze current signup page structure",
    "Identify UX pain points", 
    "Improve form validation",
    "Enhance visual design"
  ]
}
```''',
    
    '''Let me plan the UX improvements for the signup page:

1. Review current form structure
2. Improve validation messages
3. Enhance visual hierarchy
4. Test accessibility

I need to start by examining the existing code.''',
    
    '''{
  "decision": "EDIT",
  "commands": [
    {"write": {"path": "app/signup/page.tsx", "content": "// Updated signup component"}}
  ]
}'''
]

print("Testing improved parser:")
for i, test in enumerate(test_cases):
    result = improved_parse_control_protocol(test)
    print(f"\nTest {i+1}: {result['decision']} - {result.get('reason', 'Parsed successfully')}")
    if result.get('plan'):
        print(f"  Plan: {result['plan'][:2]}...")  # Show first 2 plan items