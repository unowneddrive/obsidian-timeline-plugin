import { TFile, CachedMetadata } from 'obsidian';
import { TimelineItem } from '../../domain/entities/TimelineItem';

export class TaskParser {
	parseDate(dateStr: string | null | undefined): Date | null {
		if (!dateStr) return null;

		try {
			// Try parsing ISO format first
			const date = new Date(dateStr);
			if (!isNaN(date.getTime())) {
				return date;
			}
		} catch (e) {
			// ignore
		}

		return null;
	}

	async parseTasks(file: TFile, cache: CachedMetadata, content: string): Promise<TimelineItem[]> {
		const tasks: TimelineItem[] = [];

		if (!cache?.tags) return tasks;

		const taskTags = cache.tags.filter(tag => tag.tag === '#task');
		if (taskTags.length === 0) return tasks;

		const lines = content.split('\n');

		for (const line of lines) {
			if (line.includes('#task')) {
				// Try to extract dates from the line
				const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/g);
				const startDate = dateMatch && dateMatch[0] ? this.parseDate(dateMatch[0]) : null;
				const endDate = dateMatch && dateMatch[1] ? this.parseDate(dateMatch[1]) : null;

				// Check if task is completed (checkbox with x)
				const checkboxMatch = line.match(/^[-*]\s*\[(.)\]/);
				const completed = checkboxMatch ? (checkboxMatch[1] === 'x' || checkboxMatch[1] === 'X') : undefined;

				// Extract task title (remove #task and dates)
				let taskTitle = line.replace(/#task/g, '').replace(/\d{4}-\d{2}-\d{2}/g, '').trim();
				taskTitle = taskTitle.replace(/^[-*]\s*\[.\]\s*/, '').trim(); // Remove checkbox if present

				if (taskTitle) {
					const task: any = {
						title: taskTitle,
						startDate: startDate,
						endDate: endDate || startDate,
						type: 'task',
						file: file.path,
						content: line.trim()
					};

					if (completed !== undefined) {
						task.completed = completed;
					}

					tasks.push(task);
				}
			}
		}

		return tasks;
	}
}
