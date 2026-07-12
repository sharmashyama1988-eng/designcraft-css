import BaseTool from '../baseTool.js';

export default class RectangleTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'rectangleTool';
        this.name = 'Rectangle Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`RectangleTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element rectangleTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
