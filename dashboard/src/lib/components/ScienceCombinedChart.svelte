<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import 'chartjs-adapter-date-fns';
	// @ts-ignore - chartjs-plugin-annotation types are not fully compatible
	import annotationPlugin from 'chartjs-plugin-annotation';
	import { historyStore } from '../stores/statsStore';
	import { getScienceColor } from '../utils/chartConfig';
	import { defaultChartOptions } from '../utils/chartConfig';
	import { getSciencePackShortName } from '../utils/formatters';
	import { detectGaps, getSignificantGaps, formatGapDuration } from '../utils/gapDetection';
	import { relativeTimeTickCallback, formatRelativeTime } from '../utils/timeFormatters';
	import type { SciencePackType } from '../types/stats';

	Chart.register(...registerables, annotationPlugin);

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	// Filter out science packs with activity (production or consumption)
	function getActiveSciencePacks(history: any[]) {
		if (!history.length) return new Set<string>();
		
		const active = new Set<string>();
		const lastEntry = history[history.length - 1];
		
		for (const key in lastEntry.data.science_packs.rate_1m) {
			// Skip science_normal (eSPM) - it will be added separately
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
		
		// Extract timestamps for gap detection
		const timestamps = $historyStore.map(entry => entry.timestamp);

		// Detect gaps (expected interval: 5000ms, threshold: 2x = 10 seconds)
		const allGaps = detectGaps(timestamps, 5000, 2);
		// Only annotate significant gaps (> 2 minutes)
		const significantGaps = getSignificantGaps(allGaps, 120000);

		// Aggregate data by science pack type (sum across all qualities)
		const datasets: any[] = [];
		
		// First, add eSPM data (will use right Y-axis)
		const espmData = $historyStore.map((entry) => {
			const scienceNormalKey = 'science_normal';
			if (entry.data.science_packs.rate_1m[scienceNormalKey]) {
				return {
					x: entry.timestamp,
					y: entry.data.science_packs.rate_1m[scienceNormalKey].produced
				};
			}
			return { x: entry.timestamp, y: 0 };
		});

		datasets.push({
			label: 'eSPM',
			data: espmData,
			borderColor: '#ffa500',
			backgroundColor: 'transparent',
			borderWidth: 2,
			tension: 0.4,
			fill: false,
			pointRadius: 0,
			pointHoverRadius: 6,
			pointHoverBorderWidth: 2,
			pointHoverBorderColor: '#ffffff',
			pointHoverBackgroundColor: '#ffa500',
			spanGaps: false,
			yAxisID: 'y1' // Use right Y-axis
		});
		
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
				return {
					x: entry.timestamp,
					y: total
				};
			});

			// Production data (dashed line)
			const productionData = $historyStore.map((entry) => {
				let total = 0;
				for (const key in entry.data.science_packs.rate_1m) {
					if (key.startsWith(packName)) {
						total += entry.data.science_packs.rate_1m[key].produced;
					}
				}
				return {
					x: entry.timestamp,
					y: total
				};
			});

		const color = getScienceColor(packName as SciencePackType);
		const prettyName = getSciencePackShortName(packName);
		
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
				borderDash: [], // solid line
				spanGaps: false,
				yAxisID: 'y' // Use left Y-axis
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
				borderDash: [5, 5], // dashed line
				spanGaps: false,
				yAxisID: 'y' // Use left Y-axis
			});
		});

		// Create gap annotations
		const annotations: any = {};
		significantGaps.forEach((gap, index) => {
			const midpoint = (gap.startTimestamp + gap.endTimestamp) / 2;
			annotations[`gap${index}`] = {
				type: 'line',
				xMin: midpoint,
				xMax: midpoint,
				borderColor: 'rgba(255, 0, 0, 0.5)',
				borderWidth: 2,
				borderDash: [5, 5],
				label: {
					display: true,
					content: formatGapDuration(gap.duration),
					position: 'start',
					backgroundColor: 'rgba(255, 0, 0, 0.8)',
					color: '#ffffff',
					font: {
						family: 'monospace',
						size: 9
					},
					padding: 4,
					rotation: 0
				}
			};
		});

		chart.data.datasets = datasets;

		// Update annotations
		// @ts-ignore - annotation plugin types
		if (chart.options.plugins?.annotation) {
			// @ts-ignore - annotation plugin types
			chart.options.plugins.annotation.annotations = annotations;
		}

		chart.update('none'); // Update without animation
	}

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				datasets: []
			},
			options: {
				...defaultChartOptions,
				plugins: {
					...defaultChartOptions.plugins,
					decimation: {
						enabled: true,
						algorithm: 'lttb', // Largest-Triangle-Three-Buckets algorithm for downsampling
						samples: 100 // Target number of samples to display
					},
					title: {
						display: false
					},
					// @ts-ignore - annotation plugin types
					annotation: {
						annotations: {}
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
								
								// Title - show timestamp
								if (tooltipModel.dataPoints.length > 0) {
									const timestamp = tooltipModel.dataPoints[0].parsed.x;
									innerHtml += '<div style="color: #ff7700; margin-bottom: 6px; font-weight: bold;">Time: ' + formatRelativeTime(timestamp) + '</div>';
								}
								
								// Body
								tooltipModel.dataPoints.forEach((dataPoint: any, i: number) => {
									const dataset = context.chart.data.datasets[dataPoint.datasetIndex];
									const label = dataset.label;
									const value = dataPoint.formattedValue;
									const color = dataset.borderColor;
									const isProduced = label.includes('(Produced)');
									const isESPM = label === 'eSPM';
									
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
									
									// Create line indicator (solid, dashed, or filled for eSPM)
									let lineStyle;
									if (isESPM) {
										lineStyle = `background: ${color}; width: 20px; height: 10px; opacity: 0.5;`;
									} else if (isProduced) {
										lineStyle = `border-top: 2px dashed ${color}; width: 20px;`;
									} else {
										lineStyle = `border-top: 2px solid ${color}; width: 20px;`;
									}
									
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
							
							// Calculate tooltip position relative to the mouse/caret
							const tooltipX = position.left + window.pageXOffset + tooltipModel.caretX;
							const tooltipY = position.top + window.pageYOffset + tooltipModel.caretY;
							
							// Get tooltip dimensions (need to render first to measure)
							tooltipEl.style.left = tooltipX + 'px';
							tooltipEl.style.top = tooltipY + 'px';
							
							// Wait for layout to get dimensions
							const rect = tooltipEl.getBoundingClientRect();
							const tooltipWidth = rect.width;
							const tooltipHeight = rect.height;
							
							// Calculate optimal position with viewport boundaries
							const padding = 10; // Padding from viewport edges
							const offset = 15; // Offset from cursor
							
							let finalX = tooltipX + offset;
							let finalY = tooltipY + offset;
							
							// Check right boundary
							if (finalX + tooltipWidth + padding > window.innerWidth) {
								finalX = tooltipX - tooltipWidth - offset;
							}
							
							// Check bottom boundary
							if (finalY + tooltipHeight + padding > window.innerHeight + window.pageYOffset) {
								finalY = tooltipY - tooltipHeight - offset;
							}
							
							// Check left boundary
							if (finalX < padding) {
								finalX = padding;
							}
							
							// Check top boundary
							if (finalY < window.pageYOffset + padding) {
								finalY = window.pageYOffset + padding;
							}
							
							tooltipEl.style.left = finalX + 'px';
							tooltipEl.style.top = finalY + 'px';
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
				},
				scales: {
					x: {
						type: 'time',
						display: true,
						grid: {
							color: 'rgba(255, 255, 255, 0.05)',
							drawTicks: false
						},
						ticks: {
							color: '#a0a0a0',
							font: {
								family: 'monospace',
								size: 10
							},
							maxRotation: 0,
							autoSkipPadding: 20,
							callback: relativeTimeTickCallback
						},
						border: {
							display: false
						}
					},
					y: {
						type: 'linear',
						display: true,
						position: 'left',
						grid: {
							color: 'rgba(255, 255, 255, 0.05)',
							drawTicks: false
						},
						ticks: {
							color: '#a0a0a0',
							font: {
								family: 'monospace',
								size: 10
							},
							callback: function(value: any) {
								if (value >= 1000000) {
									return (value / 1000000).toFixed(1) + 'M';
								} else if (value >= 1000) {
									return (value / 1000).toFixed(0) + 'k';
								}
								return value;
							}
						},
						border: {
							display: false
						}
					},
					y1: {
						type: 'linear',
						display: true,
						position: 'right',
						min: 0,
						grid: {
							drawOnChartArea: false, // Don't draw grid lines for right axis
							drawTicks: false
						},
						ticks: {
							color: '#ffa500', // Orange color to match eSPM
							font: {
								family: 'monospace',
								size: 10
							},
							callback: function(value: any) {
								if (value >= 1000000) {
									return (value / 1000000).toFixed(1) + 'M';
								} else if (value >= 1000) {
									return (value / 1000).toFixed(0) + 'k';
								}
								return value;
							}
						},
						border: {
							display: false
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

<div class="science-chart">
	<div class="chart-container">
		<canvas bind:this={canvas}></canvas>
		{#if !$historyStore.length}
			<div class="loading">Waiting for data...</div>
		{/if}
	</div>
</div>

<style>
	.science-chart {
		display: flex;
		flex-direction: column;
		height: 100%;
		max-height: 100%;
		box-sizing: border-box;
		max-width: 100%;
		overflow: hidden;
	}

	.chart-container {
		width: 100%;
		height: 100%;
		max-height: 100%;
		position: relative;
		box-sizing: border-box;
		overflow: hidden;
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

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.chart-container {
			min-height: 250px;
		}
	}

	@media (max-width: 480px) {
		.chart-container {
			min-height: 200px;
		}
	}
</style>
