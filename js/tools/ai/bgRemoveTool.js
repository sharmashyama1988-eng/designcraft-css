import BaseTool from '../baseTool.js';
export default class BgRemoveTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_bg_remove';
        this.name = 'Background Remover';
        this.cursor = 'pointer';
    }
    onPointerDown(e) {
        alert('Processing background removal...');
    }
}