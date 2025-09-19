#!/usr/bin/env python3
"""
Claude Autopilot v3 - Fixed success detection for turn limits
"""

import subprocess
import time
import random
import sys
import argparse
import os

class ClaudeAutopilotV3:
    def __init__(self, max_iters=15, max_minutes=10, verbose=True):
        self.max_iters = max_iters
        self.max_minutes = max_minutes
        self.verbose = verbose
        self.iteration_count = 0
        self.start_time = time.time()
        
        self.follow_up_templates = [
            "Continue with the previous work. {context} Build upon what was implemented and add more improvements.",
            "Expand on the recent changes. {context} Polish and enhance the current implementation.",
            "Based on the previous progress, {context} Add additional features and refinements.",
        ]
        
        self.stop_triggers = [
            "pull request created", "pr created", "ready for review",
            "implementation complete", "task completed", "deployment ready",
            "no further changes needed", "solution is complete"
        ]
        
        self.context_patterns = {
            "ux": "focusing on user experience improvements",
            "ui": "focusing on user interface enhancements", 
            "auth": "focusing on authentication features",
            "signup": "focusing on signup flow improvements",
            "validation": "focusing on form validation"
        }
        
    def _log(self, message: str, force: bool = False):
        if self.verbose or force:
            elapsed = time.time() - self.start_time
            print(f"[{elapsed:.1f}s | Run {self.iteration_count}] {message}")
            
    def _should_stop(self, output: str) -> bool:
        output_lower = output.lower()
        for trigger in self.stop_triggers:
            if trigger.lower() in output_lower:
                self._log(f"Stop trigger found: '{trigger}'", force=True)
                return True
        return False
        
    def _extract_context(self, initial_task: str, output: str) -> str:
        contexts = []
        combined_text = (initial_task + " " + output).lower()
        for keyword, context in self.context_patterns.items():
            if keyword in combined_text:
                contexts.append(context)
        return random.choice(contexts) if contexts else "continuing the development work"
        
    def _generate_follow_up(self, initial_task: str, last_output: str) -> str:
        context = self._extract_context(initial_task, last_output)
        template = random.choice(self.follow_up_templates)
        return template.format(context=context)
        
    def _run_claude_command(self, task: str, max_turns: int = 20) -> tuple[bool, str]:
        try:
            os.chdir("/workspaces/Expense-Tracker")
            
            cmd = ["/workspaces/Expense-Tracker/claude_fixed", "--max-turns", str(max_turns), task]
            self._log(f"Running: claude --max-turns {max_turns} \"{task[:50]}...\"")
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=400,
                                  env={**os.environ, "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY")})
            
            output = result.stdout + result.stderr
            
            # Better success detection
            progress_indicators = [
                "File written", "✅", "Command completed", "🔧 Executing", 
                "📝 Writing to", "Updated", "feat(", "fix(", "chore(",
                "Commit:", "Changes committed"
            ]
            made_progress = any(indicator in output for indicator in progress_indicators)
            
            # Success if return code 0 OR if max turns but progress was made
            success = (result.returncode == 0 or 
                      ("Max turns" in output and made_progress))
            
            if success and "Max turns" in output:
                self._log("✅ Claude used all turns but made progress - continuing", force=True)
            elif not success:
                self._log(f"❌ Claude command failed with return code: {result.returncode}")
                if "Max turns" not in output:  # Only debug real failures
                    self._log(f"Error output: {output[-500:]}", force=True)
            
            return success, output
            
        except subprocess.TimeoutExpired:
            self._log("Claude command timed out", force=True)
            return False, "Command timed out"
        except Exception as e:
            self._log(f"Error: {e}", force=True)
            return False, str(e)
            
    def run(self, initial_task: str) -> bool:
        self._log(f"Starting Claude Autopilot v3", force=True)
        self._log(f"Task: '{initial_task}'", force=True)
        self._log("=" * 60, force=True)
        
        current_task = initial_task
        
        try:
            while (self.iteration_count < self.max_iters and 
                   (time.time() - self.start_time) < 60 * self.max_minutes):
                
                self.iteration_count += 1
                success, output = self._run_claude_command(current_task)
                
                if not success:
                    self._log("Stopping due to command failure", force=True)
                    break
                    
                # Show progress summary
                lines = output.strip().split('\n')
                progress_lines = [l for l in lines if any(ind in l for ind in ["✅", "📝", "🔧", "feat(", "fix("])]
                if progress_lines:
                    self._log(f"Progress summary:")
                    for line in progress_lines[-3:]:  # Show last 3 progress items
                        self._log(f"  {line.strip()}")
                
                if self._should_stop(output):
                    self._log("Task completed successfully!", force=True)
                    break
                
                current_task = self._generate_follow_up(initial_task, output)
                time.sleep(3)
                self._log("-" * 40)
                
            elapsed = time.time() - self.start_time
            self._log("=" * 60, force=True)
            self._log(f"Finished after {self.iteration_count} runs and {elapsed/60:.1f} minutes", force=True)
            return True
            
        except KeyboardInterrupt:
            self._log("Interrupted by user", force=True)
            return False

def main():
    parser = argparse.ArgumentParser(description="Claude Autopilot v3")
    parser.add_argument("task", help="Initial task for Claude")
    parser.add_argument("--max-iters", "-i", type=int, default=3, help="Max iterations")
    parser.add_argument("--max-minutes", "-m", type=int, default=10, help="Max minutes")
    parser.add_argument("--quiet", "-q", action="store_true", help="Quiet mode")
    
    args = parser.parse_args()
    
    autopilot = ClaudeAutopilotV3(
        max_iters=args.max_iters,
        max_minutes=args.max_minutes, 
        verbose=not args.quiet
    )
    
    success = autopilot.run(args.task)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
