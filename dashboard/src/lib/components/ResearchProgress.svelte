<script lang="ts">
	import { currentResearchStore, statsStore } from '../stores/statsStore';
	import { formatTime, formatNumberWithCommas, prettifyResearchName } from '../utils/formatters';
	import { getTechnologyAssetUrl } from '../utils/assets';
	import { onMount } from 'svelte';
	import MiniESPMChart from './MiniESPMChart.svelte';

	let currentResearch = $derived($currentResearchStore);
	let stats = $derived($statsStore);
	
	// Calculate eSPM from science_normal production rate
	let eSPM = $derived.by(() => {
		if (!stats) return 0;
		
		const scienceNormalKey = 'science_normal';
		if (stats.science_packs.rate_1m[scienceNormalKey]) {
			return stats.science_packs.rate_1m[scienceNormalKey].produced;
		}
		return 0;
	});

	// Progress history tracking for better time estimation
	// Based on StatsGui's rolling average algorithm
	interface ProgressEntry {
		gameTick: number; // Use game tick instead of wall-clock time
		progress: number;
		techName: string;
		techLevel: number;
	}

	let progressHistory = $state<ProgressEntry[]>([]);
	const MAX_HISTORY = 30; // Keep last 30 progress updates (~5 minutes at 10 second intervals)
	let lastTrackedTechId = $state<string | null>(null);

	// Track progress history using $effect
	$effect(() => {
		if (currentResearch && stats) {
			// Check if research changed
			const currentTechId = `${currentResearch.name}_${currentResearch.level}`;

			if (lastTrackedTechId !== currentTechId) {
				// Research changed, reset history
				progressHistory = [];
				lastTrackedTechId = currentTechId;
			}

			// Add current progress to history if it has progress data
			// Use the game tick from stats data (updated every 600 ticks by the mod)
			if (currentResearch.progress !== undefined && stats.timestamp) {
				const lastEntry = progressHistory[progressHistory.length - 1];
				const shouldAdd = !lastEntry || 
					lastEntry.gameTick !== stats.timestamp || // New game tick
					lastEntry.progress !== currentResearch.progress; // Progress changed
				
				if (shouldAdd) {
					progressHistory = [
						...progressHistory,
						{
							gameTick: stats.timestamp,
							progress: currentResearch.progress,
							techName: currentResearch.name,
							techLevel: currentResearch.level
						}
					].slice(-MAX_HISTORY); // Keep only last MAX_HISTORY entries
				}
			}
		}
	});

	// Calculate estimated time based on progress history
	// Uses rolling average algorithm inspired by StatsGui for more stable predictions
	let estimatedTime = $derived.by(() => {
		if (!currentResearch || currentResearch.progress === undefined || currentResearch.progress >= 1) {
			return null;
		}

		if (progressHistory.length < 2) {
			return null; // Need at least 2 data points
		}

		// Calculate time estimates from consecutive sample pairs using rolling average
		let totalEstimatedTicks = 0;
		let validSampleCount = 0;

		for (let i = 1; i < progressHistory.length; i++) {
			const previousSample = progressHistory[i - 1];
			const currentSample = progressHistory[i];

			// Only compare samples from the same technology
			const sameTech = 
				previousSample.techName === currentSample.techName &&
				previousSample.techLevel === currentSample.techLevel;

			if (sameTech) {
				// Use game ticks directly (1 tick = 1/60 second)
				const tickDiff = currentSample.gameTick - previousSample.gameTick;
				const progressDiff = currentSample.progress - previousSample.progress;

				// Only use samples where progress actually increased
				if (progressDiff > 0 && tickDiff > 0) {
					// Calculate speed: how much progress per tick
					const progressPerTick = progressDiff / tickDiff;
					
					// Calculate estimated ticks remaining from this sample
					const remainingProgress = 1 - currentSample.progress;
					const estimatedTicks = remainingProgress / progressPerTick;
					
					totalEstimatedTicks += estimatedTicks;
					validSampleCount++;
				}
			}
		}

		// Return rolling average if we have valid samples
		if (validSampleCount > 0) {
			const avgEstimatedTicks = totalEstimatedTicks / validSampleCount;
			return avgEstimatedTicks;
		}

		return null;
	});

	let progressPercent = $derived(currentResearch?.progress ? (currentResearch.progress * 100).toFixed(1) : '0');
	let level = $derived(currentResearch?.level || 1);
	let displayName = $derived(currentResearch ? prettifyResearchName(currentResearch.name) : 'No Active Research');
	let techIconUrl = $derived(currentResearch ? getTechnologyAssetUrl(currentResearch.name) : '');
</script>

<div class="research-progress">
	{#if currentResearch}
		<div class="header">
			<h3>Current Research</h3>
		</div>
		
		<div class="content">
			<div class="tech-info">
				<div class="tech-header">
					{#if techIconUrl}
						<div class="tech-icon-wrapper">
							<img 
								src={techIconUrl} 
								alt={displayName} 
								class="tech-icon"
							/>
						</div>
					{/if}
					<div class="tech-details">
						<div class="tech-name">
							{displayName}{#if level > 1}&nbsp;<span class="tech-level">{level}</span>{/if}
						</div>
					</div>
				</div>
				
				<div class="stats-box desktop-stats">
					<div class="stat">
						<span class="stat-label">eSPM:</span>
						<span class="stat-value">{formatNumberWithCommas(Math.round(eSPM))}</span>
					</div>
					
					{#if currentResearch.progress !== undefined && currentResearch.progress < 1}
						<div class="stat">
							<span class="stat-label">Est. Time:</span>
							<span class="stat-value">
							{#if estimatedTime !== null}
								{formatTime(estimatedTime)}
							{:else if progressHistory.length < 2}
								<span class="calculating">Calculating...</span>
								{:else}
									∞
								{/if}
							</span>
						</div>
					{/if}
				</div>
			</div>
			
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progressPercent}%"></div>
				<div class="progress-text">{progressPercent}%</div>
			</div>
			
			<div class="stats-box mobile-stats">
				<div class="stat">
					<span class="stat-label">eSPM:</span>
					<span class="stat-value">{formatNumberWithCommas(Math.round(eSPM))}</span>
				</div>
				
				{#if currentResearch.progress !== undefined && currentResearch.progress < 1}
					<div class="stat">
						<span class="stat-label">Est. Time:</span>
						<span class="stat-value">
						{#if estimatedTime !== null}
							{formatTime(estimatedTime)}
						{:else if progressHistory.length < 2}
							<span class="calculating">Calculating...</span>
							{:else}
								∞
							{/if}
						</span>
					</div>
				{/if}
			</div>
			
			<!-- Embedded eSPM Chart -->
			<div class="espm-chart-section">
				<MiniESPMChart />
			</div>
		</div>
	{:else}
		<div class="no-research">
			<span>No Active Research</span>
		</div>
	{/if}
</div>

<style>
	.research-progress {
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 119, 0, 0.3);
		border-radius: 4px;
		overflow: hidden;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.header {
		border-bottom: 1px solid rgba(255, 119, 0, 0.3);
		padding: 0.75rem 1rem;
	}

	h3 {
		margin: 0;
		color: #ff7700;
		font-family: monospace;
		font-size: 1.1rem;
		text-align: center;
	}

	.content {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
	}

	.tech-info {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.tech-header {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1rem;
	}

	.tech-icon-wrapper {
		width: 64px;
		height: 64px;
		overflow: hidden;
		flex-shrink: 0;
		position: relative;
		filter: drop-shadow(0 0 4px rgba(255, 119, 0, 0.3));
	}

	.tech-icon {
		display: block;
		width: 64px;
		height: 64px;
		object-fit: cover;
		object-position: top left;
		image-rendering: -webkit-optimize-contrast;
		image-rendering: crisp-edges;
	}

	.tech-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
		min-width: 0; /* Allow text to wrap */
	}

	.tech-name {
		color: #e0e0e0;
		font-family: monospace;
		font-size: 1.1rem;
		font-weight: bold;
	}

	.tech-level {
		color: #ffcc00;
	}

	.stats-box {
		display: flex;
		flex-direction: row;
		gap: 1.5rem;
		padding: 0.75rem 1rem;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 119, 0, 0.2);
		border-radius: 4px;
		justify-content: center;
	}

	/* Hide desktop stats on mobile, show mobile stats */
	.desktop-stats {
		display: none;
	}

	.mobile-stats {
		display: flex;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		text-align: center;
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

	.calculating {
		color: #ffaa00;
		font-size: 0.85rem;
		font-style: italic;
	}

	/* Responsive layout: when sufficient horizontal space, place stats next to tech header */
	@media (min-width: 768px) {
		.tech-info {
			flex-direction: row;
			align-items: flex-start;
			justify-content: space-between;
		}

		.desktop-stats {
			display: flex;
			flex-shrink: 0;
		}

		.mobile-stats {
			display: none;
		}
	}

	.progress-bar {
		position: relative;
		height: 32px;
		background: rgba(0, 0, 0, 0.5);
		border: 2px solid rgba(255, 119, 0, 0.5);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #ff7700 0%, #ffaa00 100%);
		transition: width 0.5s ease;
	}

	.progress-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: #ffffff;
		font-family: monospace;
		font-size: 0.9rem;
		font-weight: bold;
		text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
	}

	.espm-chart-section {
		margin-top: 0;
		padding-top: 0;
	}

	.no-research {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #a0a0a0;
		font-family: monospace;
		padding: 2rem;
	}
</style>
