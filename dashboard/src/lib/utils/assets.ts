/**
 * Utility functions for handling game asset URLs
 */

/**
 * Generate the URL for a technology asset
 * @param techName - The technology name (e.g., "automation-2", "steel-processing")
 * @returns The URL to fetch the technology icon
 */
export function getTechnologyAssetUrl(techName: string): string {
	// Technology icons in Factorio are stored as PNG files with the same name as the technology
	// Example: automation-2.png, steel-processing.png
	return `/api/assets/technology/${techName}.png`;
}

/**
 * Generate the URL for a science pack asset
 * @param sciencePackName - The science pack name (e.g., "automation-science-pack")
 * @returns The URL to fetch the science pack icon
 */
export function getSciencePackAssetUrl(sciencePackName: string): string {
	return `/api/assets/technology/${sciencePackName}.png`;
}
