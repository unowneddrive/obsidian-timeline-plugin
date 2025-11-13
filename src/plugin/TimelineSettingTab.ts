import { App, PluginSettingTab, Setting } from 'obsidian';
import TimelinePlugin from './TimelinePlugin';

export class TimelineSettingTab extends PluginSettingTab {
	plugin: TimelinePlugin;

	constructor(app: App, plugin: TimelinePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Timeline Plugin Settings' });

		new Setting(containerEl)
			.setName('Show projects')
			.setDesc('Display projects from file frontmatter')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showProjects)
				.onChange(async (value) => {
					this.plugin.settings.showProjects = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show tasks')
			.setDesc('Display tasks with #task tag')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showTasks)
				.onChange(async (value) => {
					this.plugin.settings.showTasks = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', { text: 'Colors' });

		new Setting(containerEl)
			.setName('Project color')
			.setDesc('Color for project bars')
			.addColorPicker(color => color
				.setValue(this.plugin.settings.projectColor)
				.onChange(async (value) => {
					this.plugin.settings.projectColor = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Task color')
			.setDesc('Color for task bars')
			.addColorPicker(color => color
				.setValue(this.plugin.settings.taskColor)
				.onChange(async (value) => {
					this.plugin.settings.taskColor = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', { text: 'Project Fields' });

		new Setting(containerEl)
			.setName('Title field')
			.setDesc('Frontmatter field name for project title (default: title)')
			.addText(text => text
				.setPlaceholder('title')
				.setValue(this.plugin.settings.projectTitleField)
				.onChange(async (value) => {
					this.plugin.settings.projectTitleField = value || 'title';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Start date field')
			.setDesc('Frontmatter field name(s) for start date, comma-separated (e.g., start_date,startDate)')
			.addText(text => text
				.setPlaceholder('start_date')
				.setValue(this.plugin.settings.projectStartDateField)
				.onChange(async (value) => {
					this.plugin.settings.projectStartDateField = value || 'start_date';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('End date field')
			.setDesc('Frontmatter field name(s) for end date, comma-separated (e.g., finish_date,endDate)')
			.addText(text => text
				.setPlaceholder('finish_date')
				.setValue(this.plugin.settings.projectEndDateField)
				.onChange(async (value) => {
					this.plugin.settings.projectEndDateField = value || 'finish_date';
					await this.plugin.saveSettings();
				}));
	}
}
