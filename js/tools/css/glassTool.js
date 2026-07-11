import BaseTool from '../baseTool.js';
export default class GlassTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_glass';
        this.name = 'Glassmorphism';
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        const el = this.editor.selectedElement;
        el.style.background = 'rgba(255, 255, 255, 0.2)';
        el.style.backdropFilter = 'blur(10px)';
        el.style.webkitBackdropFilter = 'blur(10px)';
        el.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        el.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
        el.style.borderRadius = '16px';
    }
}