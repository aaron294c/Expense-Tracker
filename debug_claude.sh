#!/bin/bash

echo "🔍 Claude CLI Debug & Fix"
echo "========================"

# Show the current setup
echo "📁 Current directory: $(pwd)"
echo "🔗 Claude symlink: $(ls -la $(which claude))"
echo "📄 Looking at the Claude script..."

# Let's examine what's in the claude script
echo ""
echo "📖 Contents of claude script:"
head -20 /workspaces/Expense-Tracker/claude

echo ""
echo "🔧 Diagnosing the issue..."

# Check if there's a Python path issue
echo "🐍 Python path when running from project root:"
cd /workspaces/Expense-Tracker
python3 -c "import sys; print('\\n'.join(sys.path))"

echo ""
echo "📦 Looking for 'adapters' module in project:"
find /workspaces/Expense-Tracker -name "adapters*" -type d 2>/dev/null || echo "❌ No 'adapters' directory found"
find /workspaces/Expense-Tracker -name "adapters.py" 2>/dev/null || echo "❌ No 'adapters.py' file found"

echo ""
echo "📦 Looking for Python files in project:"
find /workspaces/Expense-Tracker -name "*.py" | head -10

echo ""
echo "🎯 Suggested fixes:"
echo "1. The Claude CLI script probably needs to set PYTHONPATH or change directory"
echo "2. Let's create a wrapper script that sets up the environment properly"

# Create a fixed wrapper
cat > /workspaces/Expense-Tracker/claude_fixed << 'EOL'
#!/bin/bash

# Fixed Claude CLI wrapper
# This ensures Claude runs from the correct directory with proper Python path

# Save the original directory
ORIG_DIR=$(pwd)

# Change to the project directory
cd /workspaces/Expense-Tracker

# Set Python path to include the project directory
export PYTHONPATH="/workspaces/Expense-Tracker:$PYTHONPATH"

# Check if the original claude script exists
if [[ -f "/workspaces/Expense-Tracker/claude" ]]; then
    # Run the original script from the project directory
    exec python3 /workspaces/Expense-Tracker/claude "$@"
else
    echo "❌ Original claude script not found"
    exit 1
fi
EOL

chmod +x /workspaces/Expense-Tracker/claude_fixed

echo ""
echo "✅ Created claude_fixed wrapper script"
echo "🧪 Testing the fixed version..."

# Test the fixed version
echo "exit" | timeout 5s /workspaces/Expense-Tracker/claude_fixed 2>&1 | head -5

echo ""
echo "📋 Next steps:"
echo "1. Test: /workspaces/Expense-Tracker/claude_fixed"
echo "2. If it works, update the symlink: ln -sf /workspaces/Expense-Tracker/claude_fixed ~/.local/bin/claude"
echo "3. Then run the autopilot again"
