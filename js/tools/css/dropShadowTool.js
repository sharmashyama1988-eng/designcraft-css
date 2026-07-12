import BaseTool from '../baseTool.js';
export default class DropShadowTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_drop_shadow';
        this.name = 'Drop Shadow Gizmo';
        this.cursor = 'crosshair';
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.isDragging = true;
        const pos = this.getPointerPos(e);
        this.startX = pos.x;
        this.startY = pos.y;
    }
    onPointerMove(e) {
        if (!this.isDragging || !this.editor.selectedElement) return;
        const pos = this.getPointerPos(e);
        const dx = pos.x - this.startX;
        const dy = pos.y - this.startY;
        this.editor.selectedElement.style.boxShadow = `${dx}px ${dy}px 10px rgba(0,0,0,0.5)`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}