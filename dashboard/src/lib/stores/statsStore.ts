import { writable, derived } from 'svelte/store';
import type { FactorioStats, ParsedSciencePack } from '../types/stats';
import { getParsedSciencePacks } from '../types/stats';

// Store for the raw stats data
export const statsStore = writable<FactorioStats | null>(null);

// Store for error messages
export const errorStore = writable<string | null>(null);

// Store for last update timestamp
export const lastUpdateStore = writable<number>(Date.now());

// History store for time-series data (last 60 data points = 5 minutes at 5 second intervals)
interface HistoryEntry {
	timestamp: number;
	data: FactorioStats;
}

const MAX_HISTORY = 60;
export const historyStore = writable<HistoryEntry[]>([]);

// Derived store for parsed science packs
export const parsedSciencePacksStore = derived(
	statsStore,
	($stats) => {
		if (!$stats) return [];
		return getParsedSciencePacks($stats);
	}
);

// Derived store for current research (position 1)
export const currentResearchStore = derived(
	statsStore,
	($stats) => {
		if (!$stats || !$stats.research.queue.length) return null;
		return $stats.research.queue[0];
	}
);

// Derived store for research queue (positions 2+)
export const researchQueueStore = derived(
	statsStore,
	($stats) => {
		if (!$stats || $stats.research.queue.length <= 1) return [];
		return $stats.research.queue.slice(1);
	}
);

// Fetch stats from the API
async function fetchStats(): Promise<void> {
	try {
		// Try localhost first, then the current host
		const urls = [
			'http://localhost:3000/api/stats',
			'/api/stats'
		];

		let response: Response | null = null;
		let lastError: Error | null = null;

		for (const url of urls) {
			try {
				response = await fetch(url);
				if (response.ok) break;
			} catch (err) {
				lastError = err as Error;
				continue;
			}
		}

		if (!response || !response.ok) {
			throw lastError || new Error('Failed to fetch stats from any endpoint');
		}

		const data: FactorioStats = await response.json();
		
		// Update stores
		statsStore.set(data);
		lastUpdateStore.set(Date.now());
		errorStore.set(null);

		// Add to history
		historyStore.update(history => {
			const newHistory = [...history, { timestamp: Date.now(), data }];
			// Keep only the last MAX_HISTORY entries
			if (newHistory.length > MAX_HISTORY) {
				return newHistory.slice(-MAX_HISTORY);
			}
			return newHistory;
		});
	} catch (error) {
		console.error('Error fetching stats:', error);
		errorStore.set(error instanceof Error ? error.message : 'Unknown error');
	}
}

// Start polling for stats
export function startStatsPolling(intervalMs: number = 5000): () => void {
	// Fetch immediately
	fetchStats();

	// Then poll at interval
	const interval = setInterval(fetchStats, intervalMs);

	// Return cleanup function
	return () => clearInterval(interval);
}

// Manual refresh function
export async function refreshStats(): Promise<void> {
	await fetchStats();
}
