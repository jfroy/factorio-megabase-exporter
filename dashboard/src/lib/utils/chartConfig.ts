import type { ChartOptions } from 'chart.js';
import type { SciencePackType } from '../types/stats';

/**
 * Color mapping for science packs
 */
export const SCIENCE_COLORS: Record<SciencePackType, string> = {
	'automation-science-pack': '#cc0000',
	'logistic-science-pack': '#00cc00',
	'military-science-pack': '#666666',
	'chemical-science-pack': '#0099ff',
	'production-science-pack': '#cc00ff',
	'utility-science-pack': '#ffcc00',
	'space-science-pack': '#ffffff',
	'metallurgic-science-pack': '#cd7f32',
	'electromagnetic-science-pack': '#00ffff',
	'agricultural-science-pack': '#99ff00',
	'cryogenic-science-pack': '#b0e0ff',
	'promethium-science-pack': '#ff1493',
	'science': '#ff7700' // Special eSPM color
};

/**
 * Get color for a science pack type
 */
export function getScienceColor(type: SciencePackType): string {
	return SCIENCE_COLORS[type] || '#ffffff';
}

/**
 * Default Chart.js options with Factorio theme
 */
export const defaultChartOptions: ChartOptions<'line'> = {
	responsive: true,
	maintainAspectRatio: false,
	animation: false, // Disable for smoother updates
	interaction: {
		mode: 'index',
		intersect: false,
	},
	plugins: {
		legend: {
			display: true,
			position: 'bottom',
			labels: {
				color: '#e0e0e0',
				font: {
					family: 'monospace',
					size: 11
				},
				padding: 10,
				usePointStyle: true,
				boxWidth: 8,
				boxHeight: 8
			}
		},
		tooltip: {
			enabled: true,
			mode: 'index',
			intersect: false,
			backgroundColor: 'rgba(0, 0, 0, 0.95)',
			titleColor: '#ff7700',
			bodyColor: '#e0e0e0',
			borderColor: '#ff7700',
			borderWidth: 2,
			padding: 16,
			displayColors: true,
			boxWidth: 12,
			boxHeight: 12,
			boxPadding: 6,
			usePointStyle: false,
			titleFont: {
				family: 'monospace',
				size: 13,
				weight: 'bold'
			},
			bodyFont: {
				family: 'monospace',
				size: 12
			},
			bodySpacing: 6,
			callbacks: {
				title: function(context) {
					return 'Time: ' + context[0].label;
				},
				label: function(context) {
					let label = context.dataset.label || '';
					if (label) {
						label += ': ';
					}
					if (context.parsed.y !== null) {
						const value = context.parsed.y;
						if (value >= 1000000) {
							label += (value / 1000000).toFixed(2) + 'M/m';
						} else if (value >= 1000) {
							label += (value / 1000).toFixed(2) + 'k/m';
						} else {
							label += value.toFixed(0) + '/m';
						}
					}
					return label;
				},
				afterBody: function(context) {
					if (context.length === 0) return [];
					
					// Calculate total for this time point
					let total = 0;
					context.forEach(item => {
						total += item.parsed.y || 0;
					});
					
					const totalStr = total >= 1000000 
						? (total / 1000000).toFixed(2) + 'M/m'
						: total >= 1000 
							? (total / 1000).toFixed(2) + 'k/m'
							: total.toFixed(0) + '/m';
					
					return ['\n─────────────', 'Total: ' + totalStr];
				}
			}
		}
	},
	scales: {
		x: {
			grid: {
				color: 'rgba(255, 255, 255, 0.1)',
				drawBorder: false
			},
			ticks: {
				color: '#a0a0a0',
				font: {
					family: 'monospace',
					size: 10
				}
			}
		},
		y: {
			grid: {
				color: 'rgba(255, 255, 255, 0.1)',
				drawBorder: false
			},
			ticks: {
				color: '#a0a0a0',
				font: {
					family: 'monospace',
					size: 10
				},
				callback: function(value) {
					const numValue = Number(value);
					if (numValue >= 1000000) {
						return (numValue / 1000000).toFixed(1) + 'M';
					} else if (numValue >= 1000) {
						return (numValue / 1000).toFixed(1) + 'k';
					}
					return numValue.toString();
				}
			},
			beginAtZero: true
		}
	}
};

/**
 * Options for bar charts
 */
export const barChartOptions: ChartOptions<'bar'> = {
	...defaultChartOptions,
	indexAxis: 'y' as const,
	plugins: {
		...defaultChartOptions.plugins,
		legend: {
			display: false
		}
	}
};
