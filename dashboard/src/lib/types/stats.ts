// Quality levels for Factorio items
export type QualityLevel = 'normal' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Science pack types
export type SciencePackType = 
	| 'automation-science-pack'
	| 'logistic-science-pack'
	| 'military-science-pack'
	| 'chemical-science-pack'
	| 'production-science-pack'
	| 'utility-science-pack'
	| 'space-science-pack'
	| 'metallurgic-science-pack'
	| 'electromagnetic-science-pack'
	| 'agricultural-science-pack'
	| 'cryogenic-science-pack'
	| 'promethium-science-pack'
	| 'science'; // Special eSPM entity

// Statistics for a single science pack at a quality level
export interface SciencePackStats {
	produced: number;
	consumed: number;
	stored: number;
}

// Research item in the queue
export interface ResearchItem {
	position: number;
	name: string;
	localised_name: string[];
	level: number;
	progress?: number; // Only present for position 1 (current research)
}

// Research queue
export interface ResearchQueue {
	queue: ResearchItem[];
}

// Science pack data structure (flat keys with quality suffix)
export type ScienceData = {
	[key: string]: SciencePackStats;
};

// Main stats structure from JSON
export interface FactorioStats {
	timestamp: number;
	game_time: number;
	science_packs: {
		total: ScienceData;
		rate_1m: ScienceData;
	};
	research: ResearchQueue;
}

// Parsed science pack entry for easier component usage
export interface ParsedSciencePack {
	type: SciencePackType;
	quality: QualityLevel;
	total: SciencePackStats;
	rate: SciencePackStats;
}

// Helper function to parse the flat key structure
export function parseScienceKey(key: string): { type: SciencePackType; quality: QualityLevel } | null {
	const parts = key.split('_');
	if (parts.length < 2) return null;

	const quality = parts[parts.length - 1] as QualityLevel;
	const type = parts.slice(0, -1).join('-') as SciencePackType;

	return { type, quality };
}

// Helper function to create a science key from type and quality
export function createScienceKey(type: SciencePackType, quality: QualityLevel): string {
	return `${type}_${quality}`;
}

// Get all parsed science packs from stats
export function getParsedSciencePacks(stats: FactorioStats): ParsedSciencePack[] {
	const packs: ParsedSciencePack[] = [];
	const seenKeys = new Set<string>();

	// Iterate through total data to find all science packs
	for (const key in stats.science_packs.total) {
		if (seenKeys.has(key)) continue;
		seenKeys.add(key);

		const parsed = parseScienceKey(key);
		if (!parsed) continue;

		const total = stats.science_packs.total[key];
		const rate = stats.science_packs.rate_1m[key] || { produced: 0, consumed: 0, stored: 0 };

		packs.push({
			type: parsed.type,
			quality: parsed.quality,
			total,
			rate
		});
	}

	return packs;
}
