export interface PluginSettings {
	showProjects: boolean;
	showTasks: boolean;
	dateFormat: string;
	projectColor: string;
	taskColor: string;
	projectTitleField: string;
	projectStartDateField: string;
	projectEndDateField: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	showProjects: true,
	showTasks: true,
	dateFormat: 'YYYY-MM-DD',
	projectColor: '#10b981', // Green
	taskColor: '#3b82f6',     // Blue
	projectTitleField: 'title',
	projectStartDateField: 'start_date',
	projectEndDateField: 'finish_date'
};
