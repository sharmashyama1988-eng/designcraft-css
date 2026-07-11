import BaseTool from '../baseTool.js';
export default class RadiusDragTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_radius_drag';
        this.name = 'Border Radius Dragger';
        this.cursor = 'nwse-resize';
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
        this.editor.selectedElement.style.borderRadius = `${dx}px`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}