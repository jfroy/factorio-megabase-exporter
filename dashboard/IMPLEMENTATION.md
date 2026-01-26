# Asset Serving Implementation

## Summary

Added backend functionality to serve Factorio game assets (technology icons) from the Factorio installation directory.

## Changes Made

### Backend (server.ts)

1. **Environment Configuration**
   - Added `FACTORIO_PATH` environment variable support
   - Defaults to `../../../` (relative to dashboard directory) if not set
   - Derives `STATS_PATH` from `FACTORIO_PATH`: `$FACTORIO_PATH/script-output/megabase-exporter/stats.json`

2. **Technology Asset Paths**
   - Configured two search paths for technology icons:
     - `$FACTORIO_PATH/data/base/graphics/technology/`
     - `$FACTORIO_PATH/data/space-age/graphics/technology/`

3. **New API Endpoint**
   - Route: `/api/assets/technology/{name}.png`
   - Searches both base and Space Age directories for requested assets
   - Returns 404 if asset not found
   - Caches assets for 24 hours (`Cache-Control: public, max-age=86400`)
   - Supports CORS for cross-origin requests

### Frontend

1. **New Utility Module** (`src/lib/utils/assets.ts`)
   - `getTechnologyAssetUrl(techName)`: Generates asset URLs
   - `handleImageError(event)`: Fallback handler for missing images

2. **Updated Components**
   - **ResearchProgress.svelte**:
     - Displays 64x64px technology icon for current research
     - Icon positioned above research name
     - Includes drop-shadow effect for visual polish
   
   - **ResearchQueue.svelte**:
     - Displays 32x32px technology icons for queued research
     - Icons appear between position number and tech name
     - Includes subtle drop-shadow effect

3. **Error Handling**
   - Both components gracefully handle missing assets
   - Falls back to transparent pixel with reduced opacity
   - No broken image indicators shown to user

### Infrastructure

1. **Start Script** (`start-dashboard.sh`)
   - Auto-detects `FACTORIO_PATH` if not set
   - Defaults to `../../` from script location (assumes mod in Factorio mods folder)
   - Displays FACTORIO_PATH information on startup

2. **Documentation** (`dashboard/README.md`)
   - Added environment variables section
   - Documented FACTORIO_PATH usage
   - Updated API reference with new asset endpoint
   - Added technology assets section

## Usage

### Setting FACTORIO_PATH

```bash
# Option 1: Export before running
export FACTORIO_PATH="/path/to/factorio"
bun run start

# Option 2: Inline
FACTORIO_PATH="/path/to/factorio" bun run start

# Option 3: Use start script (auto-detects)
./start-dashboard.sh
```

### API Examples

```bash
# Get technology icon
curl http://localhost:3000/api/assets/technology/automation-2.png

# Get Space Age technology icon
curl http://localhost:3000/api/assets/technology/agricultural-science-pack.png
```

## Technical Details

### Asset Resolution
The server searches technology assets in order:
1. Base game directory first
2. Space Age directory second
3. Returns first match found
4. 404 if not found in either location

### Caching Strategy
- Assets cached for 24 hours (client-side)
- Server uses Bun's file serving for efficient delivery
- No server-side caching (Bun handles this efficiently)

### Performance
- Minimal overhead: Direct file serving with Bun.file()
- Async file existence checks
- No image processing or transformation
- CORS headers allow CDN caching if desired

## Testing

To test the implementation:

1. Start the server with FACTORIO_PATH set
2. Open the dashboard at http://localhost:3000
3. Verify technology icons appear in:
   - Current Research Progress card
   - Research Queue list
4. Check browser network tab to verify assets load successfully
5. Test asset endpoint directly: http://localhost:3000/api/assets/technology/automation-2.png

## Fallback Behavior

If assets are missing:
- Images gracefully degrade to transparent placeholders
- No broken image icons or error messages shown
- Application continues functioning normally
- User experience minimally impacted
