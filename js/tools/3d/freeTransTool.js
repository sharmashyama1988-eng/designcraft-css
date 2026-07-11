import BaseTool from '../baseTool.js';
export default class FreeTransTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_free_trans';
        this.name = 'Free Transform';
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
        const dx = this.getPointerPos(e).x - this.startX;
        const scale = 1 + (dx / 100);
        this.editor.selectedElement.style.transform = `scale(${scale})`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}