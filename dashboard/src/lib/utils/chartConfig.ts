import type { ChartOptions } from 'chart.js';
import type { SciencePackType } from '../types/stats';

/**
 * Color mapping for science packs
 */
export const SCIENCE_COLORS: Record<SciencePackType, string> = {
	'automation-science-pack': '#D12D2D',
	'logistic-science-pack': '#36A129',
	'military-science-pack': '#4E5154',
	'chemical-science-pack': '#27A9D1',
	'production-science-pack': '#9E33D1',
	'utility-science-pack': '#D1A527',
	'space-science-pack': '#C1C1C1',
	'metallurgic-science-pack': '#FF9E21',
	'electromagnetic-science-pack': '#FF39B0',
	'agricultural-science-pack': '#B6D11B',
	'cryogenic-science-pack': '#2143D1',
	'promethium-science-pack': '#2C264D',
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
			border: {
				display: false
			},
			grid: {
				color: 'rgba(255, 255, 255, 0.1)'
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
			border: {
				display: false
			},
			grid: {
				color: 'rgba(255, 255, 255, 0.1)'
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
	responsive: true,
	maintainAspectRatio: false,
	animation: false,
	indexAxis: 'y' as const,
	interaction: {
		mode: 'index',
		intersect: false,
	},
	plugins: {
		legend: {
			display: false
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
					if (context.parsed.x !== null) {
						const value = context.parsed.x;
						if (value >= 1000000) {
							label += (value / 1000000).toFixed(2) + 'M/m';
						} else if (value >= 1000) {
							label += (value / 1000).toFixed(2) + 'k/m';
						} else {
							label += value.toFixed(0) + '/m';
						}
					}
					return label;
				}
			}
		}
	},
	scales: {
		x: {
			border: {
				display: false
			},
			grid: {
				color: 'rgba(255, 255, 255, 0.1)'
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
		},
		y: {
			border: {
				display: false
			},
			grid: {
				color: 'rgba(255, 255, 255, 0.1)'
			},
			ticks: {
				color: '#a0a0a0',
				font: {
					family: 'monospace',
					size: 10
				}
			}
		}
	}
};
