#!/usr/bin/env python3
import subprocess
import time
import sys
import os

def run_claude_with_retries(task, max_turns=10):
    cmd = ["./claude_fixed", "--max-turns", str(max_turns), task]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        output = result.stdout + result.stderr
        
        # Check for progress indicators
        progress_made = any(indicator in output for indicator in [
            "File written", "✅", "📝 Writing to", "Command completed"
        ])
        
        return progress_made, output
    except Exception as e:
        return False, str(e)

if __name__ == "__main__":
    task = sys.argv[1] if len(sys.argv) > 1 else "improve the code"
    
    print(f"Running autopilot for: {task}")
    
    for i in range(3):
        print(f"\n--- Iteration {i+1} ---")
        success, output = run_claude_with_retries(task, max_turns=8)
        
        if success:
            print("✅ Progress made!")
            # Show last few lines of meaningful output
            lines = [line for line in output.split('\n') if '✅' in line or '📝' in line]
            for line in lines[-3:]:
                print(f"  {line}")
        else:
            print("❌ No progress")
            
        time.sleep(2)
    
    print("\nAutopilot complete!")
