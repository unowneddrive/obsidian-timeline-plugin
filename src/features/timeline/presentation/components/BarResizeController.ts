import { TimelineItem } from '../../domain/entities/TimelineItem';
import { TimelineBounds } from '../../domain/entities/TimelineBounds';

export type ResizeCallback = (
	item: TimelineItem,
	newStartDate: Date,
	newEndDate: Date
) => Promise<void>;

interface DragState {
	isResizing: boolean;
	resizeType: 'start' | 'end' | null;
	item: TimelineItem;
	initialX: number;
	initialLeft: number;
	initialWidth: number;
	bounds: TimelineBounds;
}

export class BarResizeController {
	private dragState: DragState | null = null;
	private readonly dayWidthPx = 40; // Must match grid cell width
	private onResize?: ResizeCallback;

	constructor(onResize?: ResizeCallback) {
		this.onResize = onResize;
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleMouseUp = this.handleMouseUp.bind(this);
		this.handleTouchMove = this.handleTouchMove.bind(this);
		this.handleTouchEnd = this.handleTouchEnd.bind(this);
	}

	attachResizeHandles(
		wrapper: HTMLElement,
		item: TimelineItem,
		bounds: TimelineBounds
	): void {
		// Create left handle
		const leftHandle = document.createElement('div');
		leftHandle.className = 'gantt-bar-resize-handle gantt-bar-resize-left';
		leftHandle.setAttribute('data-resize-type', 'start');

		// Create right handle
		const rightHandle = document.createElement('div');
		rightHandle.className = 'gantt-bar-resize-handle gantt-bar-resize-right';
		rightHandle.setAttribute('data-resize-type', 'end');

		// Mouse events
		leftHandle.addEventListener('mousedown', (e) => this.handleMouseDown(e, item, bounds, 'start'));
		rightHandle.addEventListener('mousedown', (e) => this.handleMouseDown(e, item, bounds, 'end'));

		// Touch events
		leftHandle.addEventListener('touchstart', (e) => this.handleTouchStart(e, item, bounds, 'start'));
		rightHandle.addEventListener('touchstart', (e) => this.handleTouchStart(e, item, bounds, 'end'));

		// Add handles to wrapper
		wrapper.appendChild(leftHandle);
		wrapper.appendChild(rightHandle);

		// Prevent click event from bubbling when clicking on handles
		leftHandle.addEventListener('click', (e) => e.stopPropagation());
		rightHandle.addEventListener('click', (e) => e.stopPropagation());
	}

	private handleMouseDown(
		e: MouseEvent,
		item: TimelineItem,
		bounds: TimelineBounds,
		resizeType: 'start' | 'end'
	): void {
		e.preventDefault();
		e.stopPropagation();

		const wrapper = (e.target as HTMLElement).parentElement;
		if (!wrapper) return;

		this.startResize(e.clientX, wrapper, item, bounds, resizeType);
	}

	private handleTouchStart(
		e: TouchEvent,
		item: TimelineItem,
		bounds: TimelineBounds,
		resizeType: 'start' | 'end'
	): void {
		e.preventDefault();
		e.stopPropagation();

		const wrapper = (e.target as HTMLElement).parentElement;
		if (!wrapper || e.touches.length === 0) return;

		this.startResize(e.touches[0].clientX, wrapper, item, bounds, resizeType);
	}

	private startResize(
		clientX: number,
		wrapper: HTMLElement,
		item: TimelineItem,
		bounds: TimelineBounds,
		resizeType: 'start' | 'end'
	): void {
		const initialLeft = parseFloat(wrapper.style.left) || 0;
		const initialWidth = parseFloat(wrapper.style.width) || 0;

		this.dragState = {
			isResizing: true,
			resizeType,
			item,
			initialX: clientX,
			initialLeft,
			initialWidth,
			bounds
		};

		// Add visual feedback
		wrapper.classList.add('gantt-bar-resizing');

		// Add global listeners
		document.addEventListener('mousemove', this.handleMouseMove);
		document.addEventListener('mouseup', this.handleMouseUp);
		document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
		document.addEventListener('touchend', this.handleTouchEnd);

		// Prevent text selection during drag
		document.body.style.userSelect = 'none';
	}

	private handleMouseMove(e: MouseEvent): void {
		if (!this.dragState || !this.dragState.isResizing) return;
		e.preventDefault();
		this.updateResize(e.clientX);
	}

	private handleTouchMove(e: TouchEvent): void {
		if (!this.dragState || !this.dragState.isResizing || e.touches.length === 0) return;
		e.preventDefault();
		this.updateResize(e.touches[0].clientX);
	}

	private updateResize(clientX: number): void {
		if (!this.dragState) return;

		const deltaX = clientX - this.dragState.initialX;
		const deltaDays = Math.round(deltaX / this.dayWidthPx);

		if (deltaDays === 0) return; // No significant change

		const { item, resizeType, initialLeft, initialWidth } = this.dragState;

		// Find the wrapper element to update
		const wrappers = Array.from(document.querySelectorAll('.gantt-bar-wrapper'));
		let targetWrapper: HTMLElement | null = null;

		for (const wrapper of wrappers) {
			const content = wrapper.querySelector('.gantt-bar-content');
			if (content) {
				const file = content.getAttribute('data-task-file') || content.getAttribute('data-file');
				const title = wrapper.querySelector('.gantt-bar-title')?.textContent;
				if (file === item.file || title === item.title) {
					targetWrapper = wrapper as HTMLElement;
					break;
				}
			}
		}

		if (!targetWrapper) return;

		if (resizeType === 'start') {
			// Resize from left
			const newLeft = initialLeft + deltaX;
			const newWidth = initialWidth - deltaX;

			// Prevent negative width (minimum 1 day)
			if (newWidth < this.dayWidthPx) return;

			targetWrapper.style.left = `${newLeft}px`;
			targetWrapper.style.width = `${newWidth}px`;
		} else {
			// Resize from right
			const newWidth = initialWidth + deltaX;

			// Prevent negative width (minimum 1 day)
			if (newWidth < this.dayWidthPx) return;

			targetWrapper.style.width = `${newWidth}px`;
		}
	}

	private handleMouseUp(e: MouseEvent): void {
		this.finishResize(e.clientX);
	}

	private handleTouchEnd(e: TouchEvent): void {
		if (e.changedTouches.length > 0) {
			this.finishResize(e.changedTouches[0].clientX);
		}
	}

	private async finishResize(clientX: number): Promise<void> {
		if (!this.dragState || !this.dragState.isResizing) return;

		const deltaX = clientX - this.dragState.initialX;
		const deltaDays = Math.round(deltaX / this.dayWidthPx);

		// Clean up
		document.removeEventListener('mousemove', this.handleMouseMove);
		document.removeEventListener('mouseup', this.handleMouseUp);
		document.removeEventListener('touchmove', this.handleTouchMove);
		document.removeEventListener('touchend', this.handleTouchEnd);
		document.body.style.userSelect = '';

		// Remove visual feedback
		const wrappers = document.querySelectorAll('.gantt-bar-resizing');
		wrappers.forEach(w => w.classList.remove('gantt-bar-resizing'));

		// Calculate new dates
		const { item, resizeType } = this.dragState;

		if (deltaDays !== 0 && item.startDate && item.endDate) {
			let newStartDate = new Date(item.startDate);
			let newEndDate = new Date(item.endDate);

			if (resizeType === 'start') {
				newStartDate.setDate(newStartDate.getDate() + deltaDays);
				// Ensure start is not after end
				if (newStartDate >= newEndDate) {
					newStartDate = new Date(newEndDate);
					newStartDate.setDate(newStartDate.getDate() - 1);
				}
			} else {
				newEndDate.setDate(newEndDate.getDate() + deltaDays);
				// Ensure end is not before start
				if (newEndDate <= newStartDate) {
					newEndDate = new Date(newStartDate);
					newEndDate.setDate(newEndDate.getDate() + 1);
				}
			}

			// Call the resize callback
			if (this.onResize) {
				try {
					await this.onResize(item, newStartDate, newEndDate);
				} catch (error) {
					console.error('Failed to update dates:', error);
				}
			}
		}

		this.dragState = null;
	}

	cleanup(): void {
		// Remove any lingering event listeners
		document.removeEventListener('mousemove', this.handleMouseMove);
		document.removeEventListener('mouseup', this.handleMouseUp);
		document.removeEventListener('touchmove', this.handleTouchMove);
		document.removeEventListener('touchend', this.handleTouchEnd);
		document.body.style.userSelect = '';
		this.dragState = null;
	}
}
