import { TimelineBounds } from '../../domain/entities/TimelineBounds';

export class GridRenderer {
	renderCells(row: HTMLElement, bounds: TimelineBounds): void {
		const cellCount = Math.ceil(bounds.totalDays);

		for (let i = 0; i < cellCount; i++) {
			row.createEl('div', { cls: 'gantt-grid-cell' });
		}
	}
}
