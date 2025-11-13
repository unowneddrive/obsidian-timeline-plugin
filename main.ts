import { App, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, TFile, CachedMetadata } from 'obsidian';

interface TimelinePluginSettings {
	showProjects: boolean;
	showTasks: boolean;
	dateFormat: string;
}

const DEFAULT_SETTINGS: TimelinePluginSettings = {
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
				text: 'No projects or tasks to display. Add startDate and endDate to file frontmatter, or use #task in your notes.',
				cls: 'timeline-empty'
			});
			return;
		}

		// Calculate timeline bounds
		const bounds = this.calculateTimelineBounds(items);
		if (!bounds) return;

		// Create main timeline container
		const timelineContainer = container.createEl('div', { cls: 'gantt-container' });

		// Header with controls
		const header = timelineContainer.createEl('div', { cls: 'gantt-header' });
		header.createEl('h4', { text: 'Timeline' });

		const controls = header.createEl('div', { cls: 'gantt-controls' });

		const todayBtn = controls.createEl('button', { text: '📅 Today', cls: 'gantt-today-btn' });
		const refreshBtn = controls.createEl('button', { text: '🔄', cls: 'gantt-refresh-btn' });

		// Create gantt chart
		const ganttChart = timelineContainer.createEl('div', { cls: 'gantt-chart' });

		// Timeline area with grid
		const timelineArea = ganttChart.createEl('div', { cls: 'gantt-timeline' });

		// Setup button handlers
		refreshBtn.addEventListener('click', () => this.renderTimeline());
		todayBtn.addEventListener('click', () => this.scrollToToday(timelineArea, bounds));

		// Render time scale
		this.renderTimeScale(timelineArea, bounds);

		// Render grid and items
		const gridContainer = timelineArea.createEl('div', { cls: 'gantt-grid-container' });

		for (const item of items) {
			// Timeline row
			const timelineRow = gridContainer.createEl('div', { cls: 'gantt-row' });

			// Render grid cells
			this.renderGridCells(timelineRow, bounds);

			// Render bar if dates exist
			if (item.startDate && item.endDate) {
				const bar = this.createBar(item, bounds);
				timelineRow.appendChild(bar);
			}
		}
	}

	calculateTimelineBounds(items: TimelineItem[]): { start: Date; end: Date; totalDays: number } | null {
		let minDate: Date | null = null;
		let maxDate: Date | null = null;
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (const item of items) {
			if (item.startDate) {
				if (!minDate || item.startDate < minDate) minDate = item.startDate;
			}
			if (item.endDate) {
				if (!maxDate || item.endDate > maxDate) maxDate = item.endDate;
			}
		}

		// If no items, show timeline around today
		if (!minDate || !maxDate) {
			minDate = new Date(today);
			maxDate = new Date(today);
		}

		// Extend to show 6 months before earliest date and 6 months after latest date
		const sixMonthsMs = 180 * 24 * 60 * 60 * 1000;
		const startDate = new Date(Math.min(minDate.getTime() - sixMonthsMs, today.getTime() - sixMonthsMs));
		const endDate = new Date(Math.max(maxDate.getTime() + sixMonthsMs, today.getTime() + sixMonthsMs));

		const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

		return { start: startDate, end: endDate, totalDays };
	}

	renderTimeScale(container: HTMLElement, bounds: { start: Date; end: Date; totalDays: number }) {
		const scaleContainer = container.createEl('div', { cls: 'gantt-time-scale' });

		const currentDate = new Date(bounds.start);

		while (currentDate <= bounds.end) {
			const dayLabel = scaleContainer.createEl('div', { cls: 'gantt-day-label' });

			const isFirstOfMonth = currentDate.getDate() === 1;
			if (isFirstOfMonth) {
				dayLabel.addClass('gantt-day-first-of-month');
			}

			// Show day number
			const day = currentDate.getDate();
			const month = currentDate.toLocaleDateString('en-US', { month: 'short' });

			// Show month for first day of month, otherwise just day
			dayLabel.textContent = isFirstOfMonth ? `${month} ${day}` : `${day}`;

			currentDate.setDate(currentDate.getDate() + 1);
		}
	}

	renderGridCells(row: HTMLElement, bounds: { start: Date; end: Date; totalDays: number }) {
		const cellCount = Math.ceil(bounds.totalDays); // Daily cells

		for (let i = 0; i < cellCount; i++) {
			row.createEl('div', { cls: 'gantt-grid-cell' });
		}
	}

	createBar(item: TimelineItem, bounds: { start: Date; end: Date; totalDays: number }): HTMLElement {
		const bar = document.createElement('div');
		bar.className = `gantt-bar gantt-bar-${item.type}`;

		if (!item.startDate || !item.endDate) return bar;

		// Calculate position and width
		const startOffset = (item.startDate.getTime() - bounds.start.getTime()) / (1000 * 60 * 60 * 24);
		const duration = (item.endDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24);

		const leftPercent = (startOffset / bounds.totalDays) * 100;
		const widthPercent = (duration / bounds.totalDays) * 100;

		bar.style.left = `${leftPercent}%`;
		bar.style.width = `${Math.max(widthPercent, 1)}%`;

		// Bar content
		const barContent = bar.createEl('div', { cls: 'gantt-bar-content' });

		// Type icon
		const typeIcon = barContent.createEl('span', { cls: 'gantt-bar-type-icon' });
		typeIcon.textContent = item.type === 'project' ? '📁' : '✓';

		// Title
		const titleSpan = barContent.createEl('span', { cls: 'gantt-bar-title' });
		titleSpan.textContent = item.title;

		// Tooltip
		const tooltip = bar.createEl('div', { cls: 'gantt-bar-tooltip' });
		tooltip.innerHTML = `
			<strong>${item.title}</strong><br>
			${this.formatDate(item.startDate)} - ${this.formatDate(item.endDate)}<br>
			<span class="tooltip-duration">${Math.ceil(duration)} day${duration > 1 ? 's' : ''}</span>
		`;

		return bar;
	}

	scrollToToday(timelineArea: HTMLElement, bounds: { start: Date; end: Date; totalDays: number }) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Calculate days from start to today
		const daysFromStart = Math.floor((today.getTime() - bounds.start.getTime()) / (1000 * 60 * 60 * 24));

		// Each day is 40px wide
		const scrollPosition = daysFromStart * 40;

		// Scroll to position with smooth animation
		timelineArea.scrollTo({
			left: scrollPosition - (timelineArea.clientWidth / 2) + 20, // Center today
			behavior: 'smooth'
		});
	}

	formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
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
