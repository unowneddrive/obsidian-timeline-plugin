import { TFile, CachedMetadata } from 'obsidian';
import { TimelineItem } from '../../domain/entities/TimelineItem';

export class ProjectParser {
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

	async parseProject(file: TFile, cache: CachedMetadata): Promise<TimelineItem | null> {
		if (!cache?.frontmatter) return null;

		const fm = cache.frontmatter;
		if (!fm.startDate && !fm['start-date'] && !fm.start) {
			return null;
		}

		const title = fm.title || file.basename;
		const startDate = this.parseDate(fm.startDate || fm['start-date'] || fm.start);
		const endDate = this.parseDate(fm.endDate || fm['end-date'] || fm.end);

		return {
			title,
			startDate,
			endDate,
			type: 'project',
			file: file.path
		};
	}
}
