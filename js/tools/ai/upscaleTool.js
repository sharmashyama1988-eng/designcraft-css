import BaseTool from '../baseTool.js';
export default class UpscaleTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_upscale';
        this.name = 'AI Upscaler';
        this.cursor = 'zoom-in';
    }
    onPointerDown(e) {
        alert('Running AI Upscale model (this may take a moment)...');
    }
}