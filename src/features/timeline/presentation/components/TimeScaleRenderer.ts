import { TimelineBounds } from '../../domain/entities/TimelineBounds';

export class TimeScaleRenderer {
	render(container: HTMLElement, bounds: TimelineBounds): void {
		const scaleContainer = container.createEl('div', { cls: 'gantt-time-scale' });

		// Create three rows: year, month, day
		const yearRow = scaleContainer.createEl('div', { cls: 'gantt-year-row' });
		const monthRow = scaleContainer.createEl('div', { cls: 'gantt-month-row' });
		const dayRow = scaleContainer.createEl('div', { cls: 'gantt-day-row' });

		// Calculate year and month spans
		const yearSpans = this.calculateYearSpans(bounds);
		const monthSpans = this.calculateMonthSpans(bounds);

		// Render year labels
		for (const span of yearSpans) {
			const yearLabel = yearRow.createEl('div', { cls: 'gantt-year-label' });
			yearLabel.textContent = span.year.toString();
			yearLabel.style.width = `${span.days * 40}px`;
		}

		// Render month labels
		for (const span of monthSpans) {
			const monthLabel = monthRow.createEl('div', { cls: 'gantt-month-label' });
			monthLabel.textContent = span.month;
			monthLabel.style.width = `${span.days * 40}px`;
		}

		// Render day labels - use bounds.totalDays to ensure consistency
		const currentDate = new Date(bounds.start);
		currentDate.setHours(0, 0, 0, 0);

		for (let i = 0; i < bounds.totalDays; i++) {
			const dayLabel = dayRow.createEl('div', { cls: 'gantt-day-label' });
			dayLabel.textContent = currentDate.getDate().toString();
			// Use milliseconds for reliable date increment
			currentDate.setTime(currentDate.getTime() + 24 * 60 * 60 * 1000);
		}
	}

	private calculateYearSpans(bounds: TimelineBounds): Array<{ year: number; days: number }> {
		const spans: Array<{ year: number; days: number }> = [];
		const currentDate = new Date(bounds.start);
		currentDate.setHours(0, 0, 0, 0);
		let currentYear = currentDate.getFullYear();
		let dayCount = 0;

		for (let i = 0; i < bounds.totalDays; i++) {
			const year = currentDate.getFullYear();
			if (year !== currentYear) {
				spans.push({ year: currentYear, days: dayCount });
				currentYear = year;
				dayCount = 0;
			}
			dayCount++;
			// Use milliseconds for reliable date increment
			currentDate.setTime(currentDate.getTime() + 24 * 60 * 60 * 1000);
		}

		if (dayCount > 0) {
			spans.push({ year: currentYear, days: dayCount });
		}

		return spans;
	}

	private calculateMonthSpans(bounds: TimelineBounds): Array<{ month: string; days: number }> {
		const spans: Array<{ month: string; days: number }> = [];
		const currentDate = new Date(bounds.start);
		currentDate.setHours(0, 0, 0, 0);
		let currentMonth = currentDate.getMonth();
		let currentYear = currentDate.getFullYear();
		let dayCount = 0;

		for (let i = 0; i < bounds.totalDays; i++) {
			const month = currentDate.getMonth();
			const year = currentDate.getFullYear();

			if (month !== currentMonth || year !== currentYear) {
				const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'short' });
				spans.push({ month: monthName, days: dayCount });
				currentMonth = month;
				currentYear = year;
				dayCount = 0;
			}
			dayCount++;
			// Use milliseconds for reliable date increment
			currentDate.setTime(currentDate.getTime() + 24 * 60 * 60 * 1000);
		}

		if (dayCount > 0) {
			const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'short' });
			spans.push({ month: monthName, days: dayCount });
		}

		return spans;
	}
}
