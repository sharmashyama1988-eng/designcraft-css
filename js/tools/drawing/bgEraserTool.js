import BaseTool from '../baseTool.js';

export default class BgEraserTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'bgEraserTool';
        this.name = 'BgEraser Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`BgEraserTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element bgEraserTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
