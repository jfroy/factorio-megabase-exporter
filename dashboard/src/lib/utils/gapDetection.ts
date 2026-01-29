/**
 * Utilities for detecting and handling data discontinuities in time-series data
 */

export interface DataGap {
	startIndex: number;
	endIndex: number;
	startTimestamp: number;
	endTimestamp: number;
	duration: number; // in milliseconds
}

/**
 * Detect gaps in time-series data based on expected polling interval
 * @param timestamps Array of timestamps in milliseconds
 * @param expectedIntervalMs Expected polling interval (e.g., 5000 for 5 seconds)
 * @param gapThresholdMultiplier Multiplier for expected interval to consider as gap (default: 2)
 * @returns Array of detected gaps
 */
export function detectGaps(
	timestamps: number[],
	expectedIntervalMs: number,
	gapThresholdMultiplier: number = 2
): DataGap[] {
	const gaps: DataGap[] = [];
	const threshold = expectedIntervalMs * gapThresholdMultiplier;

	for (let i = 1; i < timestamps.length; i++) {
		const timeDiff = timestamps[i] - timestamps[i - 1];
		
		if (timeDiff > threshold) {
			gaps.push({
				startIndex: i - 1,
				endIndex: i,
				startTimestamp: timestamps[i - 1],
				endTimestamp: timestamps[i],
				duration: timeDiff
			});
		}
	}

	return gaps;
}

/**
 * Filter gaps to only include significant ones (e.g., longer than a certain duration)
 * @param gaps Array of all detected gaps
 * @param minDurationMs Minimum duration in milliseconds to be considered significant
 * @returns Array of significant gaps
 */
export function getSignificantGaps(gaps: DataGap[], minDurationMs: number): DataGap[] {
	return gaps.filter(gap => gap.duration >= minDurationMs);
}

/**
 * Format gap duration for display
 * @param durationMs Duration in milliseconds
 * @returns Human-readable duration string
 */
export function formatGapDuration(durationMs: number): string {
	const seconds = Math.floor(durationMs / 1000);
	
	if (seconds < 60) {
		return `${seconds}s gap`;
	} else if (seconds < 3600) {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return remainingSeconds > 0 
			? `${minutes}m ${remainingSeconds}s gap`
			: `${minutes}m gap`;
	} else {
		const hours = Math.floor(seconds / 3600);
		const remainingMinutes = Math.floor((seconds % 3600) / 60);
		return remainingMinutes > 0
			? `${hours}h ${remainingMinutes}m gap`
			: `${hours}h gap`;
	}
}
