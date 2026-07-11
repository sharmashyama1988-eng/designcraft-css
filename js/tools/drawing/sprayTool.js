import BaseTool from '../baseTool.js';

export default class SprayTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'sprayTool';
        this.name = 'Spray Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`SprayTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element sprayTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
