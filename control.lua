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

-- Get science statistics for a force
local function get_science_stats(force)
  local stats = {
    total = {},
    rate_1m = {}
  }

  -- Iterate through all surfaces and sum up statistics
  for _, surface in pairs(game.surfaces) do
    local production_stats = force.get_item_production_statistics(surface)

    for _, science_name in ipairs(SCIENCE_PACKS) do
      for _, quality in ipairs(QUALITIES) do
        local key_str = science_name .. "_" .. quality
        local stats_id = {name = science_name, quality = quality}

        -- Get values for this science pack
        local total_produced = production_stats.get_output_count(stats_id)
        local total_consumed = production_stats.get_input_count(stats_id)
        local rate_produced = production_stats.get_flow_count{name=stats_id, category = 'input', precision_index = defines.flow_precision_index.one_minute}
        local rate_consumed = production_stats.get_flow_count{name=stats_id, category = 'output', precision_index = defines.flow_precision_index.one_minute}

        -- Add total stats if there's any lifetime production or consumption
        if total_produced > 0 or total_consumed > 0 then
          if not stats.total[key_str] then
            stats.total[key_str] = {produced = 0, consumed = 0}
          end
          stats.total[key_str].produced = stats.total[key_str].produced + total_produced
          stats.total[key_str].consumed = stats.total[key_str].consumed + total_consumed
        end

        -- Add rate stats only if there's current production or consumption
        if rate_produced > 0 or rate_consumed > 0 then
          if not stats.rate_1m[key_str] then
            stats.rate_1m[key_str] = {produced = 0, consumed = 0}
          end
          stats.rate_1m[key_str].produced = stats.rate_1m[key_str].produced + rate_produced
          stats.rate_1m[key_str].consumed = stats.rate_1m[key_str].consumed + rate_consumed
        end
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

-- Build alert type mapping from defines (numeric ID to string name)
local function build_alert_type_mapping()
  local mapping = {}
  for name, id in pairs(defines.alert_type) do
    mapping[id] = name
  end
  return mapping
end

local ALERT_TYPE_NAMES = build_alert_type_mapping()

-- Get all alerts for all players
local function get_alerts()
  local all_alerts = {}
  
  for _, player in pairs(game.connected_players) do
    local player_alerts = player.get_alerts({})
    
    -- Iterate through surfaces
    for surface_index, surface_alerts in pairs(player_alerts) do
      local surface = game.surfaces[surface_index]
      local surface_name = surface.name
      
      -- Iterate through alert types
      for alert_type, alerts in pairs(surface_alerts) do
        -- Iterate through individual alerts
        for _, alert in ipairs(alerts) do
          local alert_entry = {
            tick = alert.tick,
            type = ALERT_TYPE_NAMES[alert_type] or "unknown",
            surface = surface_name
          }

          -- Use platform name if relevant
          if surface.platform then
            alert_entry.surface = surface.platform.name
          end
          
          -- Add target information if available
          if alert.target then
            alert_entry.target = alert.target.name
          end
          
          -- Add message if available (custom alerts)
          if alert.message then
            alert_entry.message = alert.message
          end
          
          table.insert(all_alerts, alert_entry)
        end
      end
    end
  end
  
  return all_alerts
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
    research = get_research_info(player_force),
    alerts = get_alerts()
  }

  -- Convert to JSON
  local json_output = helpers.table_to_json(data)

  -- Write to file (goes to script-output folder)
  helpers.write_file("megabase-exporter/stats.json", json_output, false)
end

-- Register event handlers
script.on_nth_tick(UPDATE_INTERVAL, export_statistics)
