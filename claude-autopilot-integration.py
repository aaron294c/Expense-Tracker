#!/usr/bin/env python3
import subprocess
import time
import sys
import os

class IntegratedAutopilot:
    def __init__(self, max_iters=5, max_minutes=15):
        self.max_iters = max_iters
        self.max_minutes = max_minutes
        self.iteration_count = 0
        self.start_time = time.time()
        
        # Integration-focused tasks
        self.integration_phases = [
            "Check current routing and identify integration points",
            "Replace original files with enhanced versions maintaining same paths", 
            "Update all navigation and routing references",
            "Add any new dependencies to package.json",
            "Test integration and fix any broken imports",
            "Verify complete application flow works end-to-end"
        ]

    def run_integration_task(self, base_task):
        print(f"Starting integrated development for: {base_task}")
        print("=" * 60)
        
        for phase_idx, phase in enumerate(self.integration_phases):
            if self.iteration_count >= self.max_iters:
                break
                
            self.iteration_count += 1
            print(f"\n--- Phase {phase_idx + 1}: {phase} ---")
            
            # Combine base task with integration phase
            full_task = f"{base_task}. Focus on: {phase}. Ensure complete integration."
            
            cmd = ["./claude_fixed", "--max-turns", "10", full_task]
            
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=400)
                output = result.stdout + result.stderr
                
                # Check for integration success indicators
                integration_success = any(indicator in output for indicator in [
                    "File written", "Updated", "package.json", "routing", "import", "export"
                ])
                
                if integration_success:
                    print("✅ Integration phase completed")
                    # Show relevant changes
                    lines = [line for line in output.split('\n') if any(
                        keyword in line.lower() for keyword in ['written', 'updated', 'import', 'routing']
                    )]
                    for line in lines[-3:]:
                        if line.strip():
                            print(f"  {line.strip()}")
                else:
                    print("⚠️ Phase completed with limited integration")
                
                time.sleep(3)
                
            except Exception as e:
                print(f"❌ Phase failed: {e}")
                
        print(f"\n" + "=" * 60)
        print(f"Integration complete after {self.iteration_count} phases")

if __name__ == "__main__":
    task = sys.argv[1] if len(sys.argv) > 1 else "integrate enhanced login page"
    autopilot = IntegratedAutopilot()
    autopilot.run_integration_task(task)
