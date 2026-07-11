import BaseTool from '../baseTool.js';

export default class LassoPolyTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'lassoPolyTool';
        this.name = 'LassoPoly Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`LassoPolyTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element lassoPolyTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
