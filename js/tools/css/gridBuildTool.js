import BaseTool from '../baseTool.js';
export default class GridBuildTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_grid_build';
        this.name = 'CSS Grid Builder';
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        const el = this.editor.selectedElement;
        el.style.display = 'grid';
        el.style.gridTemplateColumns = 'repeat(3, 1fr)';
        el.style.gap = '10px';
    }
}