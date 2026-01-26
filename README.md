# Factorio Megabase Exporter

A lightweight Factorio mod that exports key statistics about your factory to a JSON file for external monitoring and analysis.

## Features

- **Low overhead**: Statistics are collected every 10 seconds (configurable)
- **Science pack tracking**: Monitors production, consumption, and storage for all 12 science types, plus overall science rate (eSPM)
- **Quality support**: Tracks all quality levels
- **Rate monitoring**: Provides both lifetime totals and 1-minute rates
- **Research monitoring**: Tracks current research progress and research queue
- **Multi-surface support**: Aggregates statistics across all surfaces (planets and platforms)
- **JSON export**: Outputs to `script-output/megabase-exporter/stats.json`
- **Web Dashboard**: Real-time visualization dashboard (see [dashboard/](dashboard/))

## Dashboard

This mod now includes a modern web dashboard for real-time visualization of your factory statistics!

![Dashboard Preview](screenshots/Screenshot_20260125_094808.png)

### Quick Start

1. Ensure the mod is running in Factorio
2. Navigate to the dashboard directory:
   ```bash
   cd dashboard
   ```
3. Install dependencies and build:
   ```bash
   bun install
   bun run build
   ```
4. Start the server:
   ```bash
   bun run start
   ```
5. Open http://localhost:3000 in your browser

See [dashboard/README.md](dashboard/README.md) for detailed documentation.

## Installation

1. Copy this mod folder to your Factorio mods directory:
   - **Windows**: `%appdata%\Factorio\mods\`
   - **Linux**: `~/.factorio/mods/`
   - **macOS**: `~/Library/Application Support/factorio/mods/`

2. Launch Factorio and enable the mod from the Mods menu

3. Load or start a game

## Output Format

The mod writes statistics to `script-output/megabase-exporter/stats.json` every 10 seconds.

### Example Output

```json
{
  "timestamp": 36000,
  "game_time": 36000,
  "science_packs": {
    "total": {
      "automation-science-pack_normal": {
        "produced": 1500,
        "consumed": 1200,
        "stored": 300
      }
    },
    "rate_1m": {
      "automation-science-pack_normal": {
        "produced": 120,
        "consumed": 100,
        "stored": 20
      }
    }
  },
  "research": {
    "queue": [
      {
        "position": 1,
        "name": "advanced-electronics",
        "localised_name": ["technology-name.advanced-electronics"],
        "level": 1,
        "progress": 0.45
      }
    ]
  }
}
```

**Note**: The example above is abbreviated. The actual output includes all 12 science packs at all 5 quality levels for both `total` and `rate_1m` sections, plus the "science" eSPM special entity.

## Data Fields

### Root Level

- `timestamp`: Current game tick when data was collected
- `game_time`: Total ticks played in this save
- `science_packs`: Object containing statistics for all science types
  - `total`: Lifetime totals for production, consumption, and storage
  - `rate_1m`: Production rates over the last 1 minute
- `research`: Object containing research queue information

### Science Packs

The mod tracks 13 science entities:

- **Base game**: automation, logistic, military, chemical, production, utility, space
- **Space Age**: metallurgic, electromagnetic, agricultural, cryogenic, promethium
- **Special entity**: "science" for the eSPM

Each science pack is further broken down by quality level:

- normal
- uncommon
- rare
- epic
- legendary

#### Total Statistics (`science_packs.total`)

For each science entity and quality combination:

- `produced`: Total units produced since game start (summed across all surfaces)
- `consumed`: Total units consumed in research since game start (summed across all surfaces)
- `stored`: Current number of units in storage (summed across all surfaces)

#### Rate Statistics (`science_packs.rate_1m`)

For each science type and quality combination:

- `produced`: Production rate over the last 1 minute (items per minute)
- `consumed`: Consumption rate over the last 1 minute (items per minute)
- `stored`: Storage flow rate over the last 1 minute (items per minute)

### Research

- `queue`: Array of all queued research technologies (including the current one as first entry)
  - `position`: Position in queue (1 is current research)
  - `name`: Internal research name
  - `localised_name`: Localized display name array
  - `level`: Research level for infinite technologies (defaults to 1 for non-infinite)
  - `progress`: Research progress (0.0 to 1.0, only present for position 1)

## Configuration

To change the update interval, edit `control.lua` and modify the `UPDATE_INTERVAL` constant:

```lua
local UPDATE_INTERVAL = 600  -- 10 seconds at 60 ticks/second
```

For example:
- 5 seconds: `300`
- 30 seconds: `1800`
- 1 minute: `3600`

## Use Cases

- Real-time monitoring dashboards (via included web dashboard)
- External analytics and reporting
- Factory optimization tools
- Stream overlays for Factorio broadcasts
- Data collection for analysis and planning

## Compatibility

- Factorio version: 2.0+
- Supports both base game and Space Age expansion
- Space Age science packs are automatically included when the expansion is active
- No known mod conflicts
- Works in single-player and multiplayer

## References

- Inspired by [graftorio2](https://github.com/seiggy/graftorio2)
- [Factorio Lua API Documentation](https://lua-api.factorio.com/latest/)
- [Factorio Science Pack Wiki](https://wiki.factorio.com/Science_pack)
