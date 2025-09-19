#!/bin/bash

# Claude Setup Helper for Codespaces
echo "🔧 Claude Setup Helper"
echo "======================"

# Check current directory
echo "📁 Current directory: $(pwd)"

# Check if we're in the right place
if [[ $(basename $(pwd)) != "Expense-Tracker" ]]; then
    echo "⚠️  Not in Expense-Tracker directory. Moving there..."
    cd /workspaces/Expense-Tracker || {
        echo "❌ Could not find /workspaces/Expense-Tracker"
        echo "Please run this from your project directory"
        exit 1
    }
    echo "✅ Now in: $(pwd)"
fi

# Check if Claude command exists
echo "🔍 Checking Claude CLI..."
if command -v claude &> /dev/null; then
    echo "✅ Claude CLI found at: $(which claude)"
else
    echo "❌ Claude CLI not found in PATH"
    echo "Please install Claude CLI first"
    exit 1
fi

echo ""
echo "🧪 Testing Claude CLI from project root..."
claude --help > /dev/null 2>&1 && echo "✅ Claude CLI working" || echo "⚠️  Claude CLI may have issues"

echo ""
echo "🚀 Setup complete! Now you can run:"
echo "   python claude_autopilot.py \"Your instruction here\""
