import BaseTool from '../baseTool.js';

export default class MoveTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_move';
        this.name = 'Move Tool';
        this.cursor = 'default';
        this.isDragging = false;
        this.isResizing = false;
        this.activeHandle = null;
        this.startPos = { x: 0, y: 0 };
        this.startState = {};
    }

    onActivate() {
        super.onActivate();
        // ensure selection box handles are visible/active
        if (this.editor.selectionBox) {
            this.editor.selectionBox.style.pointerEvents = 'auto';
        }
    }

    onPointerDown(e) {
        if (!this.editor) return;

        // Check for resize handle click
        if (e.target.classList.contains('resize-handle')) {
            e.stopPropagation();
            this.isResizing = true;
            this.activeHandle = e.target.dataset.handle;
            
            this.startPos = { x: e.clientX, y: e.clientY };
            this.startState = {
                width: parseInt(this.editor.selectedElement.style.width) || 0,
                height: parseInt(this.editor.selectedElement.style.height) || 0,
                left: parseInt(this.editor.selectedElement.style.left) || 0,
                top: parseInt(this.editor.selectedElement.style.top) || 0
            };
            return;
        }

        const clickedEl = e.target.closest('.canvas-element');
        if (clickedEl) {
            e.stopPropagation();
            if (clickedEl.querySelector('.editing-input-active')) return;

            this.editor.selectElement(clickedEl);
            
            this.isDragging = true;
            this.startPos = { x: e.clientX, y: e.clientY };
            this.startState = {
                left: parseInt(clickedEl.style.left) || 0,
                top: parseInt(clickedEl.style.top) || 0
            };
        } else {
            // Clicked artboard empty space
            if (e.target === this.editor.artboard || e.target.id === 'artboard-wrapper') {
                this.editor.deselectAll();
            }
        }
    }

    onPointerMove(e) {
        if (!this.editor) return;

        if (this.isDragging && this.editor.selectedElement) {
            const dx = e.clientX - this.startPos.x;
            const dy = e.clientY - this.startPos.y;
            
            let newX = this.startState.left + (dx / this.editor.zoomLevel);
            let newY = this.startState.top + (dy / this.editor.zoomLevel);
            
            // Snapping logic could go here
            // this.editor.checkSnapping(newX, newY, ...);
            
            this.editor.selectedElement.style.left = `${newX}px`;
            this.editor.selectedElement.style.top = `${newY}px`;
            
            this.editor.updateSelectionBox();
        } else if (this.isResizing && this.editor.selectedElement) {
            const dx = (e.clientX - this.startPos.x) / this.editor.zoomLevel;
            const dy = (e.clientY - this.startPos.y) / this.editor.zoomLevel;
            
            let newWidth = this.startState.width;
            let newHeight = this.startState.height;
            let newLeft = this.startState.left;
            let newTop = this.startState.top;

            if (this.activeHandle.includes('r')) newWidth += dx;
            if (this.activeHandle.includes('l')) { newWidth -= dx; newLeft += dx; }
            if (this.activeHandle.includes('b')) newHeight += dy;
            if (this.activeHandle.includes('t')) { newHeight -= dy; newTop += dy; }
            
            // Text elements have dynamic height, so skip height resize unless strictly needed
            if (this.editor.selectedElement.classList.contains('text-element') && (this.activeHandle === 'mr' || this.activeHandle === 'ml')) {
                // only width
            } else {
                this.editor.selectedElement.style.height = `${Math.max(10, newHeight)}px`;
            }
            
            this.editor.selectedElement.style.width = `${Math.max(10, newWidth)}px`;
            this.editor.selectedElement.style.left = `${newLeft}px`;
            this.editor.selectedElement.style.top = `${newTop}px`;
            
            this.editor.updateSelectionBox();
            
            if (window.controlsManager) {
                window.controlsManager.syncInspector(this.editor.selectedElement);
            }
        }
    }

    onPointerUp(e) {
        if (this.isDragging || this.isResizing) {
            this.isDragging = false;
            this.isResizing = false;
            this.activeHandle = null;
            if (this.editor) this.editor.triggerHistorySave();
        }
    }
}
