<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { historyStore } from '../stores/statsStore';

	Chart.register(...registerables);

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	function updateChart() {
		if (!chart || !$historyStore.length) return;

		// Create time labels from actual timestamps
		// Always include enough detail to avoid duplicate labels
		const now = Date.now();
		const labels = $historyStore.map((entry) => {
			const secondsAgo = Math.round((now - entry.timestamp) / 1000);
			
			if (secondsAgo < 60) {
				return `-${secondsAgo}s`;
			} else if (secondsAgo < 3600) {
				const minutes = Math.floor(secondsAgo / 60);
				const seconds = secondsAgo % 60;
				return `-${minutes}m ${seconds}s`;
			} else {
				const hours = Math.floor(secondsAgo / 3600);
				const remainingSeconds = secondsAgo % 3600;
				const minutes = Math.floor(remainingSeconds / 60);
				const seconds = remainingSeconds % 60;
				return `-${hours}h ${minutes}m ${seconds}s`;
			}
		});

		// Extract eSPM data from science_normal production rate
		const data = $historyStore.map((entry) => {
			const scienceNormalKey = 'science_normal';
			if (entry.data.science_packs.rate_1m[scienceNormalKey]) {
				return entry.data.science_packs.rate_1m[scienceNormalKey].produced;
			}
			return 0;
		});

		// Calculate Y axis range with headroom
		const maxValue = Math.max(...data, 0);
		const yMax = maxValue * 1.1; // Add 10% headroom

		chart.data.labels = labels;
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
			pointHoverBackgroundColor: '#ffa500'
		}];

		// Update Y axis scale
		if (chart.options.scales?.y) {
			chart.options.scales.y.min = 0;
			chart.options.scales.y.max = yMax;
		}
		
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
								return 'Time: ' + context[0].label;
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
							autoSkipPadding: 20
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
