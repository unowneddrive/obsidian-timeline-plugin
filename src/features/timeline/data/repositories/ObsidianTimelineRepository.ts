import { App } from 'obsidian';
import { ITimelineRepository } from '../../domain/repositories/ITimelineRepository';
import { TimelineItem } from '../../domain/entities/TimelineItem';
import { ProjectParser } from '../parsers/ProjectParser';
import { TaskParser } from '../parsers/TaskParser';
import { PluginSettings } from '../../../../core/domain/entities/PluginSettings';

export class ObsidianTimelineRepository implements ITimelineRepository {
	private projectParser: ProjectParser;
	private taskParser: TaskParser;

	constructor(private app: App, settings: PluginSettings) {
		this.projectParser = new ProjectParser(
			settings.projectTitleField,
			settings.projectStartDateField,
			settings.projectEndDateField
		);
		this.taskParser = new TaskParser();
	}

	async getTimelineItems(showProjects: boolean, showTasks: boolean): Promise<TimelineItem[]> {
		const items: TimelineItem[] = [];
		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			const content = await this.app.vault.read(file);

			// Parse projects from frontmatter
			if (showProjects && cache) {
				const project = await this.projectParser.parseProject(file, cache);
				if (project) {
					items.push(project);
				}
			}

			// Parse tasks with #task tag
			if (showTasks && cache) {
				const tasks = await this.taskParser.parseTasks(file, cache, content);
				items.push(...tasks);
			}
		}

		return items;
	}
}
