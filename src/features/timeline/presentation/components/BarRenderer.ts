import { TimelineItem } from '../../domain/entities/TimelineItem';
import { TimelineBounds } from '../../domain/entities/TimelineBounds';
import { DateFormatter } from '../utils/DateFormatter';

export interface BarColors {
	projectColor: string;
	taskColor: string;
}

export class BarRenderer {
	private dateFormatter: DateFormatter;
	private onTaskToggle?: (filePath: string, content: string, completed: boolean) => void;

	constructor(onTaskToggle?: (filePath: string, content: string, completed: boolean) => void) {
		this.dateFormatter = new DateFormatter();
		this.onTaskToggle = onTaskToggle;
	}

	createBar(item: TimelineItem, bounds: TimelineBounds, colors: BarColors, onFileClick?: (filePath: string) => void): HTMLElement {
		const wrapper = document.createElement('div');
		wrapper.className = 'gantt-bar-wrapper';

		if (!item.startDate || !item.endDate) return wrapper;

		// Calculate position and width
		const startOffset = (item.startDate.getTime() - bounds.start.getTime()) / (1000 * 60 * 60 * 24);
		let duration = (item.endDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24);

		// Ensure minimum duration of 1 day for display purposes
		if (duration < 1) {
			duration = 1;
		}

		// Each day = 40px in the grid
		const dayWidthPx = 40;
		const leftPx = startOffset * dayWidthPx;
		const widthPx = duration * dayWidthPx;

		wrapper.style.position = 'absolute';
		wrapper.style.left = `${leftPx}px`;
		wrapper.style.width = `${widthPx}px`;
		wrapper.style.minWidth = '150px';
		wrapper.style.top = '5px';
		wrapper.style.minHeight = '32px';
		wrapper.style.maxHeight = '60px';
		wrapper.style.borderRadius = '6px';

		// Apply custom color
		const color = item.type === 'project' ? colors.projectColor : colors.taskColor;
		wrapper.style.background = `linear-gradient(135deg, ${color} 0%, ${this.lightenColor(color, 20)} 100%)`;

		// Add click handler to wrapper
		if (onFileClick) {
			wrapper.style.cursor = 'pointer';
			wrapper.addEventListener('click', () => {
				onFileClick(item.file);
			});
		}

		// Bar content (will be positioned dynamically)
		const barContent = wrapper.createEl('div', { cls: 'gantt-bar-content' });
		barContent.setAttribute('data-bar-left', leftPx.toString());
		barContent.setAttribute('data-bar-width', widthPx.toString());

		// Store task info for updates
		if (item.type === 'task' && item.content) {
			barContent.setAttribute('data-task-file', item.file);
			barContent.setAttribute('data-task-content', item.content);
		}

		// Add checkbox for tasks
		if (item.type === 'task') {
			const checkbox = barContent.createEl('input', {
				cls: 'gantt-task-checkbox',
				type: 'checkbox'
			});
			checkbox.checked = item.completed || false;
			checkbox.addEventListener('click', (e) => {
				e.stopPropagation(); // Prevent opening file
				if (this.onTaskToggle && item.content) {
					const newCompleted = checkbox.checked;
					// Read current content from DOM attribute to get updated checkbox state
					const currentContent = barContent.getAttribute('data-task-content') || item.content;
					this.onTaskToggle(item.file, currentContent, newCompleted);
				}
			});
		}

		// Type icon (only for projects)
		if (item.type === 'project') {
			const typeIcon = barContent.createEl('span', { cls: 'gantt-bar-type-icon' });
			typeIcon.textContent = '📁';
		}

		// Title
		const titleSpan = barContent.createEl('span', { cls: 'gantt-bar-title' });
		titleSpan.textContent = item.title;
		if (item.type === 'task' && item.completed) {
			titleSpan.style.textDecoration = 'line-through';
			titleSpan.style.opacity = '0.6';
		}

		// Tooltip
		const tooltip = wrapper.createEl('div', { cls: 'gantt-bar-tooltip' });
		tooltip.innerHTML = `
			<strong>${item.title}</strong><br>
			${this.dateFormatter.formatDate(item.startDate)} - ${this.dateFormatter.formatDate(item.endDate)}<br>
			<span class="tooltip-duration">${Math.ceil(duration)} day${duration > 1 ? 's' : ''}</span>
		`;

		return wrapper;
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
