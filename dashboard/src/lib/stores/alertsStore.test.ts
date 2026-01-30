import { describe, it, expect } from 'vitest';
import type { Alert } from '../types/stats';

// Copy of the hash function from alertsStore for testing
// Note: Excludes tick since Factorio refreshes alerts with new ticks
function hashAlert(alert: Alert): string {
	const parts = [
		alert.type,
		alert.surface,
		alert.target || '',
		alert.message || ''
	];
	return parts.join('|');
}

describe('Alert Hashing', () => {
	it('should generate consistent hashes for identical alerts regardless of tick', () => {
		const alert1: Alert = {
			tick: 1000,
			type: 'entity_under_attack',
			surface: 'nauvis',
			target: 'stone-wall'
		};

		const alert2: Alert = {
			tick: 2000, // Different tick
			type: 'entity_under_attack',
			surface: 'nauvis',
			target: 'stone-wall'
		};

		// Should have same hash despite different ticks
		expect(hashAlert(alert1)).toBe(hashAlert(alert2));
	});

	it('should generate different hashes for different alert types', () => {
		const alert1: Alert = {
			tick: 1000,
			type: 'entity_under_attack',
			surface: 'nauvis'
		};

		const alert2: Alert = {
			tick: 1000,
			type: 'entity_destroyed',
			surface: 'nauvis'
		};

		expect(hashAlert(alert1)).not.toBe(hashAlert(alert2));
	});

	it('should generate different hashes for different surfaces', () => {
		const alert1: Alert = {
			tick: 1000,
			type: 'entity_under_attack',
			surface: 'nauvis'
		};

		const alert2: Alert = {
			tick: 1000,
			type: 'entity_under_attack',
			surface: 'vulcanus'
		};

		expect(hashAlert(alert1)).not.toBe(hashAlert(alert2));
	});

	it('should generate different hashes for different targets', () => {
		const alert1: Alert = {
			tick: 1000,
			type: 'entity_under_attack',
			surface: 'nauvis',
			target: 'stone-wall'
		};

		const alert2: Alert = {
			tick: 1000,
			type: 'entity_under_attack',
			surface: 'nauvis',
			target: 'gun-turret'
		};

		expect(hashAlert(alert1)).not.toBe(hashAlert(alert2));
	});

	it('should handle alerts without optional fields', () => {
		const alert: Alert = {
			tick: 1000,
			type: 'not_enough_construction_robots',
			surface: 'nauvis'
		};

		expect(() => hashAlert(alert)).not.toThrow();
		expect(hashAlert(alert)).toBe('not_enough_construction_robots|nauvis||');
	});

	it('should include custom messages in hash', () => {
		const alert1: Alert = {
			tick: 1000,
			type: 'custom',
			surface: 'nauvis',
			message: 'Test message 1'
		};

		const alert2: Alert = {
			tick: 1000,
			type: 'custom',
			surface: 'nauvis',
			message: 'Test message 2'
		};

		expect(hashAlert(alert1)).not.toBe(hashAlert(alert2));
	});
});
});
});
});
