/**
 * Custom time formatters for chart axes and tooltips
 */

/**
 * Format a timestamp as relative time from now (e.g., "-5m", "-1h 30m")
 * @param timestamp Timestamp in milliseconds
 * @param now Current time in milliseconds (defaults to Date.now())
 * @returns Formatted relative time string
 */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
	const secondsAgo = Math.round((now - timestamp) / 1000);
	
	// Future timestamps (shouldn't happen, but handle gracefully)
	if (secondsAgo < 0) {
		return 'now';
	}
	
	// Less than 1 minute
	if (secondsAgo < 60) {
		return secondsAgo === 0 ? 'now' : `-${secondsAgo}s`;
	}
	
	// Less than 1 hour
	if (secondsAgo < 3600) {
		const minutes = Math.floor(secondsAgo / 60);
		const seconds = secondsAgo % 60;
		// Show seconds only if less than 5 minutes
		if (minutes < 5 && seconds > 0) {
			return `-${minutes}m ${seconds}s`;
		}
		return `-${minutes}m`;
	}
	
	// 1 hour or more
	const hours = Math.floor(secondsAgo / 3600);
	const remainingSeconds = secondsAgo % 3600;
	const minutes = Math.floor(remainingSeconds / 60);
	
	if (minutes > 0) {
		return `-${hours}h ${minutes}m`;
	}
	return `-${hours}h`;
}

/**
 * Format a timestamp as 24-hour time (HH:mm:ss)
 * @param timestamp Timestamp in milliseconds
 * @returns Formatted 24-hour time string
 */
export function format24HourTime(timestamp: number): string {
	const date = new Date(timestamp);
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	const seconds = date.getSeconds().toString().padStart(2, '0');
	return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format a timestamp as 24-hour time without seconds (HH:mm)
 * @param timestamp Timestamp in milliseconds
 * @returns Formatted 24-hour time string without seconds
 */
export function format24HourTimeShort(timestamp: number): string {
	const date = new Date(timestamp);
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	return `${hours}:${minutes}`;
}

/**
 * Chart.js callback for relative time axis ticks
 * Uses dynamic "now" to ensure labels stay current as data updates
 */
export function relativeTimeTickCallback(value: number | string): string {
	const timestamp = typeof value === 'number' ? value : parseInt(value);
	// Use dynamic "now" so labels update correctly as time passes
	return formatRelativeTime(timestamp, Date.now());
}

/**
 * Chart.js callback for 24-hour time axis ticks
 */
export function format24HourTimeTickCallback(value: number | string): string {
	const timestamp = typeof value === 'number' ? value : parseInt(value);
	return format24HourTime(timestamp);
}
