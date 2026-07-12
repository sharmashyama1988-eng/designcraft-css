import BaseTool from '../baseTool.js';
export default class ZIndexTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_z_index';
        this.name = 'Z-Index Picker';
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
        const dy = Math.floor((this.startY - this.getPointerPos(e).y) / 10);
        this.editor.selectedElement.style.zIndex = `${dy}`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}