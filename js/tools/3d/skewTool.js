import BaseTool from '../baseTool.js';
export default class SkewTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_skew';
        this.name = 'Skew Tool';
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
        this.editor.selectedElement.style.transform = `skew(${dx}deg, ${dy}deg)`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}