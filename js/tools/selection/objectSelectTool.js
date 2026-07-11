import BaseTool from '../baseTool.js';

export default class ObjectSelectTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'objectSelectTool';
        this.name = 'ObjectSelect Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`ObjectSelectTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element objectSelectTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
