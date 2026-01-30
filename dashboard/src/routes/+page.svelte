<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { statsStore, lastUpdateStore, errorStore, startStatsPolling, refreshStats } from '../lib/stores/statsStore';
	import { formatTime, formatTimestamp } from '../lib/utils/formatters';
	import { registerServiceWorker, isFullscreenSupported, isFullscreen, toggleFullscreen } from '../lib/pwa';
	
	import ScienceCombinedChart from '../lib/components/ScienceCombinedChart.svelte';
	import ScienceRateIndicator from '../lib/components/ScienceRateIndicator.svelte';
	import ResearchProgress from '../lib/components/ResearchProgress.svelte';
	import ResearchQueue from '../lib/components/ResearchQueue.svelte';
	import AlertsPanel from '../lib/components/AlertsPanel.svelte';
	
	import '../app.css';

	let stopPolling = $state<(() => void) | null>(null);
	let fullscreenEnabled = $state(false);
	let isInFullscreen = $state(false);

	let gameTime = $derived($statsStore ? formatTime($statsStore.game_time) : '--');
	let lastUpdate = $derived(formatTimestamp($lastUpdateStore));
	let hasError = $derived($errorStore !== null);

	// Update fullscreen state
	function updateFullscreenState() {
		isInFullscreen = isFullscreen();
	}

	async function handleFullscreenToggle() {
		try {
			await toggleFullscreen();
			updateFullscreenState();
		} catch (error) {
			console.error('Fullscreen toggle failed:', error);
		}
	}

	onMount(() => {
		// Register service worker for PWA
		registerServiceWorker();
		
		// Start polling for stats every 5 seconds
		stopPolling = startStatsPolling(5000);
		
		// Check fullscreen support
		fullscreenEnabled = isFullscreenSupported();
		
		// Listen for fullscreen changes
		document.addEventListener('fullscreenchange', updateFullscreenState);
		document.addEventListener('webkitfullscreenchange', updateFullscreenState);
		document.addEventListener('mozfullscreenchange', updateFullscreenState);
		document.addEventListener('msfullscreenchange', updateFullscreenState);
	});

	onDestroy(() => {
		if (stopPolling) {
			stopPolling();
		}
		
		// Remove fullscreen listeners
		document.removeEventListener('fullscreenchange', updateFullscreenState);
		document.removeEventListener('webkitfullscreenchange', updateFullscreenState);
		document.removeEventListener('mozfullscreenchange', updateFullscreenState);
		document.removeEventListener('msfullscreenchange', updateFullscreenState);
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
					<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
						<path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
						<path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
					</svg>
					Refresh
				</button>
				{#if fullscreenEnabled}
					<button class="fullscreen-btn" onclick={handleFullscreenToggle} title={isInFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
						{#if isInFullscreen}
							<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
								<path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5zM0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zm10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4z"/>
							</svg>
							Exit Fullscreen
						{:else}
							<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
								<path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
							</svg>
							Fullscreen
						{/if}
					</button>
				{/if}
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
		<!-- Left Column: Research & Chart & Alerts -->
		<div class="left-column">
			<div class="research-card">
				<ResearchProgress />
			</div>
			<div class="chart-card">
				<ScienceCombinedChart />
			</div>
			<div class="alerts-card">
				<AlertsPanel />
			</div>
		</div>

		<!-- Right Column: Rates & Queue -->
		<div class="right-column">
			<div class="rates-card">
				<ScienceRateIndicator />
			</div>
			<div class="queue-card">
				<ResearchQueue />
			</div>
		</div>
	</main>

	<!-- Footer -->
	<footer class="footer">
		<div class="footer-content">
			<span>Factorio Megabase Dashboard <span class="git-hash">({__GIT_HASH__})</span></span>
			<span class="separator">•</span>
			<a href="https://www.factorio.com/" target="_blank" rel="noopener noreferrer">Factorio</a>
			<span class="separator">•</span>
			<a href="https://github.com/jfroy/factorio-megabase-exporter" target="_blank" rel="noopener noreferrer" class="github-link">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="16" height="16" fill="currentColor"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M237.9 461.4C237.9 463.4 235.6 465 232.7 465C229.4 465.3 227.1 463.7 227.1 461.4C227.1 459.4 229.4 457.8 232.3 457.8C235.3 457.5 237.9 459.1 237.9 461.4zM206.8 456.9C206.1 458.9 208.1 461.2 211.1 461.8C213.7 462.8 216.7 461.8 217.3 459.8C217.9 457.8 216 455.5 213 454.6C210.4 453.9 207.5 454.9 206.8 456.9zM251 455.2C248.1 455.9 246.1 457.8 246.4 460.1C246.7 462.1 249.3 463.4 252.3 462.7C255.2 462 257.2 460.1 256.9 458.1C256.6 456.2 253.9 454.9 251 455.2zM316.8 72C178.1 72 72 177.3 72 316C72 426.9 141.8 521.8 241.5 555.2C254.3 557.5 258.8 549.6 258.8 543.1C258.8 536.9 258.5 502.7 258.5 481.7C258.5 481.7 188.5 496.7 173.8 451.9C173.8 451.9 162.4 422.8 146 415.3C146 415.3 123.1 399.6 147.6 399.9C147.6 399.9 172.5 401.9 186.2 425.7C208.1 464.3 244.8 453.2 259.1 446.6C261.4 430.6 267.9 419.5 275.1 412.9C219.2 406.7 162.8 398.6 162.8 302.4C162.8 274.9 170.4 261.1 186.4 243.5C183.8 237 175.3 210.2 189 175.6C209.9 169.1 258 202.6 258 202.6C278 197 299.5 194.1 320.8 194.1C342.1 194.1 363.6 197 383.6 202.6C383.6 202.6 431.7 169 452.6 175.6C466.3 210.3 457.8 237 455.2 243.5C471.2 261.2 481 275 481 302.4C481 398.9 422.1 406.6 366.2 412.9C375.4 420.8 383.2 435.8 383.2 459.3C383.2 493 382.9 534.7 382.9 542.9C382.9 549.4 387.5 557.3 400.2 555C500.2 521.8 568 426.9 568 316C568 177.3 455.5 72 316.8 72zM169.2 416.9C167.9 417.9 168.2 420.2 169.9 422.1C171.5 423.7 173.8 424.4 175.1 423.1C176.4 422.1 176.1 419.8 174.4 417.9C172.8 416.3 170.5 415.6 169.2 416.9zM158.4 408.8C157.7 410.1 158.7 411.7 160.7 412.7C162.3 413.7 164.3 413.4 165 412C165.7 410.7 164.7 409.1 162.7 408.1C160.7 407.5 159.1 407.8 158.4 408.8zM190.8 444.4C189.2 445.7 189.8 448.7 192.1 450.6C194.4 452.9 197.3 453.2 198.6 451.6C199.9 450.3 199.3 447.3 197.3 445.4C195.1 443.1 192.1 442.8 190.8 444.4zM179.4 429.7C177.8 430.7 177.8 433.3 179.4 435.6C181 437.9 183.7 438.9 185 437.9C186.6 436.6 186.6 434 185 431.7C183.6 429.4 181 428.4 179.4 429.7z"/></svg>
				GitHub
			</a>
		</div>
	</footer>
</div>

<style>
	.dashboard {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
		box-sizing: border-box;
		max-width: 100vw;
		overflow-x: hidden;
		width: 100%;
	}

	/* Header */
	.header {
		background: rgba(0, 0, 0, 0.5);
		border-bottom: 2px solid rgba(255, 119, 0, 0.5);
		padding: 0.5rem 2rem;
		backdrop-filter: blur(10px);
		box-sizing: border-box;
		width: 100%;
	}

	.header-content {
		max-width: 1800px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
		flex-wrap: wrap;
		box-sizing: border-box;
		width: 100%;
	}

	.title-section h1 {
		color: #ff7700;
		font-family: monospace;
		font-size: 0.9rem;
		margin: 0;
		text-shadow: 0 0 10px rgba(255, 119, 0, 0.5);
	}

	.stats-section {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.stat-item {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
		align-items: center;
	}

	.stat-label {
		color: #a0a0a0;
		font-family: monospace;
		font-size: 0.65rem;
	}

	.stat-value {
		color: #e0e0e0;
		font-family: monospace;
		font-size: 0.75rem;
		font-weight: bold;
	}

	.refresh-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background: rgba(255, 119, 0, 0.2);
		border: 1px solid rgba(255, 119, 0, 0.5);
		border-radius: 4px;
		color: #ff7700;
		font-family: monospace;
		font-size: 0.65rem;
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

	.fullscreen-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		background: rgba(0, 119, 255, 0.2);
		border: 1px solid rgba(0, 119, 255, 0.5);
		border-radius: 4px;
		color: #0077ff;
		font-family: monospace;
		font-size: 0.65rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.fullscreen-btn:hover {
		background: rgba(0, 119, 255, 0.3);
		border-color: rgba(0, 119, 255, 0.7);
	}

	.fullscreen-btn:active {
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
		padding: 1rem;
		display: grid;
		grid-template-columns: 1fr 500px;
		gap: 1.5rem;
		box-sizing: border-box;
		overflow-x: hidden;
	}

	.left-column {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		min-width: 0;
		overflow-x: hidden;
	}

	.right-column {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		min-width: 0;
		overflow-x: hidden;
	}

	.chart-card {
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 119, 0, 0.3);
		border-radius: 8px;
		padding: 0.75rem 1rem 1rem 1rem;
		min-height: 350px;
		backdrop-filter: blur(5px);
		box-sizing: border-box;
		min-width: 0;
		overflow-x: hidden;
	}

	.research-card {
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 119, 0, 0.3);
		border-radius: 8px;
		backdrop-filter: blur(5px);
		padding: 0;
		overflow: hidden;
		box-sizing: border-box;
		min-width: 0;
	}

	.queue-card {
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 119, 0, 0.3);
		border-radius: 8px;
		backdrop-filter: blur(5px);
		min-height: 250px;
		max-height: 480px;
		box-sizing: border-box;
		min-width: 0;
		overflow-x: hidden;
	}

	.rates-card {
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 119, 0, 0.3);
		border-radius: 8px;
		backdrop-filter: blur(5px);
		min-height: 300px;
		box-sizing: border-box;
		min-width: 0;
		overflow-x: hidden;
	}

	.alerts-card {
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 119, 0, 0.3);
		border-radius: 8px;
		backdrop-filter: blur(5px);
		min-height: 250px;
		box-sizing: border-box;
		min-width: 0;
		overflow-x: hidden;
	}

	/* Footer */
	.footer {
		background: rgba(0, 0, 0, 0.5);
		border-top: 1px solid rgba(255, 119, 0, 0.3);
		padding: 1rem 2rem;
		backdrop-filter: blur(10px);
		box-sizing: border-box;
		width: 100%;
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
		box-sizing: border-box;
		width: 100%;
		flex-wrap: wrap;
	}

	.footer a {
		color: #ff7700;
		text-decoration: none;
		transition: color 0.2s;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.footer a:hover {
		color: #ffaa00;
		text-decoration: underline;
	}

	.git-hash {
		color: #666;
		font-size: 0.75rem;
	}

	.github-link svg {
		vertical-align: middle;
	}

	.separator {
		color: #666;
	}

	/* Responsive Design */
	@media (max-width: 1200px) {
		.main-content {
			grid-template-columns: 1fr;
		}

		.right-column {
			grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		}
	}

	@media (max-width: 768px) {
		.header {
			padding: 0.5rem;
		}

		.header-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}

		.stats-section {
			width: 100%;
			justify-content: space-between;
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		.main-content {
			padding: 0.5rem;
			gap: 0.5rem;
		}

		.title-section h1 {
			font-size: 1.1rem;
			white-space: nowrap;
		}

		.chart-card {
			padding: 0.5rem;
		}

		.queue-card,
		.rates-card {
			padding: 0.5rem;
		}
	}

	@media (max-width: 480px) {
		.header {
			padding: 0.5rem;
		}

		.title-section h1 {
			font-size: 0.95rem;
		}

		.main-content {
			padding: 0.5rem;
			gap: 0.5rem;
		}

		.stat-label {
			font-size: 0.65rem;
		}

		.stat-value {
			font-size: 0.85rem;
		}

		.refresh-btn {
			padding: 0.35rem 0.6rem;
			font-size: 0.8rem;
		}

		.fullscreen-btn {
			padding: 0.35rem 0.6rem;
			font-size: 0.8rem;
		}

		.footer {
			padding: 0.75rem 0.5rem;
		}

		.footer-content {
			font-size: 0.75rem;
			gap: 0.5rem;
		}

		.git-hash {
			display: none;
		}
	}
</style>
