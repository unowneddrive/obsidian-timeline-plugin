export interface TimelineItem {
	title: string;
	startDate: Date | null;
	endDate: Date | null;
	type: 'project' | 'task';
	file: string;
	content?: string;
}
