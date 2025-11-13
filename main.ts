import { App, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, TFile, CachedMetadata } from 'obsidian';

interface TimelinePluginSettings {
	orientation: 'vertical' | 'horizontal';
	showProjects: boolean;
	showTasks: boolean;
	dateFormat: string;
}

const DEFAULT_SETTINGS: TimelinePluginSettings = {
	orientation: 'vertical',
	showProjects: true,
	showTasks: true,
	dateFormat: 'YYYY-MM-DD'
}

interface TimelineItem {
	title: string;
	startDate: Date | null;
	endDate: Date | null;
	type: 'project' | 'task';
	file: string;
	content?: string;
}

export default class TimelinePlugin extends Plugin {
	settings: TimelinePluginSettings;

	async onload() {
		await this.loadSettings();

		// Register timeline view
		this.registerView(
			VIEW_TYPE_TIMELINE,
			(leaf) => new TimelineView(leaf, this)
		);

		// Add ribbon icon
		this.addRibbonIcon('calendar-range', 'Open Timeline', () => {
			this.activateView();
		});

		// Add command
		this.addCommand({
			id: 'open-timeline-view',
			name: 'Open Timeline View',
			callback: () => {
				this.activateView();
			}
		});

		// Add settings tab
		this.addSettingTab(new TimelineSettingTab(this.app, this));
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_TIMELINE);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: VIEW_TYPE_TIMELINE, active: true });
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async parseTimelineItems(): Promise<TimelineItem[]> {
		const items: TimelineItem[] = [];
		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			const cache = this.app.metadataCache.getFileCache(file);
			const content = await this.app.vault.read(file);

			// Parse projects from frontmatter
			if (this.settings.showProjects && cache?.frontmatter) {
				const fm = cache.frontmatter;
				if (fm.startDate || fm['start-date'] || fm.start) {
					const title = fm.title || file.basename;
					const startDate = this.parseDate(fm.startDate || fm['start-date'] || fm.start);
					const endDate = this.parseDate(fm.endDate || fm['end-date'] || fm.end);

					items.push({
						title,
						startDate,
						endDate,
						type: 'project',
						file: file.path
					});
				}
			}

			// Parse tasks with #task tag
			if (this.settings.showTasks && cache?.tags) {
				const taskTags = cache.tags.filter(tag => tag.tag === '#task');

				if (taskTags.length > 0) {
					const lines = content.split('\n');

					for (const line of lines) {
						if (line.includes('#task')) {
							// Try to extract dates from the line
							const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/g);
							const startDate = dateMatch && dateMatch[0] ? this.parseDate(dateMatch[0]) : null;
							const endDate = dateMatch && dateMatch[1] ? this.parseDate(dateMatch[1]) : null;

							// Extract task title (remove #task and dates)
							let taskTitle = line.replace(/#task/g, '').replace(/\d{4}-\d{2}-\d{2}/g, '').trim();
							taskTitle = taskTitle.replace(/^[-*]\s*\[.\]\s*/, '').trim(); // Remove checkbox if present

							if (taskTitle) {
								items.push({
									title: taskTitle,
									startDate: startDate,
									endDate: endDate || startDate,
									type: 'task',
									file: file.path,
									content: line.trim()
								});
							}
						}
					}
				}
			}
		}

		// Sort by start date
		return items.sort((a, b) => {
			if (!a.startDate && !b.startDate) return 0;
			if (!a.startDate) return 1;
			if (!b.startDate) return -1;
			return a.startDate.getTime() - b.startDate.getTime();
		});
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
}

const VIEW_TYPE_TIMELINE = 'timeline-view';

class TimelineView extends ItemView {
	plugin: TimelinePlugin;

	constructor(leaf: WorkspaceLeaf, plugin: TimelinePlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_TIMELINE;
	}

	getDisplayText(): string {
		return 'Timeline';
	}

	getIcon(): string {
		return 'calendar-range';
	}

	async onOpen() {
		await this.renderTimeline();

		// Re-render on file changes
		this.registerEvent(
			this.app.vault.on('modify', () => this.renderTimeline())
		);
		this.registerEvent(
			this.app.vault.on('create', () => this.renderTimeline())
		);
		this.registerEvent(
			this.app.vault.on('delete', () => this.renderTimeline())
		);
	}

	async renderTimeline() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass('timeline-view-container');

		const items = await this.plugin.parseTimelineItems();

		if (items.length === 0) {
			container.createEl('div', {
				text: 'Нет проектов или задач для отображения. Добавьте в frontmatter файлов startDate и endDate, или используйте #task в тексте.',
				cls: 'timeline-empty'
			});
			return;
		}

		const timelineContainer = container.createEl('div', {
			cls: `timeline-container timeline-${this.plugin.settings.orientation}`
		});

		// Add header with refresh button
		const header = timelineContainer.createEl('div', { cls: 'timeline-header' });
		header.createEl('h4', { text: 'Timeline' });
		const refreshBtn = header.createEl('button', { text: '🔄' });
		refreshBtn.addEventListener('click', () => this.renderTimeline());

		// Render timeline items
		for (const item of items) {
			const itemEl = timelineContainer.createEl('div', {
				cls: `timeline-item timeline-item-${item.type}`
			});

			const dotEl = itemEl.createEl('div', { cls: 'timeline-dot' });
			const contentEl = itemEl.createEl('div', { cls: 'timeline-content' });

			// Title
			const titleEl = contentEl.createEl('div', { cls: 'timeline-title' });
			const link = titleEl.createEl('a', {
				text: item.title,
				cls: 'internal-link'
			});
			link.addEventListener('click', async (e) => {
				e.preventDefault();
				const file = this.app.vault.getAbstractFileByPath(item.file);
				if (file instanceof TFile) {
					await this.app.workspace.getLeaf().openFile(file);
				}
			});

			// Type badge
			contentEl.createEl('span', {
				text: item.type === 'project' ? '📁 Проект' : '✓ Задача',
				cls: 'timeline-type-badge'
			});

			// Dates
			if (item.startDate || item.endDate) {
				const datesEl = contentEl.createEl('div', { cls: 'timeline-dates' });

				if (item.startDate) {
					datesEl.createEl('span', {
						text: `Начало: ${this.formatDate(item.startDate)}`,
						cls: 'timeline-date-start'
					});
				}

				if (item.endDate && item.endDate.getTime() !== item.startDate?.getTime()) {
					datesEl.createEl('span', {
						text: `Конец: ${this.formatDate(item.endDate)}`,
						cls: 'timeline-date-end'
					});
				}

				// Calculate and show duration
				if (item.startDate && item.endDate) {
					const days = Math.ceil((item.endDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24));
					if (days > 0) {
						datesEl.createEl('span', {
							text: `(${days} дн.)`,
							cls: 'timeline-duration'
						});
					}
				}
			}

			// File path
			contentEl.createEl('div', {
				text: item.file,
				cls: 'timeline-file-path'
			});
		}
	}

	formatDate(date: Date): string {
		return date.toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	async onClose() {
		// Cleanup if needed
	}
}

class TimelineSettingTab extends PluginSettingTab {
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
			.setName('Ориентация')
			.setDesc('Вертикальная или горизонтальная ориентация таймлайна')
			.addDropdown(dropdown => dropdown
				.addOption('vertical', 'Вертикальная')
				.addOption('horizontal', 'Горизонтальная')
				.setValue(this.plugin.settings.orientation)
				.onChange(async (value) => {
					this.plugin.settings.orientation = value as 'vertical' | 'horizontal';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Показывать проекты')
			.setDesc('Показывать проекты из frontmatter файлов')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showProjects)
				.onChange(async (value) => {
					this.plugin.settings.showProjects = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Показывать задачи')
			.setDesc('Показывать задачи с тегом #task')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showTasks)
				.onChange(async (value) => {
					this.plugin.settings.showTasks = value;
					await this.plugin.saveSettings();
				}));
	}
}
