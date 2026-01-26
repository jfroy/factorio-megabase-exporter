import type { QualityLevel } from '../types/stats';

/**
 * Format a number with K/M/B suffix
 * @param value The number to format
 * @param decimals Number of decimal places (default: 1)
 */
export function formatNumber(value: number, decimals: number = 1): string {
	if (value === 0) return '0';
	
	const absValue = Math.abs(value);
	const sign = value < 0 ? '-' : '';

	if (absValue >= 1_000_000_000) {
		return sign + (absValue / 1_000_000_000).toFixed(decimals) + 'B';
	} else if (absValue >= 1_000_000) {
		return sign + (absValue / 1_000_000).toFixed(decimals) + 'M';
	} else if (absValue >= 1_000) {
		return sign + (absValue / 1_000).toFixed(decimals) + 'k';
	}
	
	return sign + absValue.toFixed(0);
}

/**
 * Format a rate value (items per minute)
 * @param value The rate value
 */
export function formatRate(value: number): string {
	if (value === 0) return '0/m';
	return formatNumber(value, 1) + '/m';
}

/**
 * Format game ticks to human-readable time
 * @param ticks Number of game ticks (60 ticks = 1 second)
 */
export function formatTime(ticks: number): string {
	const seconds = Math.floor(ticks / 60);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) {
		const remainingHours = hours % 24;
		return `${days}d ${remainingHours}h`;
	} else if (hours > 0) {
		const remainingMinutes = minutes % 60;
		return `${hours}h ${remainingMinutes}m`;
	} else if (minutes > 0) {
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds}s`;
	} else {
		return `${seconds}s`;
	}
}

/**
 * Format a timestamp to a readable date/time string
 */
export function formatTimestamp(timestamp: number): string {
	return new Date(timestamp).toLocaleTimeString();
}

/**
 * Get color for a quality level
 */
export function getQualityColor(quality: QualityLevel): string {
	switch (quality) {
		case 'normal':
			return '#ffffff';
		case 'uncommon':
			return '#4caf50'; // Green
		case 'rare':
			return '#2196f3'; // Blue
		case 'epic':
			return '#9c27b0'; // Purple
		case 'legendary':
			return '#ff9800'; // Orange
		default:
			return '#ffffff';
	}
}

/**
 * Get a display name for quality level
 */
export function getQualityName(quality: QualityLevel): string {
	return quality.charAt(0).toUpperCase() + quality.slice(1);
}

/**
 * Calculate estimated time remaining for research
 * @param progress Current progress (0-1)
 * @param rate Science consumption rate per minute
 * @param total Total science needed
 */
export function calculateTimeRemaining(
	progress: number,
	rate: number,
	total: number
): number {
	if (rate === 0 || progress >= 1) return 0;
	
	const remaining = total * (1 - progress);
	const minutesRemaining = remaining / rate;
	const ticksRemaining = minutesRemaining * 60 * 60; // Convert minutes to ticks
	
	return ticksRemaining;
}

/**
 * Format large numbers with commas
 */
export function formatNumberWithCommas(value: number): string {
	return value.toLocaleString('en-US');
}

/**
 * Get short display name for science pack
 */
export function getSciencePackShortName(name: string): string {
	return name
		.replace('-science-pack', '')
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * Prettify research/technology name
 * Splits by '-' and capitalizes the first letter of each word
 */
export function prettifyResearchName(name: string): string {
	if (!name) return 'Unknown';
	
	return name
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}
