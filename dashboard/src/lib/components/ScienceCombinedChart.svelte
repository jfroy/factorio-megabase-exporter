<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { historyStore } from '../stores/statsStore';
	import { getScienceColor } from '../utils/chartConfig';
	import { defaultChartOptions } from '../utils/chartConfig';
	import type { SciencePackType } from '../types/stats';

	Chart.register(...registerables);

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	// Filter out science packs with activity (production or consumption)
	// Exclude science_normal (eSPM) as it's shown in the mini chart
	function getActiveSciencePacks(history: any[]) {
		if (!history.length) return new Set<string>();
		
		const active = new Set<string>();
		const lastEntry = history[history.length - 1];
		
		for (const key in lastEntry.data.science_packs.rate_1m) {
			// Skip science_normal (eSPM)
			if (key.startsWith('science_normal')) continue;
			
			const stats = lastEntry.data.science_packs.rate_1m[key];
			if (stats.produced > 0 || stats.consumed > 0) {
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

		// Aggregate data by science pack type (sum across all qualities)
		const datasets: any[] = [];
		
		// Sort packs alphabetically
		const sortedPacks = Array.from(activePacks).sort();
		
		sortedPacks.forEach((packName) => {
			// Consumption data (solid line)
			const consumptionData = $historyStore.map((entry) => {
				let total = 0;
				for (const key in entry.data.science_packs.rate_1m) {
					if (key.startsWith(packName)) {
						total += entry.data.science_packs.rate_1m[key].consumed;
					}
				}
				return total;
			});

			// Production data (dashed line)
			const productionData = $historyStore.map((entry) => {
				let total = 0;
				for (const key in entry.data.science_packs.rate_1m) {
					if (key.startsWith(packName)) {
						total += entry.data.science_packs.rate_1m[key].produced;
					}
				}
				return total;
			});

			const color = getScienceColor(packName as SciencePackType);
			const prettyName = packName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
			
			// Consumption dataset (solid line)
			datasets.push({
				label: `${prettyName} (Consumed)`,
				data: consumptionData,
				borderColor: color,
				backgroundColor: color + '20',
				borderWidth: 2,
				tension: 0.4,
				pointRadius: 0,
				pointHoverRadius: 6,
				pointHoverBorderWidth: 2,
				pointHoverBorderColor: '#ffffff',
				pointHoverBackgroundColor: color,
				borderDash: [] // solid line
			});

			// Production dataset (dashed line)
			datasets.push({
				label: `${prettyName} (Produced)`,
				data: productionData,
				borderColor: color,
				backgroundColor: 'transparent',
				borderWidth: 2,
				tension: 0.4,
				pointRadius: 0,
				pointHoverRadius: 6,
				pointHoverBorderWidth: 2,
				pointHoverBorderColor: '#ffffff',
				pointHoverBackgroundColor: color,
				borderDash: [5, 5] // dashed line
			});
		});

		chart.data.labels = labels;
		chart.data.datasets = datasets;
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
						text: 'Science Pack Production & Consumption (items/minute)',
						color: '#e0e0e0',
						font: {
							family: 'monospace',
							size: 14,
							weight: 'bold'
						}
					},
					tooltip: {
						enabled: false,
						external: function(context: any) {
							// Get or create tooltip element
							let tooltipEl = document.getElementById('chartjs-tooltip');
							
							if (!tooltipEl) {
								tooltipEl = document.createElement('div');
								tooltipEl.id = 'chartjs-tooltip';
								tooltipEl.style.position = 'absolute';
								tooltipEl.style.pointerEvents = 'none';
								tooltipEl.style.transition = 'all .1s ease';
								document.body.appendChild(tooltipEl);
							}
							
							const tooltipModel = context.tooltip;
							if (tooltipModel.opacity === 0) {
								tooltipEl.style.opacity = '0';
								return;
							}
							
							// Build tooltip content
							if (tooltipModel.body) {
								const titleLines = tooltipModel.title || [];
								const bodyLines = tooltipModel.body.map((b: any) => b.lines);
								
								let innerHtml = '<div style="background: rgba(0, 0, 0, 0.9); border: 1px solid rgba(255, 119, 0, 0.5); border-radius: 4px; padding: 8px; font-family: monospace; font-size: 11px;">';
								
								// Title
								titleLines.forEach((title: string) => {
									innerHtml += '<div style="color: #ff7700; margin-bottom: 6px; font-weight: bold;">' + title + '</div>';
								});
								
								// Body
								tooltipModel.dataPoints.forEach((dataPoint: any, i: number) => {
									const dataset = context.chart.data.datasets[dataPoint.datasetIndex];
									const label = dataset.label;
									const value = dataPoint.formattedValue;
									const color = dataset.borderColor;
									const isProduced = label.includes('(Produced)');
									
									// Format value
									const numValue = dataPoint.parsed.y;
									let formattedValue;
									if (numValue >= 1000000) {
										formattedValue = (numValue / 1000000).toFixed(2) + 'M/m';
									} else if (numValue >= 1000) {
										formattedValue = (numValue / 1000).toFixed(2) + 'k/m';
									} else {
										formattedValue = numValue.toFixed(0) + '/m';
									}
									
									// Create line indicator (solid or dashed)
									const lineStyle = isProduced 
										? `border-top: 2px dashed ${color}; width: 20px;`
										: `border-top: 2px solid ${color}; width: 20px;`;
									
									innerHtml += '<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">';
									innerHtml += '<div style="' + lineStyle + '"></div>';
									innerHtml += '<span style="color: #e0e0e0;">' + label + ': ' + formattedValue + '</span>';
									innerHtml += '</div>';
								});
								
								// Total
								if (tooltipModel.dataPoints.length > 0) {
									let total = 0;
									tooltipModel.dataPoints.forEach((dp: any) => {
										total += dp.parsed.y || 0;
									});
									
									const totalStr = total >= 1000000 
										? (total / 1000000).toFixed(2) + 'M/m'
										: total >= 1000 
											? (total / 1000).toFixed(2) + 'k/m'
											: total.toFixed(0) + '/m';
									
									innerHtml += '<div style="border-top: 1px solid rgba(255, 255, 255, 0.2); margin-top: 6px; padding-top: 6px; color: #e0e0e0;">Total: ' + totalStr + '</div>';
								}
								
								innerHtml += '</div>';
								tooltipEl.innerHTML = innerHtml;
							}
							
							// Position tooltip
							const position = context.chart.canvas.getBoundingClientRect();
							tooltipEl.style.opacity = '1';
							tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
							tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
						}
					},
					legend: {
						display: true,
						position: 'bottom',
						labels: {
							color: '#e0e0e0',
							font: {
								family: 'monospace',
								size: 10
							},
							boxWidth: 20,
							boxHeight: 2,
							padding: 10,
							usePointStyle: false
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
		// Clean up tooltip element
		const tooltipEl = document.getElementById('chartjs-tooltip');
		if (tooltipEl) {
			tooltipEl.remove();
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
