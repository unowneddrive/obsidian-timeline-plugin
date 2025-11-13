import { Plugin, WorkspaceLeaf } from 'obsidian';
import { PluginSettings, DEFAULT_SETTINGS } from '../core/domain/entities/PluginSettings';
import { TimelineView, VIEW_TYPE_TIMELINE } from '../features/timeline/presentation/view/TimelineView';
import { TimelineSettingTab } from './TimelineSettingTab';

export default class TimelinePlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();

		// Register timeline view
		this.registerView(
			VIEW_TYPE_TIMELINE,
			(leaf) => new TimelineView(leaf, this.settings)
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
}
