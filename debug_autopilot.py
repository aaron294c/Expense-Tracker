#!/usr/bin/env python3
"""
Debug version of Claude Autopilot to diagnose the startup issue
"""

import pexpect
import time
import os

def debug_claude_startup():
    print("🔍 Debug: Testing Claude CLI startup...")
    
    # Change to project directory
    os.chdir("/workspaces/Expense-Tracker")
    print(f"📁 Working directory: {os.getcwd()}")
    
    # Test the fixed claude command
    claude_cmd = "/workspaces/Expense-Tracker/claude_fixed"
    print(f"🚀 Spawning: {claude_cmd}")
    
    try:
        child = pexpect.spawn(claude_cmd, encoding="utf-8", timeout=30)
        child.logfile_read = open("debug_output.txt", "w")  # Log to file
        child.logfile = None  # Don't print to stdout yet
        
        print("⏱️  Waiting 3 seconds...")
        time.sleep(3)
        
        print(f"📊 Process alive: {child.isalive()}")
        print(f"📊 Process terminated: {child.terminated}")
        print(f"📊 Process exitstatus: {child.exitstatus}")
        print(f"📊 Process signalstatus: {child.signalstatus}")
        
        # Try to read what Claude has output so far
        try:
            # Set a very short timeout to see what's in the buffer
            child.expect(pexpect.TIMEOUT, timeout=1)
            output = child.before or ""
            print(f"📤 Output so far ({len(output)} chars):")
            print("=" * 40)
            print(repr(output))  # Use repr to see special characters
            print("=" * 40)
        except Exception as e:
            print(f"❌ Error reading output: {e}")
        
        # Try sending a simple command
        if child.isalive():
            print("💬 Trying to send 'exit' command...")
            child.sendline("exit")
            time.sleep(1)
            
            try:
                child.expect(pexpect.TIMEOUT, timeout=1)
                response = child.before or ""
                print(f"📥 Response to 'exit' ({len(response)} chars):")
                print("=" * 40)
                print(repr(response))
                print("=" * 40)
            except Exception as e:
                print(f"❌ Error reading response: {e}")
        
        # Clean up
        if child.isalive():
            child.close()
            
        # Close log file
        child.logfile_read.close()
        
        print("\n📄 Full debug output saved to debug_output.txt")
        print("You can check it with: cat debug_output.txt")
        
    except Exception as e:
        print(f"❌ Exception during debug: {e}")

if __name__ == "__main__":
    debug_claude_startup()
