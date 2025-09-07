#!/bin/bash

# Setup Script for Supabase Schema Sync
# This script initializes the schema sync workflow

set -e

echo "🚀 Setting up Supabase Schema Sync..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI not found. Installing..."
    npm install -g supabase
    print_success "Supabase CLI installed"
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from your project root."
    exit 1
fi

# Create directory structure
print_status "Creating directory structure..."
mkdir -p supabase/schema
mkdir -p supabase/types  
mkdir -p supabase/migrations

print_success "Directory structure created"

# Check environment variables
print_status "Checking environment configuration..."

if [ ! -f ".env.local" ]; then
    print_error ".env.local file not found. Please create it with your Supabase credentials."
    exit 1
fi

# Source environment variables
source .env.local

if [ -z "$SUPABASE_PROJECT_REF" ]; then
    print_error "SUPABASE_PROJECT_REF not set in .env.local"
    exit 1
fi

if [ -z "$SUPABASE_URL" ]; then
    print_error "SUPABASE_URL not set in .env.local"
    exit 1
fi

print_success "Environment configuration validated"

# Check if Personal Access Token is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    print_warning "SUPABASE_ACCESS_TOKEN not set in .env.local"
    print_warning "You'll need to get this from: https://app.supabase.com/account/tokens"
    print_warning "Add it to .env.local as: SUPABASE_ACCESS_TOKEN=sbp_your_token_here"
    echo ""
    read -p "Do you want to continue without the access token? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Setup cancelled. Please add SUPABASE_ACCESS_TOKEN to .env.local"
        exit 1
    fi
fi

# Install dependencies
print_status "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Link to Supabase project
print_status "Linking to Supabase project..."
if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
    supabase link --project-ref "$SUPABASE_PROJECT_REF"
    print_success "Successfully linked to Supabase project"
else
    print_warning "Skipping Supabase link (no access token)"
fi

# Initial schema pull
print_status "Performing initial schema extraction..."
if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
    # Pull current schema
    supabase db dump --schema public --linked -f supabase/schema/current.sql
    print_success "Schema snapshot created: supabase/schema/current.sql"

    # Generate TypeScript types
    supabase gen types typescript --linked > supabase/types/database.types.ts
    print_success "TypeScript types generated: supabase/types/database.types.ts"
    
    # Check for Prisma
    if [ -f "prisma/schema.prisma" ]; then
        print_status "Prisma detected, pulling schema..."
        npx prisma db pull
        print_success "Prisma schema updated"
    fi
else
    print_warning "Skipping schema extraction (no access token)"
    print_warning "Run 'npm run schema:pull' after setting up your access token"
fi

# Summary
echo ""
print_success "🎉 Schema sync setup complete!"
echo ""
echo "📁 Directory structure created:"
echo "   ├── supabase/schema/        # Schema snapshots"
echo "   ├── supabase/types/         # Generated TypeScript types"
echo "   ├── supabase/migrations/    # Migration files"
echo "   └── .github/workflows/      # Automated CI workflows"
echo ""
echo "🔧 Available commands:"
echo "   npm run schema:pull         # Pull latest schema + types"
echo "   npm run schema:diff         # Generate migration from changes"
echo "   npm run schema:apply        # Apply migrations to local dev DB"
echo "   npm run types               # Regenerate TypeScript types"
echo ""
echo "🤖 GitHub Actions workflows:"
echo "   - Nightly schema sync       # Automatically syncs schema snapshot"
echo "   - Remote diff generator     # Creates migration PRs on demand"
echo ""
echo "⚠️  Next steps:"
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "   1. Get Personal Access Token: https://app.supabase.com/account/tokens"
    echo "   2. Add to .env.local: SUPABASE_ACCESS_TOKEN=sbp_your_token_here"
    echo "   3. Run: npm run schema:pull"
fi
echo "   4. Add GitHub secrets for CI:"
echo "      - SUPABASE_ACCESS_TOKEN"
echo "      - SUPABASE_PROJECT_REF (rtgiakccgqqumddeyixs)"
echo "   5. Commit the generated files to git"
echo ""
print_success "Setup complete! 🚀"