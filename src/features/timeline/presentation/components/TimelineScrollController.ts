import { TimelineBounds } from '../../domain/entities/TimelineBounds';

export class TimelineScrollController {
	scrollToToday(timelineArea: HTMLElement, bounds: TimelineBounds, smooth: boolean = true): void {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Calculate days from start to today
		const daysFromStart = Math.floor((today.getTime() - bounds.start.getTime()) / (1000 * 60 * 60 * 24));

		// Each day is 40px wide
		const scrollPosition = daysFromStart * 40;

		// Scroll to position
		timelineArea.scrollTo({
			left: scrollPosition - (timelineArea.clientWidth / 2) + 20, // Center today
			behavior: smooth ? 'smooth' : 'auto'
		});
	}
}
