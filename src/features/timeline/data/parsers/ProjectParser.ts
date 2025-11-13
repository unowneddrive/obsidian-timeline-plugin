import { TFile, CachedMetadata } from 'obsidian';
import { TimelineItem } from '../../domain/entities/TimelineItem';

export class ProjectParser {
	private titleField: string;
	private startDateFields: string[];
	private endDateFields: string[];

	constructor(
		titleField: string,
		startDateField: string,
		endDateField: string
	) {
		this.titleField = titleField;
		this.startDateFields = startDateField.split(',').map(f => f.trim());
		this.endDateFields = endDateField.split(',').map(f => f.trim());
	}

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

	private getFieldValue(fm: any, fields: string[]): any {
		for (const field of fields) {
			if (fm[field] !== undefined && fm[field] !== null) {
				return fm[field];
			}
		}
		return null;
	}

	async parseProject(file: TFile, cache: CachedMetadata): Promise<TimelineItem | null> {
		if (!cache?.frontmatter) return null;

		const fm = cache.frontmatter;

		// Check if any start date field exists
		const startDateValue = this.getFieldValue(fm, this.startDateFields);
		if (!startDateValue) {
			return null;
		}

		const title = fm[this.titleField] || file.basename;
		const startDate = this.parseDate(startDateValue);
		const endDateValue = this.getFieldValue(fm, this.endDateFields);
		const endDate = this.parseDate(endDateValue);

		return {
			title,
			startDate,
			endDate,
			type: 'project',
			file: file.path
		};
	}
}
