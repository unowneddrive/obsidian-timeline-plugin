import { TimelineItem } from '../../domain/entities/TimelineItem';
import { TimelineBounds } from '../../domain/entities/TimelineBounds';
import { DateFormatter } from '../utils/DateFormatter';

export class BarRenderer {
	private dateFormatter: DateFormatter;

	constructor() {
		this.dateFormatter = new DateFormatter();
	}

	createBar(item: TimelineItem, bounds: TimelineBounds): HTMLElement {
		const bar = document.createElement('div');
		bar.className = `gantt-bar gantt-bar-${item.type}`;

		if (!item.startDate || !item.endDate) return bar;

		// Calculate position and width
		const startOffset = (item.startDate.getTime() - bounds.start.getTime()) / (1000 * 60 * 60 * 24);
		const duration = (item.endDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24);

		const leftPercent = (startOffset / bounds.totalDays) * 100;
		const widthPercent = (duration / bounds.totalDays) * 100;

		bar.style.left = `${leftPercent}%`;
		bar.style.width = `${Math.max(widthPercent, 1)}%`;

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
}
