import { TimelineItem } from '../../domain/entities/TimelineItem';
import { TimelineBounds } from '../../domain/entities/TimelineBounds';
import { DateFormatter } from '../utils/DateFormatter';

export interface BarColors {
	projectColor: string;
	taskColor: string;
}

export class BarRenderer {
	private dateFormatter: DateFormatter;

	constructor() {
		this.dateFormatter = new DateFormatter();
	}

	createBar(item: TimelineItem, bounds: TimelineBounds, colors: BarColors, onFileClick?: (filePath: string) => void): HTMLElement {
		const bar = document.createElement('div');
		bar.className = `gantt-bar gantt-bar-${item.type}`;

		if (!item.startDate || !item.endDate) return bar;

		// Calculate position and width
		const startOffset = (item.startDate.getTime() - bounds.start.getTime()) / (1000 * 60 * 60 * 24);
		let duration = (item.endDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24);

		// Ensure minimum duration of 1 day for display purposes
		if (duration < 1) {
			duration = 1;
		}

		const leftPercent = (startOffset / bounds.totalDays) * 100;
		const widthPercent = (duration / bounds.totalDays) * 100;

		// Debug logging
		console.log('BarRenderer positioning:', {
			title: item.title,
			startDate: item.startDate.toISOString().split('T')[0],
			endDate: item.endDate.toISOString().split('T')[0],
			boundsStart: bounds.start.toISOString().split('T')[0],
			boundsEnd: bounds.end.toISOString().split('T')[0],
			totalDays: bounds.totalDays,
			startOffset: startOffset.toFixed(2),
			duration: duration.toFixed(2),
			leftPercent: leftPercent.toFixed(2) + '%',
			widthPercent: widthPercent.toFixed(2) + '%'
		});

		bar.style.left = `${leftPercent}%`;
		// Minimum width of 40px (one day in grid) for readability
		const minWidthPx = 40;
		bar.style.minWidth = `${minWidthPx}px`;
		bar.style.width = `${widthPercent}%`;

		// Apply custom color
		const color = item.type === 'project' ? colors.projectColor : colors.taskColor;
		bar.style.background = `linear-gradient(135deg, ${color} 0%, ${this.lightenColor(color, 20)} 100%)`;

		// Add click handler to open file
		if (onFileClick) {
			bar.style.cursor = 'pointer';
			bar.addEventListener('click', () => {
				onFileClick(item.file);
			});
		}

		// Bar content
		const barContent = bar.createEl('div', { cls: 'gantt-bar-content' });

		// Type icon
		const typeIcon = barContent.createEl('span', { cls: 'gantt-bar-type-icon' });
		typeIcon.textContent = item.type === 'project' ? '📁' : '✓';

		// Title
		const titleSpan = barContent.createEl('span', { cls: 'gantt-bar-title' });
		titleSpan.textContent = item.title;

		// Tooltip
		const tooltip = bar.createEl('div', { cls: 'gantt-bar-tooltip' });
		tooltip.innerHTML = `
			<strong>${item.title}</strong><br>
			${this.dateFormatter.formatDate(item.startDate)} - ${this.dateFormatter.formatDate(item.endDate)}<br>
			<span class="tooltip-duration">${Math.ceil(duration)} day${duration > 1 ? 's' : ''}</span>
		`;

		return bar;
	}

	private lightenColor(color: string, percent: number): string {
		// Convert hex to RGB
		const hex = color.replace('#', '');
		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);

		// Lighten each component
		const newR = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
		const newG = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
		const newB = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

		// Convert back to hex
		return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
	}
}
