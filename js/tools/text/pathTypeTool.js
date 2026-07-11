import BaseTool from '../baseTool.js';

export default class PathTypeTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'pathTypeTool';
        this.name = 'PathType Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`PathTypeTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element pathTypeTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
