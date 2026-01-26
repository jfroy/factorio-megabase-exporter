<script lang="ts">
	import { Chart, registerables } from 'chart.js';
	import { historyStore } from '../stores/statsStore.svelte';
	import { getScienceColor } from '../utils/chartConfig';
	import { defaultChartOptions } from '../utils/chartConfig';
	import type { SciencePackType } from '../types/stats';

	Chart.register(...registerables);

	let canvas = $state<HTMLCanvasElement | null>(null);
	let chart = $state<Chart | null>(null);
	let history = $derived(historyStore.value);

	// Filter out science packs with no consumption activity
	function getActiveSciencePacks(history: any[]) {
		if (!history.length) return new Set<string>();
		
		const active = new Set<string>();
		const lastEntry = history[history.length - 1];
		
		for (const key in lastEntry.data.science_packs.rate_1m) {
			const stats = lastEntry.data.science_packs.rate_1m[key];
			if (stats.consumed > 0) {
				// Extract just the science pack name without quality
				const packName = key.split('_').slice(0, -1).join('-');
				active.add(packName);
			}
		}
		
		return active;
	}

	function updateChart() {
		if (!chart || !history.length) return;

		const activePacks = getActiveSciencePacks(history);
		
		// Create time labels (relative time in minutes)
		const labels = history.map((entry, index) => {
			const minutesAgo = (history.length - index - 1) * 5 / 60; // 5 seconds per entry
			return minutesAgo > 0 ? `-${minutesAgo.toFixed(1)}m` : 'now';
		});

		// Aggregate data by science pack type (sum across all qualities)
		const datasets: any[] = [];
		
		activePacks.forEach((packName) => {
			const data = history.map((entry) => {
				let total = 0;
				for (const key in entry.data.science_packs.rate_1m) {
					if (key.startsWith(packName)) {
						total += entry.data.science_packs.rate_1m[key].consumed;
					}
				}
				return total;
			});

			const color = getScienceColor(packName as SciencePackType);
			
			datasets.push({
				label: packName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
				data,
				borderColor: color,
				backgroundColor: color + '20',
				borderWidth: 2,
				tension: 0.4,
				pointRadius: 0,
				pointHoverRadius: 6,
				pointHoverBorderWidth: 2,
				pointHoverBorderColor: '#ffffff',
				pointHoverBackgroundColor: color
			});
		});

		chart.data.labels = labels;
		chart.data.datasets = datasets;
		chart.update('none'); // Update without animation
	}

	// Initialize chart when canvas is ready
	$effect(() => {
		if (!canvas) return;

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
						text: 'Science Consumption Rate (items/minute)',
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
								
								// Calculate total consumption for this time point
								let total = 0;
								context.forEach((item: any) => {
									total += item.parsed.y || 0;
								});
								
								const totalStr = total >= 1000000 
									? (total / 1000000).toFixed(2) + 'M/m'
									: total >= 1000 
										? (total / 1000).toFixed(2) + 'k/m'
										: total.toFixed(0) + '/m';
								
								return ['\n─────────────', 'Total Consumption: ' + totalStr];
							}
						}
					}
				}
			} as any
		}) as any;

		updateChart();

		// Cleanup on unmount
		return () => {
			if (chart) {
				chart.destroy();
				chart = null;
			}
		};
	});

	// Watch for history changes and update chart
	$effect(() => {
		if (chart && history) {
			updateChart();
		}
	});
</script>

<div class="chart-container">
	<canvas bind:this={canvas}></canvas>
	{#if !history.length}
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
