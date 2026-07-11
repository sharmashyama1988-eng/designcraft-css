import BaseTool from '../baseTool.js';

export default class LassoTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'lassoTool';
        this.name = 'Lasso Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`LassoTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element lassoTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
