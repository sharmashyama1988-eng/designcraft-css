import BaseTool from '../baseTool.js';

export default class WaveTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'waveTool';
        this.name = 'Wave Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`WaveTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element waveTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
