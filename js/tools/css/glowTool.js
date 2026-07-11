import BaseTool from '../baseTool.js';
export default class GlowTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_glow';
        this.name = 'Inner/Outer Glow';
        this.cursor = 'crosshair';
        this.isDragging = false;
        this.startX = 0;
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.isDragging = true;
        const pos = this.getPointerPos(e);
        this.startX = pos.x;
    }
    onPointerMove(e) {
        if (!this.isDragging || !this.editor.selectedElement) return;
        const pos = this.getPointerPos(e);
        const blur = Math.max(0, pos.x - this.startX);
        this.editor.selectedElement.style.boxShadow = `0 0 ${blur}px rgba(255, 255, 100, 0.8)`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}