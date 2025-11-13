import { TimelineBounds } from '../../domain/entities/TimelineBounds';

export class TimeScaleRenderer {
	render(container: HTMLElement, bounds: TimelineBounds): void {
		const scaleContainer = container.createEl('div', { cls: 'gantt-time-scale' });

		const currentDate = new Date(bounds.start);

		while (currentDate <= bounds.end) {
			const dayLabel = scaleContainer.createEl('div', { cls: 'gantt-day-label' });

			const isFirstOfMonth = currentDate.getDate() === 1;
			if (isFirstOfMonth) {
				dayLabel.addClass('gantt-day-first-of-month');
			}

			// Show day number
			const day = currentDate.getDate();
			const month = currentDate.toLocaleDateString('en-US', { month: 'short' });

			// Show month for first day of month, otherwise just day
			dayLabel.textContent = isFirstOfMonth ? `${month} ${day}` : `${day}`;

			currentDate.setDate(currentDate.getDate() + 1);
		}
	}
}
