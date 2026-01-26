import type { FactorioStats, ParsedSciencePack } from '../types/stats';
import { getParsedSciencePacks } from '../types/stats';

// History store for time-series data (last 60 data points = 5 minutes at 5 second intervals)
interface HistoryEntry {
	timestamp: number;
	data: FactorioStats;
}

const MAX_HISTORY = 60;

// Create reactive state using runes (not exported directly to avoid reassignment issues)
let _stats = $state<FactorioStats | null>(null);
let _error = $state<string | null>(null);
let _lastUpdate = $state<number>(Date.now());
let _history = $state<HistoryEntry[]>([]);

// Export store-compatible objects for components
export const statsStore = {
	get value() { return _stats; }
};

export const errorStore = {
	get value() { return _error; }
};

export const lastUpdateStore = {
	get value() { return _lastUpdate; }
};

export const historyStore = {
	get value() { return _history; }
};

// Derived values
export const parsedSciencePacksStore = {
	get value(): ParsedSciencePack[] { 
		return _stats ? getParsedSciencePacks(_stats) : [];
	}
};

export const currentResearchStore = {
	get value() {
		if (!_stats || !_stats.research.queue.length) return null;
		return _stats.research.queue[0];
	}
};

export const researchQueueStore = {
	get value() {
		if (!_stats || _stats.research.queue.length <= 1) return [];
		return _stats.research.queue.slice(1);
	}
};

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
		
		// Update state
		_stats = data;
		_lastUpdate = Date.now();
		_error = null;

		// Add to history
		const newHistory = [..._history, { timestamp: Date.now(), data }];
		// Keep only the last MAX_HISTORY entries
		if (newHistory.length > MAX_HISTORY) {
			_history = newHistory.slice(-MAX_HISTORY);
		} else {
			_history = newHistory;
		}
	} catch (err) {
		console.error('Error fetching stats:', err);
		_error = err instanceof Error ? err.message : 'Unknown error';
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
