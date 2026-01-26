<script lang="ts">
	import { researchQueueStore } from '../stores/statsStore';
	import { prettifyResearchName } from '../utils/formatters';
	import { getTechnologyAssetUrl } from '../utils/assets';
</script>

<div class="research-queue">
	<h3>Research Queue ({$researchQueueStore.length})</h3>
	
	<div class="queue-list">
		{#each $researchQueueStore as research (research.position)}
			<div class="queue-item">
				<div class="position">{research.position}</div>
				<div class="tech-icon-wrapper">
					<img 
						src={getTechnologyAssetUrl(research.name)} 
						alt={research.name} 
						class="tech-icon"
					/>
				</div>
				<div class="info">
					<div class="name">{prettifyResearchName(research.name)}</div>
					{#if research.level > 1}
						<div class="level">Level {research.level}</div>
					{/if}
				</div>
			</div>
		{/each}
		
		{#if $researchQueueStore.length === 0}
			<div class="empty">No queued research</div>
		{/if}
	</div>
</div>

<style>
	.research-queue {
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 119, 0, 0.3);
		border-radius: 4px;
		padding: 1rem;
		height: 100%;
		display: flex;
		flex-direction: column;
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

	.queue-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.queue-item {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		align-items: center;
		transition: background 0.2s;
	}

	.queue-item:hover {
		background: rgba(255, 119, 0, 0.1);
		border-color: rgba(255, 119, 0, 0.3);
	}

	.position {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: rgba(255, 119, 0, 0.2);
		border: 1px solid rgba(255, 119, 0, 0.4);
		border-radius: 4px;
		color: #ff7700;
		font-family: monospace;
		font-size: 0.9rem;
		font-weight: bold;
		flex-shrink: 0;
	}

	.tech-icon-wrapper {
		width: 32px;
		height: 32px;
		overflow: hidden;
		flex-shrink: 0;
		position: relative;
		filter: drop-shadow(0 0 2px rgba(255, 119, 0, 0.2));
	}

	.tech-icon {
		display: block;
		width: 32px;
		height: 32px;
		object-fit: cover;
		object-position: top left;
		image-rendering: -webkit-optimize-contrast;
		image-rendering: crisp-edges;
	}

	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.name {
		color: #e0e0e0;
		font-family: monospace;
		font-size: 0.9rem;
		font-weight: bold;
	}

	.level {
		color: #ffcc00;
		font-family: monospace;
		font-size: 0.75rem;
	}

	.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		color: #a0a0a0;
		font-family: monospace;
		text-align: center;
	}

	/* Custom scrollbar */
	.queue-list::-webkit-scrollbar {
		width: 8px;
	}

	.queue-list::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 4px;
	}

	.queue-list::-webkit-scrollbar-thumb {
		background: rgba(255, 119, 0, 0.3);
		border-radius: 4px;
	}

	.queue-list::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 119, 0, 0.5);
	}
</style>
