import { TimelineItem } from '../entities/TimelineItem';
import { ITimelineRepository } from '../repositories/ITimelineRepository';

export class GetTimelineItems {
	constructor(private repository: ITimelineRepository) {}

	async execute(showProjects: boolean, showTasks: boolean): Promise<TimelineItem[]> {
		const items = await this.repository.getTimelineItems(showProjects, showTasks);

		// Debug: log all items
		console.log('[Timeline Items Debug] Total items:', items.length);
		items.forEach((item, index) => {
			console.log(`[Timeline Item ${index}]`, {
				title: item.title,
				type: item.type,
				startDate: item.startDate?.toISOString(),
				endDate: item.endDate?.toISOString(),
				file: item.file
			});
		});

		// Sort by start date
		return items.sort((a, b) => {
			if (!a.startDate && !b.startDate) return 0;
			if (!a.startDate) return 1;
			if (!b.startDate) return -1;
			return a.startDate.getTime() - b.startDate.getTime();
		});
	}
}
