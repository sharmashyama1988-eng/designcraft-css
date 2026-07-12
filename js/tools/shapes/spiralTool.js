import BaseTool from '../baseTool.js';

export default class SpiralTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'spiralTool';
        this.name = 'Spiral Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`SpiralTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element spiralTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
