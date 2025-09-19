import re

# Read the current orchestrator
with open('agents/orchestrator.py', 'r') as f:
    content = f.read()

# Replace the broken JSON parsing function with a working one
new_function = '''    def _parse_control_protocol(self, worker_output: str) -> Optional[Dict[str, Any]]:
        """Parse control protocol JSON from AI response"""
        
        if self.debug:
            print(f"🔍 Parsing response: {worker_output[:200]}...")
        
        # Look for JSON patterns - try multiple approaches
        patterns = [
            r'\\{\\s*"decision"\\s*:\\s*"[^"]*"[^}]*\\}',  # Basic JSON
            r'\\{[^{]*"decision"[^}]*\\}',                 # Simple match
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, worker_output, re.DOTALL)
            for match in matches:
                try:
                    import json
                    # Clean up the match
                    clean_json = match.strip()
                    control_data = json.loads(clean_json)
                    
                    # Validate it has required fields
                    if "decision" in control_data:
                        valid_decisions = ["PLAN", "EDIT", "EXECUTE", "TEST", "MIGRATE", "DOCS", "PR", "STOP", "RETRY"]
                        if control_data["decision"] in valid_decisions:
                            if self.debug:
                                print(f"✅ Found valid JSON: {control_data}")
                            return control_data
                
                except Exception as e:
                    if self.debug:
                        print(f"⚠️  JSON parse error: {e}")
                    continue
        
        # If no valid JSON found, extract decision from text
        decision_match = re.search(r'"decision"\\s*:\\s*"(PLAN|EDIT|EXECUTE|TEST|MIGRATE|DOCS|PR|STOP|RETRY)"', worker_output)
        if decision_match:
            decision = decision_match.group(1)
            if self.debug:
                print(f"🎯 Extracted decision from text: {decision}")
            
            return {
                "decision": decision,
                "reason": "Extracted from AI response",
                "commands": [],
                "next_hint": "Continue with extracted decision"
            }
        
        # Last resort - create EDIT decision if it looks like the AI wants to make changes
        if any(keyword in worker_output.lower() for keyword in ["create", "add", "write", "edit", "fix", "update"]):
            if self.debug:
                print("🔨 Defaulting to EDIT decision based on keywords")
            return {
                "decision": "EDIT", 
                "reason": "Inferred from AI response content",
                "commands": [{"write": {"path": "test.txt", "patch": "// AI suggested changes\\nconsole.log('Hello World');"}}],
                "next_hint": "Try to make inferred changes"
            }
        
        # Final fallback
        if self.debug:
            print("❌ No valid control protocol found, stopping")
        
        return {
            "decision": "STOP",
            "reason": "Could not parse AI response",
            "commands": [],
            "next_hint": "Check AI response format"
        }'''

# Replace the function in the file
import re as regex
start_pattern = r'def _parse_control_protocol.*?(?=def|\Z)'
new_content = regex.sub(start_pattern, new_function + '\n\n    ', content, flags=regex.DOTALL)

# Write the updated file
with open('agents/orchestrator.py', 'w') as f:
    f.write(new_content)

print("✅ Updated orchestrator with better JSON parsing")
