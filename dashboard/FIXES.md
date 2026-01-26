# Dashboard Fixes Applied

## Issue: Svelte 5 Compatibility Error

### Problem
The dashboard was throwing a 500 error with the following console message:
```
Error: Your application, or one of its dependencies, imported from 'svelte/internal', 
which was a private module used by Svelte 4 components that no longer exists in Svelte 5.
```

### Root Cause
The `svelte-chartjs` wrapper package was incompatible with Svelte 5 (which is the version we're using). It relied on Svelte 4 internal APIs that have been removed.

### Solution Applied
1. **Removed** the `svelte-chartjs` package dependency
2. **Rewrote** both chart components to use Chart.js directly:
   - `ScienceProductionChart.svelte`
   - `ScienceConsumptionChart.svelte`
3. **Used** Svelte's `onMount` and `onDestroy` lifecycle hooks to manage Chart.js instances
4. **Rebuilt** the dashboard with the fixes

### Changes Made

#### Before (using svelte-chartjs wrapper):
```svelte
import { Line } from 'svelte-chartjs';
<Line data={chartData} {options} />
```

#### After (using Chart.js directly):
```svelte
import { Chart } from 'chart.js';

let canvas: HTMLCanvasElement;
let chart: Chart | null = null;

onMount(() => {
  chart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { ... },
    options: { ... }
  });
});

<canvas bind:this={canvas}></canvas>
```

### Result
✅ Dashboard now loads without errors
✅ Charts render correctly
✅ Fully compatible with Svelte 5
✅ Bundle size reduced (removed unnecessary wrapper)

### How to Apply
The fixes are already applied and the dashboard has been rebuilt. Simply restart your server:

```bash
cd dashboard
bun run start
```

Or use the convenient script:
```bash
./start-dashboard.sh
```

## Verification

After starting the server, you should see:
- No console errors
- Charts rendering with production/consumption data
- Real-time updates every 5 seconds
- All components working correctly

If you still see issues, try:
1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check that stats.json exists and is being updated by the Factorio mod
