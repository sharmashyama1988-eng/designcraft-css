import BaseTool from '../baseTool.js';
export default class ColorizeTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_colorize';
        this.name = 'Auto-Colorize';
        this.cursor = 'crosshair';
    }
    onPointerDown(e) {
        alert('Applying AI Colorization...');
    }
}