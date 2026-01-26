# Dashboard Updates - Change Log

## Changes Made

### 1. Fixed Svelte 5 Compatibility ✅
- **Problem**: `svelte-chartjs` was incompatible with Svelte 5
- **Solution**: Removed wrapper and integrated Chart.js directly
- **Impact**: Dashboard now loads without errors

### 2. Updated Research Progress Display ✅

#### Changed "Science/min" to "eSPM"
- **Label**: Now shows "eSPM" instead of "Science/min"
- **Data Source**: Uses `science_normal` production rate from stats
- **Formula**: `stats.science_packs.rate_1m['science_normal'].produced`

#### Improved Time Estimation Algorithm
- **Old Method**: Simple calculation based on current progress and instant rate
- **New Method**: Progress history tracking with moving average
- **Features**:
  - Keeps last 10 progress updates in history buffer
  - Calculates average progress rate from historical data
  - Automatically resets when research changes (different tech or level)
  - Shows "Calculating..." while gathering initial data points
  - More accurate estimates that smooth out rate fluctuations

**Implementation Details**:
```typescript
interface ProgressEntry {
  timestamp: number;
  progress: number;
  techName: string;
  techLevel: number;
}

// Tracks last 10 progress updates
let progressHistory: ProgressEntry[] = [];

// Resets when tech changes
if (currentTechId !== lastTechId) {
  progressHistory = [];
}

// Calculates rate from oldest to newest entry
const progressPerSecond = progressDiff / timeDiff;
const secondsRemaining = remainingProgress / progressPerSecond;
```

### 3. Enhanced Chart Mouse-Over Support ✅

#### Improved Tooltips
- **Mode**: "index" - Shows all datasets at the hovered x-position
- **Intersect**: false - Triggers without needing to hover directly on line
- **Styling**:
  - Dark background with orange border matching Factorio theme
  - Monospace font for consistency
  - Larger padding for better readability

#### Tooltip Features
- **Title**: Shows the time point (e.g., "Time: -2.5m")
- **Body**: Lists each science pack with formatted rate
- **Footer**: Shows total production/consumption for that time point
- **Format**: Values formatted as M/m, k/m, or /m depending on magnitude

#### Visual Feedback
- **Point Hover Size**: Increased to 6px (from 4px)
- **Hover Border**: White 2px border around hovered point
- **Background Color**: Maintains science pack color
- **Interaction**: Smooth and responsive

**Example Tooltip**:
```
Time: -2.5m
─────────────
Automation Science Pack: 97.72k/m
Logistic Science Pack: 97.67k/m
Chemical Science Pack: 101.14k/m
...
─────────────
Total Production: 650.45k/m
```

### 4. Server Configuration Update ✅
- Updated stats path to match Factorio's actual output location
- Now points to: `script-output/megabase-exporter/stats.json`

## Technical Details

### Files Modified
1. `dashboard/src/lib/components/ResearchProgress.svelte`
   - Added progress history tracking
   - Changed eSPM calculation
   - Improved time estimation

2. `dashboard/src/lib/components/ScienceProductionChart.svelte`
   - Enhanced tooltip configuration
   - Added hover point styling
   - Improved total calculation in tooltip

3. `dashboard/src/lib/components/ScienceConsumptionChart.svelte`
   - Same enhancements as production chart
   - Consumption-specific tooltip messages

4. `dashboard/src/lib/utils/chartConfig.ts`
   - Comprehensive tooltip configuration
   - Better number formatting
   - Enhanced interaction settings

5. `dashboard/server.ts`
   - Updated stats path to correct location

### Chart.js Configuration Highlights

```typescript
interaction: {
  mode: 'index',
  intersect: false,
}

tooltip: {
  enabled: true,
  mode: 'index',
  intersect: false,
  backgroundColor: 'rgba(0, 0, 0, 0.95)',
  titleColor: '#ff7700',
  bodyColor: '#e0e0e0',
  borderColor: '#ff7700',
  borderWidth: 2,
  // ... custom callbacks
}
```

## Testing

Build completed successfully:
- No TypeScript errors
- No linter warnings
- Bundle size: ~231KB (gzipped: ~80KB)

## How to Use

1. Restart the dashboard server:
   ```bash
   cd dashboard
   bun run start
   ```

2. Open http://localhost:3000

3. Refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)

4. Test the new features:
   - Hover over charts to see enhanced tooltips
   - Watch "Est. Time" improve accuracy as data accumulates
   - Verify eSPM shows correct production rate

## Expected Behavior

### Charts
- Hovering anywhere on the chart shows a vertical line at that time point
- Tooltip appears showing all active science packs at that moment
- Total production/consumption shown at bottom of tooltip
- Points highlight when hovered near them

### Research Progress
- "eSPM" shows `science_normal` production rate
- "Est. Time" shows "Calculating..." initially
- After ~10-20 seconds, time estimate stabilizes
- When research changes, counter resets and starts fresh

## Notes

- Progress history buffer limited to 10 entries to prevent memory bloat
- Time estimates may fluctuate initially but stabilize over 30-60 seconds
- Tooltip totals help identify bottlenecks in production/consumption
- All changes maintain Factorio theme consistency
