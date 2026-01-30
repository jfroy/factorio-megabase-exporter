import { writable, derived } from 'svelte/store';
import type { Alert } from '../types/stats';

// Alert with hash for deduplication
export interface AlertWithHash extends Alert {
	hash: string;
	firstSeen: number; // Timestamp when first seen
	firstSeenTick: number; // Game tick when first seen
	latestTick: number; // Most recent game tick for this alert
}

// Store for alert log (persists all unique alerts seen)
export const alertLogStore = writable<AlertWithHash[]>([]);

// Maximum number of alerts to keep in the log
const MAX_ALERTS = 1000;

// Generate a hash for an alert to detect duplicates
// Note: Excludes tick since Factorio refreshes alerts with new ticks
function hashAlert(alert: Alert): string {
	// Create a stable string representation of the alert (excluding tick)
	const parts = [
		alert.type,
		alert.surface,
		alert.target || '',
		alert.message || ''
	];
	return parts.join('|');
}

// Add alerts from a stats update
export function processAlerts(alerts: Alert[]): void {
	if (!alerts || alerts.length === 0) return;

	alertLogStore.update(existingAlerts => {
		const existingAlertsMap = new Map(existingAlerts.map(a => [a.hash, a]));
		const updatedAlerts: AlertWithHash[] = [];

		// Process each alert
		for (const alert of alerts) {
			const hash = hashAlert(alert);
			const existing = existingAlertsMap.get(hash);
			
			if (existing) {
				// Update existing alert with latest tick if newer
				if (alert.tick > existing.latestTick) {
					updatedAlerts.push({
						...existing,
						tick: alert.tick, // Update the tick field
						latestTick: alert.tick
					});
				} else {
					updatedAlerts.push(existing);
				}
				existingAlertsMap.delete(hash);
			} else {
				// New alert
				updatedAlerts.push({
					...alert,
					hash,
					firstSeen: Date.now(),
					firstSeenTick: alert.tick,
					latestTick: alert.tick
				});
			}
		}

		// Add remaining existing alerts that weren't in this update
		for (const existing of existingAlertsMap.values()) {
			updatedAlerts.push(existing);
		}

		// Sort by latest tick, newest first
		updatedAlerts.sort((a, b) => b.latestTick - a.latestTick);

		// Keep only the most recent MAX_ALERTS
		return updatedAlerts.slice(0, MAX_ALERTS);
	});
}

// Derived store for alert counts by type
export const alertCountsByType = derived(
	alertLogStore,
	($alerts) => {
		const counts: Record<string, number> = {};
		for (const alert of $alerts) {
			counts[alert.type] = (counts[alert.type] || 0) + 1;
		}
		return counts;
	}
);

// Derived store for recent alerts (last 100)
export const recentAlertsStore = derived(
	alertLogStore,
	($alerts) => $alerts.slice(0, 100)
);

// Clear all alerts
export function clearAlerts(): void {
	alertLogStore.set([]);
}
