import BaseTool from '../baseTool.js';

export default class EllipseTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'ellipseTool';
        this.name = 'Ellipse Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`EllipseTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element ellipseTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
