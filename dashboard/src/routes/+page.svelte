<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { statsStore, lastUpdateStore, errorStore, startStatsPolling, refreshStats } from '../lib/stores/statsStore';
	import { formatTime, formatTimestamp } from '../lib/utils/formatters';
	
	import ScienceProductionChart from '../lib/components/ScienceProductionChart.svelte';
	import ScienceConsumptionChart from '../lib/components/ScienceConsumptionChart.svelte';
	import ScienceRateIndicator from '../lib/components/ScienceRateIndicator.svelte';
	import ResearchProgress from '../lib/components/ResearchProgress.svelte';
	import ResearchQueue from '../lib/components/ResearchQueue.svelte';
	
	import '../app.css';

	let stopPolling = $state<(() => void) | null>(null);

	let gameTime = $derived($statsStore ? formatTime($statsStore.game_time) : '--');
	let lastUpdate = $derived(formatTimestamp($lastUpdateStore));
	let hasError = $derived($errorStore !== null);

	onMount(() => {
		// Start polling for stats every 5 seconds
		stopPolling = startStatsPolling(5000);
	});

	onDestroy(() => {
		if (stopPolling) {
			stopPolling();
		}
	});
</script>

<svelte:head>
	<title>Factorio Megabase Dashboard</title>
</svelte:head>

<div class="dashboard">
	<!-- Header -->
	<header class="header">
		<div class="header-content">
			<div class="title-section">
				<h1>Factorio Megabase Dashboard</h1>
				<div class="subtitle">Real-time Factory Statistics</div>
			</div>
			
			<div class="stats-section">
				<div class="stat-item">
					<span class="stat-label">Game Time:</span>
					<span class="stat-value">{gameTime}</span>
				</div>
				<div class="stat-item">
					<span class="stat-label">Last Update:</span>
					<span class="stat-value">{lastUpdate}</span>
				</div>
				<button class="refresh-btn" onclick={refreshStats}>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
						<path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
						<path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
					</svg>
					Refresh
				</button>
			</div>
		</div>
		
		{#if hasError}
			<div class="error-banner">
				⚠️ Error: {$errorStore}
			</div>
		{/if}
	</header>

	<!-- Main Content -->
	<main class="main-content">
		<!-- Left Column: Charts -->
		<div class="left-column">
			<div class="chart-card">
				<ScienceProductionChart />
			</div>
			<div class="chart-card">
				<ScienceConsumptionChart />
			</div>
		</div>

		<!-- Right Column: Research & Rates -->
		<div class="right-column">
			<div class="research-card">
				<ResearchProgress />
			</div>
			<div class="queue-card">
				<ResearchQueue />
			</div>
			<div class="rates-card">
				<ScienceRateIndicator />
			</div>
		</div>
	</main>

	<!-- Footer -->
	<footer class="footer">
		<div class="footer-content">
			<span>Factorio Megabase Exporter Dashboard</span>
			<span class="separator">•</span>
			<a href="https://lua-api.factorio.com/" target="_blank" rel="noopener noreferrer">API Docs</a>
			<span class="separator">•</span>
			<a href="https://wiki.factorio.com/Science_pack" target="_blank" rel="noopener noreferrer">Science Pack Wiki</a>
		</div>
	</footer>
</div>

<style>
	.dashboard {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
	}

	/* Header */
	.header {
		background: rgba(0, 0, 0, 0.5);
		border-bottom: 2px solid rgba(255, 119, 0, 0.5);
		padding: 1rem 2rem;
		backdrop-filter: blur(10px);
	}

	.header-content {
		max-width: 1800px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.title-section h1 {
		color: #ff7700;
		font-family: monospace;
		font-size: 1.8rem;
		margin: 0;
		text-shadow: 0 0 10px rgba(255, 119, 0, 0.5);
	}

	.subtitle {
		color: #a0a0a0;
		font-family: monospace;
		font-size: 0.9rem;
		margin-top: 0.25rem;
	}

	.stats-section {
		display: flex;
		gap: 2rem;
		align-items: center;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		color: #a0a0a0;
		font-family: monospace;
		font-size: 0.75rem;
	}

	.stat-value {
		color: #e0e0e0;
		font-family: monospace;
		font-size: 1rem;
		font-weight: bold;
	}

	.refresh-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(255, 119, 0, 0.2);
		border: 1px solid rgba(255, 119, 0, 0.5);
		border-radius: 4px;
		color: #ff7700;
		font-family: monospace;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.refresh-btn:hover {
		background: rgba(255, 119, 0, 0.3);
		border-color: rgba(255, 119, 0, 0.7);
	}

	.refresh-btn:active {
		transform: scale(0.95);
	}

	.error-banner {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		background: rgba(255, 0, 0, 0.2);
		border: 1px solid rgba(255, 0, 0, 0.5);
		border-radius: 4px;
		color: #ffaaaa;
		font-family: monospace;
		font-size: 0.9rem;
		text-align: center;
	}

	/* Main Content */
	.main-content {
		flex: 1;
		max-width: 1800px;
		width: 100%;
		margin: 0 auto;
		padding: 2rem;
		display: grid;
		grid-template-columns: 1fr 400px;
		gap: 1.5rem;
	}

	.left-column {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.right-column {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.chart-card {
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 119, 0, 0.3);
		border-radius: 8px;
		padding: 1.5rem;
		min-height: 350px;
		backdrop-filter: blur(5px);
	}

	.research-card {
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 119, 0, 0.3);
		border-radius: 8px;
		backdrop-filter: blur(5px);
		min-height: 200px;
	}

	.queue-card {
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 119, 0, 0.3);
		border-radius: 8px;
		backdrop-filter: blur(5px);
		min-height: 250px;
		max-height: 350px;
	}

	.rates-card {
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 119, 0, 0.3);
		border-radius: 8px;
		backdrop-filter: blur(5px);
		min-height: 300px;
	}

	/* Footer */
	.footer {
		background: rgba(0, 0, 0, 0.5);
		border-top: 1px solid rgba(255, 119, 0, 0.3);
		padding: 1rem 2rem;
		backdrop-filter: blur(10px);
	}

	.footer-content {
		max-width: 1800px;
		margin: 0 auto;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		color: #a0a0a0;
		font-family: monospace;
		font-size: 0.85rem;
	}

	.footer a {
		color: #ff7700;
		text-decoration: none;
		transition: color 0.2s;
	}

	.footer a:hover {
		color: #ffaa00;
		text-decoration: underline;
	}

	.separator {
		color: #666;
	}

	/* Responsive Design */
	@media (max-width: 1400px) {
		.main-content {
			grid-template-columns: 1fr;
		}

		.right-column {
			grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		}
	}

	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			align-items: flex-start;
		}

		.stats-section {
			width: 100%;
			justify-content: space-between;
		}

		.main-content {
			padding: 1rem;
			gap: 1rem;
		}

		.title-section h1 {
			font-size: 1.4rem;
		}
	}
</style>
