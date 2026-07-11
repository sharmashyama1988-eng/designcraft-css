import BaseTool from '../baseTool.js';

export default class ScissorsTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'scissorsTool';
        this.name = 'Scissors Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`ScissorsTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element scissorsTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
