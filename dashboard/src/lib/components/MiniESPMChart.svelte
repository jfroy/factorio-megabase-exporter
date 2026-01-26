<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { historyStore } from '../stores/statsStore';

	Chart.register(...registerables);

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	function updateChart() {
		if (!chart || !$historyStore.length) return;

		// Create time labels (relative time in minutes)
		const labels = $historyStore.map((entry, index) => {
			const minutesAgo = ($historyStore.length - index - 1) * 5 / 60; // 5 seconds per entry
			return minutesAgo > 0 ? `-${minutesAgo.toFixed(1)}m` : 'now';
		});

		// Extract eSPM data from science_normal production rate
		const data = $historyStore.map((entry) => {
			const scienceNormalKey = 'science_normal';
			if (entry.data.science_packs.rate_1m[scienceNormalKey]) {
				return entry.data.science_packs.rate_1m[scienceNormalKey].produced;
			}
			return 0;
		});

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
		height: 120px;
		position: relative;
		margin-top: 0.5rem;
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
</style>
