import BaseTool from '../baseTool.js';

export default class PathSelectTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'pathSelectTool';
        this.name = 'PathSelect Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`PathSelectTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element pathSelectTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
