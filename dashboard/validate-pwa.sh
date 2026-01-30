#!/bin/bash
# PWA Validation Script
# Tests that the Factorio Megabase Dashboard PWA is properly configured

set -e

DASHBOARD_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$DASHBOARD_DIR/build"

echo "🔍 Factorio Dashboard PWA Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found. Please run 'bun run build' first."
    exit 1
fi
echo "✅ Build directory exists"

# Check for required PWA files
echo ""
echo "Checking PWA files..."

if [ -f "$BUILD_DIR/manifest.json" ]; then
    echo "✅ manifest.json found"
else
    echo "❌ manifest.json not found"
    exit 1
fi

if [ -f "$BUILD_DIR/service-worker.js" ]; then
    echo "✅ service-worker.js found"
else
    echo "❌ service-worker.js not found"
    exit 1
fi

if [ -f "$BUILD_DIR/index.html" ]; then
    echo "✅ index.html found"
else
    echo "❌ index.html not found"
    exit 1
fi

# Validate manifest.json
echo ""
echo "Validating manifest.json..."

if grep -q '"name".*"Factorio Megabase Dashboard"' "$BUILD_DIR/manifest.json"; then
    echo "✅ App name configured"
else
    echo "❌ App name not found in manifest"
    exit 1
fi

if grep -q '"theme_color".*"#ff7700"' "$BUILD_DIR/manifest.json"; then
    echo "✅ Theme color configured"
else
    echo "❌ Theme color not found in manifest"
    exit 1
fi

if grep -q '"display".*"standalone"' "$BUILD_DIR/manifest.json"; then
    echo "✅ Display mode set to standalone"
else
    echo "❌ Display mode not set correctly"
    exit 1
fi

# Validate index.html
echo ""
echo "Validating index.html..."

if grep -q '<link rel="manifest" href="/manifest.json"' "$BUILD_DIR/index.html"; then
    echo "✅ Manifest link found"
else
    echo "❌ Manifest link not found in HTML"
    exit 1
fi

if grep -q '<meta name="theme-color" content="#ff7700"' "$BUILD_DIR/index.html"; then
    echo "✅ Theme color meta tag found"
else
    echo "❌ Theme color meta tag not found"
    exit 1
fi

if grep -q 'apple-mobile-web-app-capable' "$BUILD_DIR/index.html"; then
    echo "✅ iOS web app meta tags found"
else
    echo "❌ iOS web app meta tags not found"
    exit 1
fi

# Validate service worker
echo ""
echo "Validating service-worker.js..."

if grep -q "addEventListener('install'" "$BUILD_DIR/service-worker.js"; then
    echo "✅ Install event handler found"
else
    echo "❌ Install event handler not found"
    exit 1
fi

if grep -q "addEventListener('fetch'" "$BUILD_DIR/service-worker.js"; then
    echo "✅ Fetch event handler found"
else
    echo "❌ Fetch event handler not found"
    exit 1
fi

if grep -q "/api/stats" "$BUILD_DIR/service-worker.js"; then
    echo "✅ Stats API exclusion configured"
else
    echo "❌ Stats API exclusion not found"
    exit 1
fi

# Final summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All PWA validation checks passed!"
echo ""
echo "Next steps:"
echo "  1. Run: bun run start"
echo "  2. Open: http://localhost:3000"
echo "  3. Check browser DevTools → Application → Service Workers"
echo "  4. Look for install prompt in browser address bar"
echo ""
