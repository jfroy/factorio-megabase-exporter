# Factorio Megabase Dashboard

A modern, real-time web dashboard for visualizing Factorio factory statistics exported by the [Factorio Megabase Exporter](../README.md) mod.

![Dashboard Preview](../screenshots/Screenshot_20260125_094808.png)

## Features

- **Real-time Updates**: Auto-refreshes statistics every 5 seconds
- **Interactive Charts**: 
  - Science production rate time-series
  - Science consumption rate time-series
  - Live rate indicators with progress bars
- **Research Monitoring**:
  - Current research progress with completion percentage
  - Research queue visualization
  - Science per minute (SPM) tracking
- **Quality Support**: Tracks all quality levels (normal, uncommon, rare, epic, legendary)
- **Factorio-Themed UI**: Dark theme with orange accents matching the game's aesthetic
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: SvelteKit + TypeScript
- **Charts**: Chart.js with svelte-chartjs wrapper
- **Backend**: Bun HTTP server
- **Styling**: CSS-in-JS with Factorio theme

## Installation

### Prerequisites

- [Bun](https://bun.sh/) runtime (v1.0+)
- The Factorio Megabase Exporter mod must be installed and running

### Setup

1. Navigate to the dashboard directory:
   ```bash
   cd dashboard
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Build the dashboard:
   ```bash
   bun run build
   ```

## Usage

### Production Mode

Start the server to serve the built dashboard and API:

```bash
bun run start
```

The dashboard will be available at: **http://localhost:3000**

The server provides:
- Static files: Serves the built SvelteKit app
- API endpoint: `/api/stats` returns the latest stats.json data
- API endpoint: `/api/assets/technology/{name}.png` serves technology icons from Factorio
- File watching: Automatically reloads when stats.json changes

### Development Mode

For development with hot-reload:

1. Start the Vite dev server:
   ```bash
   bun run dev
   ```

2. In a separate terminal, start the API server:
   ```bash
   bun run start
   ```

The dev server runs on port 5173 by default and proxies API requests to the backend.

## Configuration

### Environment Variables

#### FACTORIO_PATH

Set the path to your Factorio installation directory. This is used to:
- Locate the stats.json file at `$FACTORIO_PATH/script-output/megabase-exporter/stats.json`
- Serve technology icons from `$FACTORIO_PATH/data/base/graphics/technology/` and `$FACTORIO_PATH/data/space-age/graphics/technology/`

**Setting FACTORIO_PATH:**

```bash
# Option 1: Set in your shell before running
export FACTORIO_PATH="/path/to/factorio"
bun run start

# Option 2: Set inline when running
FACTORIO_PATH="/path/to/factorio" bun run start

# Option 3: Use the start-dashboard.sh script (auto-detects from mod location)
../start-dashboard.sh
```

If not set, the server will default to `../../../` (assuming the mod is installed in the Factorio mods directory).

### Update Frequency

The dashboard polls the API every 5 seconds by default. To change this, edit `src/routes/+page.svelte`:

```typescript
// Change 5000 to your desired interval in milliseconds
stopPolling = startStatsPolling(5000);
```

### Server Port

To change the server port, edit `server.ts`:

```typescript
const PORT = 3000; // Change to your desired port
```

### Stats File Location

The stats file location is now automatically derived from the `FACTORIO_PATH` environment variable:

```typescript
const STATS_PATH = join(FACTORIO_PATH, 'script-output', 'megabase-exporter', 'stats.json');
```

If you need to customize this further, edit `server.ts`.

### Technology Assets

Technology icons are automatically served from the Factorio installation. The server searches these directories in order:
1. `$FACTORIO_PATH/data/base/graphics/technology/`
2. `$FACTORIO_PATH/data/space-age/graphics/technology/`

Assets are accessible via: `http://localhost:3000/api/assets/technology/{technology-name}.png`

For example:
- `http://localhost:3000/api/assets/technology/automation-2.png`
- `http://localhost:3000/api/assets/technology/steel-processing.png`

The dashboard automatically uses these assets to display technology icons in the Research Progress and Research Queue components.

## Project Structure

```
dashboard/
├── src/
│   ├── lib/
│   │   ├── components/          # Svelte components
│   │   │   ├── ScienceProductionChart.svelte
│   │   │   ├── ScienceConsumptionChart.svelte
│   │   │   ├── ScienceRateIndicator.svelte
│   │   │   ├── ResearchProgress.svelte
│   │   │   └── ResearchQueue.svelte
│   │   ├── stores/              # Svelte stores for state management
│   │   │   └── statsStore.ts
│   │   ├── types/               # TypeScript type definitions
│   │   │   └── stats.ts
│   │   └── utils/               # Utility functions
│   │       ├── chartConfig.ts
│   │       └── formatters.ts
│   ├── routes/
│   │   ├── +layout.ts
│   │   └── +page.svelte         # Main dashboard page
│   ├── app.css                  # Global styles
│   ├── app.d.ts                 # TypeScript declarations
│   └── app.html                 # HTML template
├── static/
│   └── icons/                   # Science pack icons
├── build/                       # Built static files (generated)
├── server.ts                    # Bun HTTP server
├── package.json
├── svelte.config.js
├── tsconfig.json
└── vite.config.ts
```

## Science Pack Icons

The dashboard includes placeholder SVG icons for all science packs. To use official Factorio icons:

1. Extract icons from your Factorio installation: `<factorio>/data/base/graphics/icons/`
2. Copy science pack PNG files to `static/icons/`
3. Rename them to match the format: `{science-pack-name}.png`

See `static/icons/README.md` for more details.

## Data Visualization

### Charts

- **Production/Consumption Charts**: Display the last 5 minutes of data (60 data points)
- **Rate Indicators**: Show current rates with horizontal progress bars
- Quality levels are aggregated per science pack type
- Colors match the official Factorio science pack colors

### Research

- **Current Research**: Shows the first item in the research queue with progress
- **Research Queue**: Lists all queued research items (positions 2+)
- **Science Per Minute**: Calculated from the special "science" entity in stats.json

## API Reference

### GET /api/stats

Returns the current statistics from stats.json.

**Response Format**: See [parent README](../README.md#output-format) for the full JSON structure.

**Headers**:
- `Content-Type: application/json`
- `Cache-Control: no-cache`
- `Access-Control-Allow-Origin: *` (CORS enabled)

### GET /api/assets/technology/{name}.png

Serves technology icons from the Factorio installation.

**Parameters**:
- `name`: The technology name (e.g., `automation-2`, `steel-processing`)

**Response**: PNG image file

**Headers**:
- `Cache-Control: public, max-age=86400` (24 hour cache)
- `Access-Control-Allow-Origin: *` (CORS enabled)

**Status Codes**:
- `200`: Asset found and returned
- `404`: Asset not found in any search path

## Troubleshooting

### Dashboard shows "Waiting for data..."

- Ensure the Factorio Megabase Exporter mod is running
- Check that `stats.json` exists in the parent directory
- Verify the server is running and accessible at http://localhost:3000/api/stats

### Charts not updating

- Check browser console for errors
- Verify the polling interval is set correctly
- Ensure stats.json is being updated by the mod

### Build errors

- Delete `node_modules` and run `bun install` again
- Ensure Bun is up to date: `bun upgrade`
- Check for TypeScript errors: `bun run check`

## Performance

- **Lightweight**: Client-side rendering with minimal server load
- **Efficient**: Chart animations disabled for smoother updates
- **Optimized**: Only active science packs are displayed in charts
- **History Management**: Keeps last 60 data points (5 minutes) in memory

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any modern browser with ES2020+ support

## Contributing

To modify or extend the dashboard:

1. Make changes to source files in `src/`
2. Test with `bun run dev`
3. Build for production with `bun run build`
4. Run the production server with `bun run start`

## License

MIT License - Same as the parent Factorio Megabase Exporter project

## Links

- [Factorio](https://factorio.com/)
- [Factorio API Docs](https://lua-api.factorio.com/)
- [Science Pack Wiki](https://wiki.factorio.com/Science_pack)
- [SvelteKit](https://kit.svelte.dev/)
- [Chart.js](https://www.chartjs.org/)
- [Bun](https://bun.sh/)
