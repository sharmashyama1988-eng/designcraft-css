import BaseTool from '../baseTool.js';
export default class DistortTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_distort';
        this.name = 'Distort Tool';
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
        const dx = (this.getPointerPos(e).x - this.startX) / 100;
        this.editor.selectedElement.style.transform = `matrix(1, ${dx}, ${-dx}, 1, 0, 0)`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}