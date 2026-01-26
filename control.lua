-- Factorio Megabase Exporter
-- Exports science and research statistics to JSON every 10 seconds

local UPDATE_INTERVAL = 600 -- 10 seconds (600 ticks at 60 ticks/second)

-- List of all science pack items (base game + Space Age expansion)
local SCIENCE_PACKS = {
  -- Base game science packs
  "automation-science-pack",
  "logistic-science-pack",
  "military-science-pack",
  "chemical-science-pack",
  "production-science-pack",
  "utility-science-pack",
  "space-science-pack",
  -- Space Age expansion science packs
  "metallurgic-science-pack",
  "electromagnetic-science-pack",
  "agricultural-science-pack",
  "cryogenic-science-pack",
  "promethium-science-pack",
  -- Special overall science entity
  "science"
}

-- List of all quality levels
local QUALITIES = {
  "normal",
  "uncommon",
  "rare",
  "epic",
  "legendary"
}

-- Initialize global data
local function init_global()
  global = global or {}
  global.last_update_tick = 0
end

-- Get science statistics for a force
local function get_science_stats(force)
  local stats = {
    total = {},
    rate_1m = {}
  }

  -- Initialize stats for all science packs and quality combinations
  for _, science_name in ipairs(SCIENCE_PACKS) do
    for _, quality in ipairs(QUALITIES) do
      local key = {name = science_name, quality = quality}
      stats.total[key] = {
        produced = 0,
        consumed = 0,
        stored = 0,
      }
      stats.rate_1m[key] = {
        produced = 0,
        consumed = 0,
        stored = 0,
      }
    end
  end

  -- Iterate through all surfaces and sum up statistics
  for _, surface in pairs(game.surfaces) do
    local production_stats = force.get_item_production_statistics(surface)

    for _, science_name in ipairs(SCIENCE_PACKS) do
      for _, quality in ipairs(QUALITIES) do
        local key = {name = science_name, quality = quality}

        stats.total[key].produced = stats.total[key].produced + production_stats.get_output_count(key)
        stats.total[key].consumed = stats.total[key].consumed + production_stats.get_input_count(key)
        stats.total[key].stored = stats.total[key].stored + production_stats.get_storage_count(key)

        stats.rate_1m[key].produced = stats.rate_1m[key].produced + production_stats.get_flow_count{name={name = science_name, quality = quality}, category = 'input', precision_index = defines.flow_precision_index.one_minute}
        stats.rate_1m[key].consumed = stats.rate_1m[key].consumed + production_stats.get_flow_count{name={name = science_name, quality = quality}, category = 'output', precision_index = defines.flow_precision_index.one_minute}
        stats.rate_1m[key].stored = stats.rate_1m[key].stored + production_stats.get_flow_count{name={name = science_name, quality = quality}, category = 'storage', precision_index = defines.flow_precision_index.one_minute}
      end
    end
  end

  return stats
end

-- Get current research information
local function get_research_info(force)
  local research_info = {
    queue = {}
  }

  -- Get research queue (first entry is current research)
  for i, research in ipairs(force.research_queue) do
    local entry = {
      position = i,
      name = research.name,
      localised_name = research.localised_name,
      level = research.level or 1
    }

    -- Add progress for the current research (first in queue)
    if i == 1 then
      entry.progress = force.research_progress
    end

    table.insert(research_info.queue, entry)
  end

  return research_info
end

-- Collect and export statistics
local function export_statistics()
  -- Get the player force
  local player_force = game.forces["player"]
  if not player_force then
    return -- Exit if player force doesn't exist
  end

  local data = {
    timestamp = game.tick,
    game_time = game.ticks_played,
    science_packs = get_science_stats(player_force),
    research = get_research_info(player_force)
  }

  -- Convert to JSON
  local json_output = helpers.table_to_json(data)

  -- Write to file (goes to script-output folder)
  helpers.write_file("megabase-exporter/stats.json", json_output, false)
end

-- Main tick handler
local function on_tick(event)
  -- Check if it's time to update
  if event.tick - global.last_update_tick >= UPDATE_INTERVAL then
    global.last_update_tick = event.tick
    export_statistics()
  end
end

-- Register event handlers
script.on_init(init_global)
script.on_load(init_global)
script.on_event(defines.events.on_tick, on_tick)
