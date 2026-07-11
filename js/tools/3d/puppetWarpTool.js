import BaseTool from '../baseTool.js';
export default class PuppetWarpTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_puppet_warp';
        this.name = 'Puppet Warp';
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.editor.selectedElement.style.transform = 'matrix(1, 0.2, -0.2, 1, 0, 0)';
    }
}