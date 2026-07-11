import BaseTool from '../baseTool.js';
export default class PerspWarpTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_persp_warp';
        this.name = 'Perspective Warp';
        this.isDragging = false;
        this.startX = 0;
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.isDragging = true;
        this.startX = this.getPointerPos(e).x;
        if (this.editor.selectedElement.parentElement) {
            this.editor.selectedElement.parentElement.style.perspective = '1000px';
        }
    }
    onPointerMove(e) {
        if (!this.isDragging || !this.editor.selectedElement) return;
        const dx = this.getPointerPos(e).x - this.startX;
        this.editor.selectedElement.style.transform = `rotateY(${dx}deg)`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}