<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables, type ChartOptions } from 'chart.js';
	import 'chartjs-adapter-date-fns';
	// @ts-ignore - chartjs-plugin-annotation types are not fully compatible
	import annotationPlugin from 'chartjs-plugin-annotation';
	import { historyStore } from '../stores/statsStore';
	import { detectGaps, getSignificantGaps, formatGapDuration } from '../utils/gapDetection';
	import { relativeTimeTickCallback, formatRelativeTime } from '../utils/timeFormatters';

	Chart.register(...registerables, annotationPlugin);

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	function updateChart() {
		if (!chart || !$historyStore.length) return;

		// Extract timestamps and eSPM data
		const timestamps = $historyStore.map(entry => entry.timestamp);
		const data = $historyStore.map((entry) => {
			const scienceNormalKey = 'science_normal';
			if (entry.data.science_packs.rate_1m[scienceNormalKey]) {
				return {
					x: entry.timestamp,
					y: entry.data.science_packs.rate_1m[scienceNormalKey].produced
				};
			}
			return { x: entry.timestamp, y: 0 };
		});

		// Detect gaps (expected interval: 5000ms, threshold: 2x = 10 seconds)
		const allGaps = detectGaps(timestamps, 5000, 2);
		// Only annotate significant gaps (> 2 minutes)
		const significantGaps = getSignificantGaps(allGaps, 120000);

		// Calculate Y axis range with headroom
		const values = data.map(d => d.y);
		const maxValue = Math.max(...values, 0);
		const yMax = maxValue * 1.1; // Add 10% headroom

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

		chart.data.datasets = [{
			label: 'eSPM',
			data,
			borderColor: '#ffa500',
			backgroundColor: 'rgba(255, 165, 0, 0.1)',
			borderWidth: 2,
			tension: 0.4,
			fill: true,
			pointRadius: 0,
			pointHoverRadius: 4,
			pointHoverBorderWidth: 2,
			pointHoverBorderColor: '#ffffff',
			pointHoverBackgroundColor: '#ffa500',
			spanGaps: false // Don't connect across gaps
		}];

		// Update Y axis scale
		if (chart.options.scales?.y) {
			chart.options.scales.y.min = 0;
			chart.options.scales.y.max = yMax;
		}

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
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'index',
					intersect: false
				},
				plugins: {
					decimation: {
						enabled: true,
						algorithm: 'lttb', // Largest-Triangle-Three-Buckets algorithm for downsampling
						samples: 100 // Target number of samples to display
					},
					legend: {
						display: false
					},
					// @ts-ignore - annotation plugin types
					annotation: {
						annotations: {}
					},
					tooltip: {
						enabled: true,
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						titleColor: '#ff7700',
						bodyColor: '#e0e0e0',
						borderColor: 'rgba(255, 119, 0, 0.5)',
						borderWidth: 1,
						padding: 8,
						titleFont: {
							family: 'monospace',
							size: 11
						},
						bodyFont: {
							family: 'monospace',
							size: 11
						},
						callbacks: {
							title: function(context: any) {
								const timestamp = context[0].parsed.x;
								return 'Time: ' + formatRelativeTime(timestamp);
							},
							label: function(context: any) {
								const value = context.parsed.y;
								if (value >= 1000000) {
									return 'eSPM: ' + (value / 1000000).toFixed(2) + 'M/m';
								} else if (value >= 1000) {
									return 'eSPM: ' + (value / 1000).toFixed(2) + 'k/m';
								} else {
									return 'eSPM: ' + value.toFixed(0) + '/m';
								}
							}
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
								size: 9
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
						display: true,
						grid: {
							color: 'rgba(255, 255, 255, 0.05)',
							drawTicks: false
						},
						ticks: {
							color: '#a0a0a0',
							font: {
								family: 'monospace',
								size: 9
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
			}
		});

		updateChart();
	});

	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});

	// Watch for store changes
	$effect(() => {
		if (chart && $historyStore) {
			updateChart();
		}
	});
</script>

<div class="mini-chart">
	<canvas bind:this={canvas}></canvas>
	{#if !$historyStore.length}
		<div class="loading">Loading...</div>
	{/if}
</div>

<style>
	.mini-chart {
		width: 100%;
		height: 150px;
		position: relative;
		box-sizing: border-box;
		max-width: 100%;
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
		font-size: 0.75rem;
		pointer-events: none;
	}

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.mini-chart {
			height: 120px;
		}
	}

	@media (max-width: 480px) {
		.mini-chart {
			height: 100px;
		}
	}
</style>
