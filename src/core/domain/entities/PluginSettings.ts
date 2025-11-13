export interface PluginSettings {
	showProjects: boolean;
	showTasks: boolean;
	dateFormat: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	showProjects: true,
	showTasks: true,
	dateFormat: 'YYYY-MM-DD'
};
