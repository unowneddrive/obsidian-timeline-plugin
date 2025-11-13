import { TimelineItem } from '../entities/TimelineItem';
import { TimelineBounds } from '../entities/TimelineBounds';

export class CalculateTimelineBounds {
	execute(items: TimelineItem[]): TimelineBounds | null {
		let minDate: Date | null = null;
		let maxDate: Date | null = null;
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (const item of items) {
			if (item.startDate) {
				if (!minDate || item.startDate < minDate) minDate = item.startDate;
			}
			if (item.endDate) {
				if (!maxDate || item.endDate > maxDate) maxDate = item.endDate;
			}
		}

		// If no items, show timeline around today
		if (!minDate || !maxDate) {
			minDate = new Date(today);
			maxDate = new Date(today);
		}

		// Extend to show 6 months before earliest date and 6 months after latest date
		const sixMonthsMs = 180 * 24 * 60 * 60 * 1000;
		const startDate = new Date(Math.min(minDate.getTime() - sixMonthsMs, today.getTime() - sixMonthsMs));
		const endDate = new Date(Math.max(maxDate.getTime() + sixMonthsMs, today.getTime() + sixMonthsMs));

		const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

		// Debug logging
		console.log('[Timeline Bounds Debug]', {
			today: today.toISOString(),
			minDate: minDate?.toISOString(),
			maxDate: maxDate?.toISOString(),
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
			totalDays,
			itemCount: items.length
		});

		return { start: startDate, end: endDate, totalDays };
	}
}
