import BaseTool from '../baseTool.js';
export default class MaterialTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_3d_material';
        this.name = '3D Material Picker';
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        const el = this.editor.selectedElement;
        el.style.background = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
        el.style.boxShadow = 'inset 0 0 10px rgba(255,255,255,0.5), 0 5px 15px rgba(0,0,0,0.3)';
    }
}