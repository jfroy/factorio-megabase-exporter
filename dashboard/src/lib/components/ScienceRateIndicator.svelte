<script lang="ts">
	import { parsedSciencePacksStore } from '../stores/statsStore.svelte';
	import { formatRate } from '../utils/formatters';
	import { getScienceColor } from '../utils/chartConfig';
	import { getQualityColor } from '../utils/formatters';
	import type { ParsedSciencePack } from '../types/stats';

	let packs = $derived(parsedSciencePacksStore.value);

	// Group science packs by type and sum rates across qualities
	let groupedPacks = $derived.by(() => {
		const groups = new Map<string, { production: number; consumption: number; color: string; qualities: Set<string> }>();
		
		packs.forEach((pack) => {
			if (!groups.has(pack.type)) {
				groups.set(pack.type, {
					production: 0,
					consumption: 0,
					color: getScienceColor(pack.type),
					qualities: new Set()
				});
			}
			
			const group = groups.get(pack.type)!;
			group.production += pack.rate.produced;
			group.consumption += pack.rate.consumed;
			
			if (pack.rate.produced > 0 || pack.rate.consumed > 0) {
				group.qualities.add(pack.quality);
			}
		});
		
		// Filter out packs with no activity and convert to array
		return Array.from(groups.entries())
			.filter(([_, data]) => data.production > 0 || data.consumption > 0)
			.map(([type, data]) => ({ type, ...data }))
			.sort((a, b) => b.production - a.production);
	});

	function getMaxRate(packs: any[]): number {
		return Math.max(...packs.map(p => Math.max(p.production, p.consumption)), 1);
	}
</script>

<div class="rate-indicator">
	<h3>Current Rates</h3>
	
	<div class="rates-grid">
		{#each groupedPacks as pack}
			<div class="rate-row">
				<div class="pack-info">
					<img 
						src="/icons/{pack.type}.svg" 
						alt={pack.type}
						class="pack-icon"
					/>
					<span class="pack-name">
						{pack.type.split('-').slice(0, -2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
					</span>
					<div class="quality-badges">
						{#each Array.from(pack.qualities) as quality}
							{#if quality !== 'normal'}
								<span 
									class="quality-badge" 
									style="background-color: {getQualityColor(quality as import('../types/stats').QualityLevel)};"
									title={quality}
								></span>
							{/if}
						{/each}
					</div>
				</div>
				
				<div class="bars">
					<div class="bar-group">
						<span class="label">Prod:</span>
						<div class="bar-container">
							<div 
								class="bar production"
								style="width: {(pack.production / getMaxRate(groupedPacks)) * 100}%; background-color: {pack.color};"
							></div>
						</div>
						<span class="value">{formatRate(pack.production)}</span>
					</div>
					
					<div class="bar-group">
						<span class="label">Cons:</span>
						<div class="bar-container">
							<div 
								class="bar consumption"
								style="width: {(pack.consumption / getMaxRate(groupedPacks)) * 100}%; background-color: {pack.color}; opacity: 0.7;"
							></div>
						</div>
						<span class="value">{formatRate(pack.consumption)}</span>
					</div>
				</div>
			</div>
		{/each}
	</div>
	
	{#if groupedPacks.length === 0}
		<div class="no-data">No science production detected</div>
	{/if}
</div>

<style>
	.rate-indicator {
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 119, 0, 0.3);
		border-radius: 4px;
		padding: 1rem;
		height: 100%;
		overflow-y: auto;
	}

	h3 {
		margin: 0 0 1rem 0;
		color: #ff7700;
		font-family: monospace;
		font-size: 1.1rem;
		text-align: center;
		border-bottom: 1px solid rgba(255, 119, 0, 0.3);
		padding-bottom: 0.5rem;
	}

	.rates-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.rate-row {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.pack-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.pack-icon {
		width: 32px;
		height: 32px;
		flex-shrink: 0;
	}

	.pack-name {
		color: #e0e0e0;
		font-family: monospace;
		font-size: 0.9rem;
		font-weight: bold;
		flex: 1;
	}

	.quality-badges {
		display: flex;
		gap: 2px;
	}

	.quality-badge {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.bars {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.bar-group {
		display: grid;
		grid-template-columns: 50px 1fr 80px;
		align-items: center;
		gap: 0.5rem;
	}

	.label {
		color: #a0a0a0;
		font-family: monospace;
		font-size: 0.75rem;
		text-align: right;
	}

	.bar-container {
		height: 16px;
		background: rgba(0, 0, 0, 0.5);
		border-radius: 2px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.bar {
		height: 100%;
		transition: width 0.3s ease;
	}

	.value {
		color: #e0e0e0;
		font-family: monospace;
		font-size: 0.8rem;
		text-align: right;
		font-weight: bold;
	}

	.no-data {
		text-align: center;
		color: #a0a0a0;
		font-family: monospace;
		padding: 2rem;
	}
</style>
