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
	}
}
