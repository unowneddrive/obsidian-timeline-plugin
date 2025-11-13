export interface PluginSettings {
	showProjects: boolean;
	showTasks: boolean;
	dateFormat: string;
	projectColor: string;
	taskColor: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	showProjects: true,
	showTasks: true,
	dateFormat: 'YYYY-MM-DD',
	projectColor: '#10b981', // Green
	taskColor: '#3b82f6'     // Blue
};
