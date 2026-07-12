import BaseTool from '../baseTool.js';
export default class GradMeshTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_grad_mesh';
        this.name = 'Gradient Mesh';
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.editor.selectedElement.style.background = 'radial-gradient(circle at 50% 50%, #ff7e5f, #feb47b)';
    }
}