import BaseTool from '../baseTool.js';
export default class BoxModelTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_box_model';
        this.name = 'Box Model Inspector';
        this.isDragging = false;
        this.startY = 0;
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.isDragging = true;
        this.startY = this.getPointerPos(e).y;
    }
    onPointerMove(e) {
        if (!this.isDragging || !this.editor.selectedElement) return;
        const dy = Math.max(0, this.getPointerPos(e).y - this.startY);
        this.editor.selectedElement.style.padding = `${dy}px`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}