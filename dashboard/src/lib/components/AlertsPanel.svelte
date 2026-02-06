<script lang="ts">
	import { onMount } from 'svelte';
	import { recentAlertsStore, alertCountsByType, clearAlerts } from '../stores/alertsStore';
	import { formatRelativeTimeAgo } from '../utils/timeFormatters';
	import { getAlertTypeLabel, ALERT_TYPE_LABELS, type AlertType } from '../types/stats';

	let showDetails = $state(false);
	let selectedType = $state<AlertType | 'all'>('all');
	let currentTime = $state(Date.now());

	const alertTypeColors: Record<string, string> = {
		'entity_destroyed': '#ff4444',
		'entity_under_attack': '#ff8844',
		'not_enough_construction_robots': '#ffaa44',
		'no_material_for_construction': '#ffcc44',
		'not_enough_repair_packs': '#ffee44',
		'turret_fire': '#ff6644',
		'custom': '#88aaff',
		'no_storage': '#ffaa88',
		'train_out_of_fuel': '#ffaa44',
		'fluid_mixing': '#ff88aa',
		'pipeline_overextended': '#ffccaa',
		'no_roboport_storage': '#ffaaaa',
		'train_no_path': '#ffcc88',
		'collector_path_blocked': '#ffdd88',
		'no_platform_storage': '#ffbb88',
		'platform_tile_building_blocked': '#ffcc99',
		'turret_out_of_ammo': '#ff9988',
		'unclaimed_cargo': '#88ccff'
	};

	const filteredAlerts = $derived(
		selectedType === 'all' 
			? $recentAlertsStore 
			: $recentAlertsStore.filter(a => a.type === selectedType)
	);

	const alertTypes = $derived(Object.keys($alertCountsByType) as AlertType[]);
	
	function getAlertTypeColor(type: AlertType): string {
		return alertTypeColors[type] || '#888888';
	}

	// Update currentTime every 10 seconds to refresh relative time displays
	onMount(() => {
		const interval = setInterval(() => {
			currentTime = Date.now();
		}, 10000); // Update every 10 seconds

		return () => clearInterval(interval);
	});

</script>

<div class="alerts-container">
	<div class="alerts-header">
		<h2>Alerts</h2>
		<div class="alerts-controls">
			<button 
				class="toggle-btn" 
				class:active={showDetails}
				onclick={() => showDetails = !showDetails}
			>
				{showDetails ? 'Hide Details' : 'Show Details'}
			</button>
			<button class="clear-btn" onclick={clearAlerts}>
				Clear All
			</button>
		</div>
	</div>

	<div class="alerts-summary">
		<div class="alert-filter">
			<button 
				class="filter-btn" 
				class:active={selectedType === 'all'}
				onclick={() => selectedType = 'all'}
			>
				All ({$recentAlertsStore.length})
			</button>
			{#each alertTypes as type}
			<button 
				class="filter-btn" 
				class:active={selectedType === type}
				style="--alert-color: {getAlertTypeColor(type)}"
				onclick={() => selectedType = type}
			>
				{getAlertTypeLabel(type)} ({$alertCountsByType[type]})
			</button>
			{/each}
		</div>
	</div>

	{#if showDetails}
		<div class="alerts-list">
			{#if filteredAlerts.length === 0}
				<div class="no-alerts">No alerts to display</div>
			{:else}
				{#each filteredAlerts as alert (alert.hash)}
					<div class="alert-item" style="--alert-color: {getAlertTypeColor(alert.type)}">
						<div class="alert-header">
							<span class="alert-type">{getAlertTypeLabel(alert.type)}</span>
							<span class="alert-time">{formatRelativeTimeAgo(alert.firstSeen, currentTime)}</span>
						</div>
						<div class="alert-details">
							{#if alert.target}
								<div class="alert-detail">
									<span class="label">Target:</span>
									<span class="value">{alert.target}</span>
								</div>
							{/if}
							{#if alert.message}
								<div class="alert-detail">
									<span class="label">Message:</span>
									<span class="value">{alert.message}</span>
								</div>
							{/if}
							<div class="alert-detail">
								<span class="label">Surface:</span>
								<span class="value">{alert.surface}</span>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style>
	.alerts-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100%;
	}

	.alerts-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid rgba(255, 119, 0, 0.3);
	}

	.alerts-header h2 {
		color: #ff7700;
		font-family: monospace;
		font-size: 1.2rem;
		margin: 0;
	}

	.alerts-controls {
		display: flex;
		gap: 0.5rem;
	}

	.toggle-btn, .clear-btn {
		padding: 0.4rem 0.8rem;
		background: rgba(255, 119, 0, 0.1);
		border: 1px solid rgba(255, 119, 0, 0.3);
		border-radius: 4px;
		color: #ff7700;
		font-family: monospace;
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.toggle-btn:hover, .clear-btn:hover {
		background: rgba(255, 119, 0, 0.2);
		border-color: rgba(255, 119, 0, 0.5);
	}

	.toggle-btn.active {
		background: rgba(255, 119, 0, 0.3);
		border-color: rgba(255, 119, 0, 0.6);
	}

	.alerts-summary {
		padding: 0 1rem;
	}

	.alert-filter {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.filter-btn {
		padding: 0.4rem 0.8rem;
		background: rgba(100, 100, 100, 0.2);
		border: 1px solid rgba(150, 150, 150, 0.3);
		border-radius: 4px;
		color: #c0c0c0;
		font-family: monospace;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.filter-btn:hover {
		background: rgba(150, 150, 150, 0.3);
		border-color: rgba(150, 150, 150, 0.5);
	}

	.filter-btn.active {
		background: var(--alert-color, rgba(255, 119, 0, 0.3));
		border-color: var(--alert-color, rgba(255, 119, 0, 0.6));
		color: white;
	}

	.alerts-list {
		flex: 1;
		overflow-y: auto;
		padding: 0 1rem 1rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 400px;
	}

	.no-alerts {
		text-align: center;
		color: #888;
		font-family: monospace;
		padding: 2rem;
	}

	.alert-item {
		background: rgba(0, 0, 0, 0.3);
		border-left: 3px solid var(--alert-color);
		border-radius: 4px;
		padding: 0.75rem;
		transition: background 0.2s;
	}

	.alert-item:hover {
		background: rgba(0, 0, 0, 0.5);
	}

	.alert-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.alert-type {
		color: var(--alert-color);
		font-family: monospace;
		font-weight: bold;
		font-size: 0.9rem;
	}

	.alert-time {
		color: #888;
		font-family: monospace;
		font-size: 0.75rem;
	}

	.alert-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.alert-detail {
		display: flex;
		gap: 0.5rem;
		font-family: monospace;
		font-size: 0.8rem;
	}

	.alert-detail .label {
		color: #999;
		min-width: 70px;
	}

	.alert-detail .value {
		color: #ddd;
	}

	/* Scrollbar styling */
	.alerts-list::-webkit-scrollbar {
		width: 8px;
	}

	.alerts-list::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 4px;
	}

	.alerts-list::-webkit-scrollbar-thumb {
		background: rgba(255, 119, 0, 0.3);
		border-radius: 4px;
	}

	.alerts-list::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 119, 0, 0.5);
	}
</style>
