<script lang="ts">
	import { currentResearchStore, statsStore } from '../stores/statsStore';
	import { formatTime, formatNumberWithCommas, prettifyResearchName } from '../utils/formatters';
	import { onMount } from 'svelte';

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
	interface ProgressEntry {
		timestamp: number;
		progress: number;
		techName: string;
		techLevel: number;
	}

	let progressHistory = $state<ProgressEntry[]>([]);
	const MAX_HISTORY = 30; // Keep last 30 progress updates (~2.5 minutes at 5 second intervals)
	let lastTrackedTechId = $state<string | null>(null);

	// Track progress history using $effect
	$effect(() => {
		if (currentResearch) {
			// Check if research changed
			const currentTechId = `${currentResearch.name}_${currentResearch.level}`;

			if (lastTrackedTechId !== currentTechId) {
				// Research changed, reset history
				progressHistory = [];
				lastTrackedTechId = currentTechId;
			}

			// Add current progress to history if it has progress data
			// Only add if this is a new progress value (not already tracked)
			if (currentResearch.progress !== undefined) {
				const lastEntry = progressHistory[progressHistory.length - 1];
				const shouldAdd = !lastEntry || 
					lastEntry.progress !== currentResearch.progress ||
					Date.now() - lastEntry.timestamp > 1000; // At least 1 second apart
				
				if (shouldAdd) {
					progressHistory = [
						...progressHistory,
						{
							timestamp: Date.now(),
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
	let estimatedTime = $derived.by(() => {
		if (!currentResearch || currentResearch.progress === undefined || currentResearch.progress >= 1) {
			return null;
		}

		if (progressHistory.length < 2) {
			return null; // Need at least 2 data points
		}

		// Use at least 5 data points for stability, or all available if less
		const minDataPoints = Math.min(5, progressHistory.length);
		if (progressHistory.length < minDataPoints) {
			return null;
		}

		// Calculate average progress rate from history
		// Use the oldest 1/3 and newest 1/3 to reduce noise from intermediate fluctuations
		const thirdSize = Math.floor(progressHistory.length / 3);
		const useFullHistory = progressHistory.length <= 10;
		
		let oldest, newest;
		if (useFullHistory) {
			oldest = progressHistory[0];
			newest = progressHistory[progressHistory.length - 1];
		} else {
			// Average the first third and last third
			const firstThird = progressHistory.slice(0, thirdSize);
			const lastThird = progressHistory.slice(-thirdSize);
			
			const avgFirst = firstThird.reduce((sum, e) => sum + e.progress, 0) / firstThird.length;
			const avgLast = lastThird.reduce((sum, e) => sum + e.progress, 0) / lastThird.length;
			
			oldest = { 
				...firstThird[Math.floor(thirdSize / 2)], 
				progress: avgFirst,
				timestamp: firstThird[0].timestamp
			};
			newest = { 
				...lastThird[Math.floor(thirdSize / 2)], 
				progress: avgLast,
				timestamp: lastThird[lastThird.length - 1].timestamp
			};
		}
		
		const timeDiff = (newest.timestamp - oldest.timestamp) / 1000; // seconds
		const progressDiff = newest.progress - oldest.progress;

		if (timeDiff <= 0 || progressDiff <= 0) {
			return null;
		}

		const progressPerSecond = progressDiff / timeDiff;
		const remainingProgress = 1 - newest.progress;
		const secondsRemaining = remainingProgress / progressPerSecond;
		
		// Convert seconds to game ticks (60 ticks per second)
		return secondsRemaining * 60;
	});

	let progressPercent = $derived(currentResearch?.progress ? (currentResearch.progress * 100).toFixed(1) : '0');
	let displayName = $derived(currentResearch ? prettifyResearchName(currentResearch.name) : 'No Active Research');
	let level = $derived(currentResearch?.level || 1);
</script>

<div class="research-progress">
	{#if currentResearch}
		<div class="header">
			<h3>Current Research</h3>
		</div>
		
		<div class="content">
			<div class="tech-info">
				<div class="tech-name">{displayName}</div>
				{#if level > 1}
					<div class="tech-level">Level {level}</div>
				{/if}
			</div>
			
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progressPercent}%"></div>
				<div class="progress-text">{progressPercent}%</div>
			</div>
			
			<div class="stats-grid">
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
						{:else if progressHistory.length < 5}
							<span class="calculating">Calculating...</span>
							{:else}
								∞
							{/if}
						</span>
					</div>
				{/if}
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
		background: rgba(255, 119, 0, 0.2);
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
		align-items: center;
		gap: 0.25rem;
	}

	.tech-name {
		color: #e0e0e0;
		font-family: monospace;
		font-size: 1.1rem;
		font-weight: bold;
		text-align: center;
	}

	.tech-level {
		color: #ffcc00;
		font-family: monospace;
		font-size: 0.9rem;
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

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
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
