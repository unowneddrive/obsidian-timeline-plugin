import { ItemView, WorkspaceLeaf, App } from 'obsidian';
import { GetTimelineItems } from '../../domain/usecases/GetTimelineItems';
import { CalculateTimelineBounds } from '../../domain/usecases/CalculateTimelineBounds';
import { ObsidianTimelineRepository } from '../../data/repositories/ObsidianTimelineRepository';
import { TimeScaleRenderer } from '../components/TimeScaleRenderer';
import { GridRenderer } from '../components/GridRenderer';
import { BarRenderer } from '../components/BarRenderer';
import { TimelineScrollController } from '../components/TimelineScrollController';
import { PluginSettings } from '../../../../core/domain/entities/PluginSettings';

export const VIEW_TYPE_TIMELINE = 'timeline-view';

export class TimelineView extends ItemView {
	private settings: PluginSettings;
	private getTimelineItems: GetTimelineItems;
	private calculateTimelineBounds: CalculateTimelineBounds;
	private timeScaleRenderer: TimeScaleRenderer;
	private gridRenderer: GridRenderer;
	private barRenderer: BarRenderer;
	private scrollController: TimelineScrollController;

	constructor(leaf: WorkspaceLeaf, settings: PluginSettings) {
		super(leaf);
		this.settings = settings;

		// Initialize repository and use cases
		const repository = new ObsidianTimelineRepository(this.app);
		this.getTimelineItems = new GetTimelineItems(repository);
		this.calculateTimelineBounds = new CalculateTimelineBounds();

		// Initialize renderers
		this.timeScaleRenderer = new TimeScaleRenderer();
		this.gridRenderer = new GridRenderer();
		this.barRenderer = new BarRenderer();
		this.scrollController = new TimelineScrollController();
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

		const items = await this.getTimelineItems.execute(
			this.settings.showProjects,
			this.settings.showTasks
		);

		if (items.length === 0) {
			container.createEl('div', {
				text: 'No projects or tasks to display. Add startDate and endDate to file frontmatter, or use #task in your notes.',
				cls: 'timeline-empty'
			});
			return;
		}

		// Calculate timeline bounds
		const bounds = this.calculateTimelineBounds.execute(items);
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
		todayBtn.addEventListener('click', () => this.scrollController.scrollToToday(timelineArea, bounds));

		// Render time scale
		this.timeScaleRenderer.render(timelineArea, bounds);

		// Render grid and items
		const gridContainer = timelineArea.createEl('div', { cls: 'gantt-grid-container' });

		for (const item of items) {
			// Timeline row
			const timelineRow = gridContainer.createEl('div', { cls: 'gantt-row' });

			// Render grid cells
			this.gridRenderer.renderCells(timelineRow, bounds);

			// Render bar if dates exist
			if (item.startDate && item.endDate) {
				const bar = this.barRenderer.createBar(item, bounds, (filePath) => this.openFile(filePath));
				timelineRow.appendChild(bar);
			}
		}
	}

	private async openFile(filePath: string) {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file) {
			await this.app.workspace.getLeaf(false).openFile(file as any);
		}
	}

	async onClose() {
		// Cleanup if needed
	}
}
