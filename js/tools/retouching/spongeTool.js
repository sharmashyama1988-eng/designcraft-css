import BaseTool from '../baseTool.js';

export default class SpongeTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'spongeTool';
        this.name = 'Sponge Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`SpongeTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element spongeTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
