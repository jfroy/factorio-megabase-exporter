<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { historyStore } from '../stores/statsStore';
	import { getScienceColor } from '../utils/chartConfig';
	import { defaultChartOptions } from '../utils/chartConfig';
	import { getSciencePackShortName } from '../utils/formatters';
	import type { SciencePackType } from '../types/stats';

	Chart.register(...registerables);

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	// Filter out science packs with no production activity
	function getActiveSciencePacks(history: any[]) {
		if (!history.length) return new Set<string>();
		
		const active = new Set<string>();
		const lastEntry = history[history.length - 1];
		
		for (const key in lastEntry.data.science_packs.rate_1m) {
			const stats = lastEntry.data.science_packs.rate_1m[key];
			if (stats.produced > 0) {
				// Extract just the science pack name without quality
				const packName = key.split('_').slice(0, -1).join('-');
				active.add(packName);
			}
		}
		
		return active;
	}

	function updateChart() {
		if (!chart || !$historyStore.length) return;

		const activePacks = getActiveSciencePacks($historyStore);
		
		// Create time labels (relative time in minutes)
		const labels = $historyStore.map((entry, index) => {
			const minutesAgo = ($historyStore.length - index - 1) * 5 / 60; // 5 seconds per entry
			return minutesAgo > 0 ? `-${minutesAgo.toFixed(1)}m` : 'now';
		});

		// Build expected dataset structure
		const expectedDatasets: Array<{label: string, data: any[], config: any}> = [];
		
		activePacks.forEach((packName) => {
			const data = $historyStore.map((entry) => {
				let total = 0;
				for (const key in entry.data.science_packs.rate_1m) {
					if (key.startsWith(packName)) {
						total += entry.data.science_packs.rate_1m[key].produced;
					}
				}
				return total;
			});

			const color = getScienceColor(packName as SciencePackType);
			
			expectedDatasets.push({
				label: getSciencePackShortName(packName),
				data,
				config: {
					borderColor: color,
					backgroundColor: color + '20',
					borderWidth: 2,
					tension: 0.4,
					pointRadius: 0,
					pointHoverRadius: 6,
					pointHoverBorderWidth: 2,
					pointHoverBorderColor: '#ffffff',
					pointHoverBackgroundColor: color
				}
			});
		});

		// Update or create datasets to match expected structure
		const datasetsByLabel = new Map(chart.data.datasets.map(ds => [ds.label || '', ds]));
		
		chart.data.labels = labels;
		chart.data.datasets = expectedDatasets.map(expected => {
			const existing = datasetsByLabel.get(expected.label);
			if (existing) {
				// Update existing dataset's data in place
				existing.data = expected.data;
				return existing;
			} else {
				// Create new dataset with data and config
				return {
					label: expected.label,
					data: expected.data,
					...expected.config
				};
			}
		});
		
		chart.update('none'); // Update without animation
	}

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: [],
				datasets: []
			},
			options: {
				...defaultChartOptions,
				plugins: {
					...defaultChartOptions.plugins,
					title: {
						display: true,
						text: 'Science Production Rate (items/minute)',
						color: '#e0e0e0',
						font: {
							family: 'monospace',
							size: 14,
							weight: 'bold'
						}
					},
					tooltip: {
						...defaultChartOptions.plugins?.tooltip,
						callbacks: {
							...defaultChartOptions.plugins?.tooltip?.callbacks,
							title: function(context: any) {
								return 'Time: ' + context[0].label;
							},
							label: function(context: any) {
								let label = context.dataset.label || '';
								if (label) {
									label += ': ';
								}
								if (context.parsed.y !== null) {
									const value = context.parsed.y;
									if (value >= 1000000) {
										label += (value / 1000000).toFixed(2) + 'M/m';
									} else if (value >= 1000) {
										label += (value / 1000).toFixed(2) + 'k/m';
									} else {
										label += value.toFixed(0) + '/m';
									}
								}
								return label;
							},
							afterBody: function(context: any) {
								if (context.length === 0) return [];
								
								// Calculate total production for this time point
								let total = 0;
								context.forEach((item: any) => {
									total += item.parsed.y || 0;
								});
								
								const totalStr = total >= 1000000 
									? (total / 1000000).toFixed(2) + 'M/m'
									: total >= 1000 
										? (total / 1000).toFixed(2) + 'k/m'
										: total.toFixed(0) + '/m';
								
								return ['\n─────────────', 'Total Production: ' + totalStr];
							}
						}
					}
				}
			} as any
		});

		updateChart();
	});

	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});

	// Watch for store changes - use $effect in runes mode
	$effect(() => {
		if (chart && $historyStore) {
			updateChart();
		}
	});
</script>

<div class="chart-container">
	<canvas bind:this={canvas}></canvas>
	{#if !$historyStore.length}
		<div class="loading">Waiting for data...</div>
	{/if}
</div>

<style>
	.chart-container {
		width: 100%;
		height: 100%;
		min-height: 300px;
		position: relative;
	}

	canvas {
		width: 100% !important;
		height: 100% !important;
	}

	.loading {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: #a0a0a0;
		font-family: monospace;
		pointer-events: none;
	}
</style>
