import BaseTool from '../baseTool.js';
export default class FilterBrushTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_filter_brush';
        this.name = 'CSS Filter Brush';
        this.cursor = 'pointer';
        this.isDragging = false;
        this.startX = 0;
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.isDragging = true;
        this.startX = this.getPointerPos(e).x;
    }
    onPointerMove(e) {
        if (!this.isDragging || !this.editor.selectedElement) return;
        const dx = Math.max(0, this.getPointerPos(e).x - this.startX);
        this.editor.selectedElement.style.filter = `blur(${dx / 10}px)`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}