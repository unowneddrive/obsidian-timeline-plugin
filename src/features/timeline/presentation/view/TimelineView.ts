import { ItemView, WorkspaceLeaf, App } from 'obsidian';
import { GetTimelineItems } from '../../domain/usecases/GetTimelineItems';
import { CalculateTimelineBounds } from '../../domain/usecases/CalculateTimelineBounds';
import { ObsidianTimelineRepository } from '../../data/repositories/ObsidianTimelineRepository';
import { TimeScaleRenderer } from '../components/TimeScaleRenderer';
import { GridRenderer } from '../components/GridRenderer';
import { BarRenderer, BarColors } from '../components/BarRenderer';
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
		const repository = new ObsidianTimelineRepository(this.app, settings);
		this.getTimelineItems = new GetTimelineItems(repository);
		this.calculateTimelineBounds = new CalculateTimelineBounds();

		// Initialize renderers
		this.timeScaleRenderer = new TimeScaleRenderer();
		this.gridRenderer = new GridRenderer();
		this.barRenderer = new BarRenderer((filePath, content, completed) => this.toggleTask(filePath, content, completed));
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

		// Prepare colors from settings
		const colors: BarColors = {
			projectColor: this.settings.projectColor,
			taskColor: this.settings.taskColor
		};

		for (const item of items) {
			// Timeline row
			const timelineRow = gridContainer.createEl('div', { cls: 'gantt-row' });

			// Render grid cells
			this.gridRenderer.renderCells(timelineRow, bounds);

			// Render bar if dates exist
			if (item.startDate && item.endDate) {
				const bar = this.barRenderer.createBar(item, bounds, colors, (filePath) => this.openFile(filePath));
				timelineRow.appendChild(bar);
			}
		}

		// Auto-scroll to today immediately without animation
		setTimeout(() => {
			this.scrollController.scrollToToday(timelineArea, bounds, false);
		}, 100);

		// Add scroll handler to make bar labels sticky
		this.setupStickyBarLabels(timelineArea);
	}

	private setupStickyBarLabels(timelineArea: HTMLElement): void {
		let rafId: number | null = null;

		const updateLabels = () => {
			const scrollLeft = timelineArea.scrollLeft;
			const viewportWidth = timelineArea.clientWidth;

			const labels = timelineArea.querySelectorAll('.gantt-bar-content');
			labels.forEach((label: HTMLElement) => {
				const barLeft = parseFloat(label.getAttribute('data-bar-left') || '0');
				const barWidth = parseFloat(label.getAttribute('data-bar-width') || '0');

				// Calculate how far the bar extends past the left edge of viewport
				const barStartInViewport = barLeft - scrollLeft;
				const barEndInViewport = barStartInViewport + barWidth;

				// Only make sticky if bar extends past left edge
				if (barStartInViewport < 0 && barEndInViewport > 0) {
					// Label should stick at the left edge of viewport
					const offset = Math.min(-barStartInViewport, barWidth - 400); // max 400px offset
					label.style.transform = `translateX(${Math.max(0, offset)}px)`;
				} else {
					label.style.transform = 'translateX(0)';
				}
			});

			rafId = null;
		};

		timelineArea.addEventListener('scroll', () => {
			if (rafId === null) {
				rafId = requestAnimationFrame(updateLabels);
			}
		});

		// Initial update
		updateLabels();
	}

	private async toggleTask(filePath: string, content: string, completed: boolean) {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!file || file.constructor.name !== 'TFile') return;

		try {
			const fileContent = await this.app.vault.read(file as any);
			const lines = fileContent.split('\n');

			// Find the line with the task
			const lineIndex = lines.findIndex(line => line.trim() === content);
			if (lineIndex === -1) return;

			// Toggle checkbox in the line
			const line = lines[lineIndex];
			let newLine: string;

			if (completed) {
				// Mark as completed
				newLine = line.replace(/^([-*]\s*)\[.\]/, '$1[x]');
			} else {
				// Mark as incomplete
				newLine = line.replace(/^([-*]\s*)\[.\]/, '$1[ ]');
			}

			lines[lineIndex] = newLine;
			await this.app.vault.modify(file as any, lines.join('\n'));

			// Update UI directly without full reload
			// Find the task element by iterating instead of using complex selector
			// (to avoid issues with special characters in content)
			const taskContents = Array.from(this.containerEl.querySelectorAll<Element>('.gantt-bar-content'));
			let taskContent: Element | null = null;

			for (const el of taskContents) {
				if (el.getAttribute('data-task-file') === filePath &&
					el.getAttribute('data-task-content') === content) {
					taskContent = el;
					break;
				}
			}

			if (taskContent) {
				const titleSpan = taskContent.querySelector('.gantt-bar-title') as HTMLElement;
				if (titleSpan) {
					if (completed) {
						titleSpan.style.textDecoration = 'line-through';
						titleSpan.style.opacity = '0.6';
					} else {
						titleSpan.style.textDecoration = 'none';
						titleSpan.style.opacity = '1';
					}
				}
			}
		} catch (error) {
			console.error('Failed to toggle task:', error);
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
