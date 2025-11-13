import { TimelineItem } from '../entities/TimelineItem';

export interface ITimelineRepository {
	getTimelineItems(showProjects: boolean, showTasks: boolean): Promise<TimelineItem[]>;
}
