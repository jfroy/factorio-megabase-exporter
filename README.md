# Factorio Megabase Exporter

A lightweight Factorio mod that exports key statistics about your factory to a JSON file for external monitoring and analysis.

## Features

- **Low overhead**: Statistics are collected every 10 seconds (configurable)
- **Science pack tracking**: Monitors production and consumption for all 12 science types, plus overall science rate (eSPM)
- **Quality support**: Tracks all quality levels
- **Rate monitoring**: Provides both lifetime totals and 1-minute rates
- **Research monitoring**: Tracks current research progress and research queue
- **Alert tracking**: Monitors and logs all in-game alerts with deduplication
- **Multi-surface support**: Aggregates statistics across all surfaces (planets and platforms)
- **JSON export**: Outputs to `script-output/megabase-exporter/stats.json`
- **Web Dashboard**: Real-time visualization dashboard (see [dashboard/](dashboard/))

## Installation

1. Clone the repo in your Factorio mods directory:

   - **Windows**: `%appdata%\Factorio\mods\`
   - **Linux**: `~/.factorio/mods/`
   - **macOS**: `~/Library/Application Support/factorio/mods/`

   If you have downloaded Factorio from the game's website, the mods directory will be inside the game's directory.

2. Enable the mod in the game.

## Dashboard

This mod now includes a modern web dashboard for real-time visualization of your factory statistics!

![Dashboard Preview](dashboard.avif)

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

5. Open <http://localhost:3000> in your browser

See [dashboard/README.md](dashboard/README.md) for detailed documentation.

## Output Format

The mod writes statistics to `script-output/megabase-exporter/stats.json` every 10 seconds.

### Example Output

```json
{
  "timestamp": 303533400,
  "game_time": 303533400,
  "science_packs": {
    "total": {
      "automation-science-pack_normal": {
        "produced": 64524062,
        "consumed": 64525753,
      },
      "automation-science-pack_uncommon": {
        "produced": 1071919604,
        "consumed": 1072468798,
      },
      "logistic-science-pack_uncommon": {
        "produced": 1071894869,
        "consumed": 1072453874,
      },
      "military-science-pack_uncommon": {
        "produced": 318464516,
        "consumed": 319144236,
      },
      "chemical-science-pack_uncommon": {
        "produced": 1072036646,
        "consumed": 1072689888,
      },
      "production-science-pack_uncommon": {
        "produced": 836664214,
        "consumed": 837261852,
      },
      "utility-science-pack_uncommon": {
        "produced": 516113943,
        "consumed": 516725292,
      },
      "space-science-pack_legendary": {
        "produced": 172088124,
        "consumed": 173178650,
      },
      "metallurgic-science-pack_uncommon": {
        "produced": 124736116,
        "consumed": 128826741,
      },
      "electromagnetic-science-pack_uncommon": {
        "produced": 322065010,
        "consumed": 324054486,
      },
      "agricultural-science-pack_normal": {
        "produced": 585392902,
        "consumed": 1144922038,
      },
      "cryogenic-science-pack_uncommon": {
        "produced": 135408885,
        "consumed": 140261050,
      },
      "promethium-science-pack_normal": {
        "produced": 162625054,
        "consumed": 168704270,
      },
      "science_normal": {
        "produced": 0,
        "consumed": 28930544688,
      },
    },
    "rate_1m": {
      "automation-science-pack_normal": {
        "produced": 0,
        "consumed": 0,
      },
      "automation-science-pack_uncommon": {
        "produced": 51606.833333333328482694923877716064453125,
        "consumed": 55542.25,
      },
      "logistic-science-pack_uncommon": {
        "produced": 52440.666666666671517305076122283935546875,
        "consumed": 55542.25,
      },
      "military-science-pack_uncommon": {
        "produced": 53334.3333333333357586525380611419677734375,
        "consumed": 55542.1666666666642413474619388580322265625,
      },
      "chemical-science-pack_uncommon": {
        "produced": 53758.6666666666642413474619388580322265625,
        "consumed": 55542.25,
      },
      "production-science-pack_uncommon": {
        "produced": 52664,
        "consumed": 55543.16666666665696538984775543212890625,
      },
      "utility-science-pack_uncommon": {
        "produced": 53266.5000000000072759576141834259033203125,
        "consumed": 55542.25,
      },
      "space-science-pack_legendary": {
        "produced": 18330,
        "consumed": 18447.916666666671517305076122283935546875,
      },
      "metallurgic-science-pack_uncommon": {
        "produced": 87759.5,
        "consumed": 55542.1666666666642413474619388580322265625,
      },
      "electromagnetic-science-pack_uncommon": {
        "produced": 29434.25,
        "consumed": 55542.1666666666642413474619388580322265625,
      },
      "agricultural-science-pack_normal": {
        "produced": 115.0000000000000142108547152020037174224853515625,
        "consumed": 127730.416666666642413474619388580322265625,
      },
      "cryogenic-science-pack_uncommon": {
        "produced": 44685.333333333328482694923877716064453125,
        "consumed": 55542.1666666666642413474619388580322265625,
      },
      "promethium-science-pack_normal": {
        "produced": 64886.6666666666642413474619388580322265625,
        "consumed": 111166.916666666671517305076122283935546875,
      },
      "science_normal": {
        "produced": 2023300.0833333334885537624359130859375,
        "consumed": 0,
      }
    }
  },
  "research": {
    "queue": [
      {
        "position": 1,
        "name": "research-productivity",
        "level": 72,
        "progress": 0.511651019539009244141425369889475405216217041015625
      },
      {
        "position": 2,
        "name": "mining-productivity-3",
        "level": 4151
      },
      {
        "position": 3,
        "name": "worker-robots-speed-7",
        "level": 28
      }
    ]
  },
  "alerts": [
    {
      "tick": 317430599,
      "type": "custom",
      "surface": "vulcanus",
      "target": "programmable-speaker",
      "message": "NO LOVE"
    }
  ]
}
```

**Note**: The example above is abbreviated. The actual output includes all 12 science packs at all 5 quality levels for both `total` and `rate_1m` sections, plus the "science" eSPM special entity.

### Alerts

The mod captures all active alerts from the game and includes them in the JSON output. Each alert includes:

- **tick**: The game tick when the alert was created
- **type**: The alert type (e.g., `entity_destroyed`, `entity_under_attack`, `train_no_path`)
- **surface**: The surface where the alert is occurring
- **target**: (Optional) Target entity name
- **message**: (Optional) Custom message for custom alerts

The dashboard automatically deduplicates alerts, creating a persistent alert log that shows all unique alerts that have occurred.

## Compatibility

- Factorio version: 2.0+
- Supports both base game and Space Age expansion

## AI disclosure

Generated by Claude models in Cursor.
