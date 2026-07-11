import BaseTool from '../baseTool.js';
export default class ExtrudeTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_3d_extrude';
        this.name = '3D Extrude (CSS)';
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
        
        let shadow = '';
        for (let i = 1; i <= Math.abs(dx)/2; i++) {
            shadow += `${i * Math.sign(dx)}px ${i * Math.sign(dy)}px 0 #555, `;
        }
        shadow = shadow.slice(0, -2);
        if (shadow) this.editor.selectedElement.style.boxShadow = shadow;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}