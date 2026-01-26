#!/usr/bin/env bash

# Quick start script for the Factorio Megabase Dashboard

echo "🚀 Factorio Megabase Dashboard Setup"
echo "======================================"
echo ""

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install it first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✓ Bun is installed"

# Navigate to dashboard directory
cd "$(dirname "$0")/dashboard" || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✓ Dependencies installed"
fi

# Check if build directory exists
if [ ! -d "build" ]; then
    echo "🔨 Building dashboard..."
    bun run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed"
        exit 1
    fi
    echo "✓ Dashboard built"
else
    echo "✓ Dashboard already built (run 'bun run build' to rebuild)"
fi

echo ""
echo "🎯 Starting dashboard server..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Dashboard will be available at:"
echo "   http://localhost:3000"
echo ""
echo "📝 Stats endpoint:"
echo "   http://localhost:3000/api/stats"
echo ""
echo "⚠️  Make sure the Factorio mod is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the server
bun run start
