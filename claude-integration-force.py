#!/usr/bin/env python3
import subprocess
import time
import shutil
import os

def force_file_replacement(source, target):
    """Force file replacement with direct Python"""
    try:
        shutil.copy2(source, target)
        print(f"✅ Forced replacement: {source} -> {target}")
        return True
    except Exception as e:
        print(f"❌ Replacement failed: {e}")
        return False

def run_integration_with_fallback(task):
    """Run task with manual fallback for critical operations"""
    
    # Try automation first
    cmd = ["./claude_fixed", "--max-turns", "8", task]
    result = subprocess.run(cmd, capture_output=True, text=True)
    output = result.stdout + result.stderr
    
    # Check if file operations succeeded
    if "File written" in output or "File replaced" in output:
        print("✅ Automation succeeded")
        return True
    
    # Manual fallback for critical operations
    print("⚠️ Automation incomplete, applying manual fixes...")
    
    # Specific fallbacks for known issues
    if "login-enhanced" in task.lower():
        success = force_file_replacement("pages/login-enhanced.tsx", "pages/login.tsx")
        if success:
            print("✅ Manual integration completed")
            return True
    
    print("❌ Integration failed")
    return False

if __name__ == "__main__":
    import sys
    task = sys.argv[1] if len(sys.argv) > 1 else "integrate enhanced components"
    run_integration_with_fallback(task)
