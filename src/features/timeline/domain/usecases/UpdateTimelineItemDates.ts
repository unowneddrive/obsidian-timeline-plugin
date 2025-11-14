import { App, TFile } from 'obsidian';
import { TimelineItem } from '../entities/TimelineItem';
import { PluginSettings } from '../../../../core/domain/entities/PluginSettings';

export class UpdateTimelineItemDates {
	private app: App;
	private settings: PluginSettings;

	constructor(app: App, settings: PluginSettings) {
		this.app = app;
		this.settings = settings;
	}

	formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	async execute(
		item: TimelineItem,
		newStartDate: Date,
		newEndDate: Date
	): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(item.file);
		if (!file || !(file instanceof TFile)) {
			throw new Error(`File not found: ${item.file}`);
		}

		if (item.type === 'project') {
			await this.updateProjectDates(file, newStartDate, newEndDate);
		} else if (item.type === 'task') {
			await this.updateTaskDates(file, item, newStartDate, newEndDate);
		}
	}

	private async updateProjectDates(
		file: TFile,
		newStartDate: Date,
		newEndDate: Date
	): Promise<void> {
		const fileContent = await this.app.vault.read(file);
		const lines = fileContent.split('\n');

		// Parse frontmatter
		let inFrontmatter = false;
		let frontmatterStart = -1;
		let frontmatterEnd = -1;

		for (let i = 0; i < lines.length; i++) {
			if (lines[i].trim() === '---') {
				if (!inFrontmatter) {
					inFrontmatter = true;
					frontmatterStart = i;
				} else {
					frontmatterEnd = i;
					break;
				}
			}
		}

		if (frontmatterStart === -1 || frontmatterEnd === -1) {
			// No frontmatter, create one
			const newFrontmatter = [
				'---',
				`${this.settings.projectStartDateField}: ${this.formatDate(newStartDate)}`,
				`${this.settings.projectEndDateField}: ${this.formatDate(newEndDate)}`,
				'---',
				''
			];
			lines.unshift(...newFrontmatter);
		} else {
			// Update existing frontmatter
			const startDateFields = this.settings.projectStartDateField.split(',').map((f: string) => f.trim());
			const endDateFields = this.settings.projectEndDateField.split(',').map((f: string) => f.trim());

			let startDateUpdated = false;
			let endDateUpdated = false;

			// Update existing fields
			for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
				const line = lines[i];
				const colonIndex = line.indexOf(':');
				if (colonIndex === -1) continue;

				const fieldName = line.substring(0, colonIndex).trim();

				// Check if this is a start date field
				if (startDateFields.includes(fieldName)) {
					lines[i] = `${fieldName}: ${this.formatDate(newStartDate)}`;
					startDateUpdated = true;
				}

				// Check if this is an end date field
				if (endDateFields.includes(fieldName)) {
					lines[i] = `${fieldName}: ${this.formatDate(newEndDate)}`;
					endDateUpdated = true;
				}
			}

			// Add fields if they don't exist
			if (!startDateUpdated) {
				const firstStartField = startDateFields[0];
				lines.splice(frontmatterEnd, 0, `${firstStartField}: ${this.formatDate(newStartDate)}`);
				frontmatterEnd++;
			}

			if (!endDateUpdated) {
				const firstEndField = endDateFields[0];
				lines.splice(frontmatterEnd, 0, `${firstEndField}: ${this.formatDate(newEndDate)}`);
			}
		}

		await this.app.vault.modify(file, lines.join('\n'));
	}

	private async updateTaskDates(
		file: TFile,
		item: TimelineItem,
		newStartDate: Date,
		newEndDate: Date
	): Promise<void> {
		if (!item.content) {
			throw new Error('Task content not found');
		}

		const fileContent = await this.app.vault.read(file);
		const lines = fileContent.split('\n');

		// Find the line with the task
		const lineIndex = lines.findIndex(line => line.trim() === item.content);
		if (lineIndex === -1) {
			throw new Error('Task line not found in file');
		}

		const line = lines[lineIndex];

		// Replace dates in the line
		// Pattern: YYYY-MM-DD
		const datePattern = /\d{4}-\d{2}-\d{2}/g;
		const matches = line.match(datePattern);

		if (!matches || matches.length === 0) {
			// No dates in line, add them before #task
			const taskIndex = line.indexOf('#task');
			if (taskIndex === -1) {
				throw new Error('#task tag not found');
			}

			const beforeTask = line.substring(0, taskIndex);
			const afterTask = line.substring(taskIndex);
			lines[lineIndex] = `${beforeTask}${this.formatDate(newStartDate)} ${this.formatDate(newEndDate)} ${afterTask}`;
		} else if (matches.length === 1) {
			// One date - update it and add the second one
			const newDates = `${this.formatDate(newStartDate)} ${this.formatDate(newEndDate)}`;
			lines[lineIndex] = line.replace(datePattern, newDates);
		} else {
			// Two or more dates - update first two
			let dateCount = 0;
			lines[lineIndex] = line.replace(datePattern, (match) => {
				if (dateCount === 0) {
					dateCount++;
					return this.formatDate(newStartDate);
				} else if (dateCount === 1) {
					dateCount++;
					return this.formatDate(newEndDate);
				}
				return match; // Keep other dates unchanged
			});
		}

		await this.app.vault.modify(file, lines.join('\n'));
	}
}
