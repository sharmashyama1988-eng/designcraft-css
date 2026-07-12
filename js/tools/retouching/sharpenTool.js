import BaseTool from '../baseTool.js';

export default class SharpenTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'sharpenTool';
        this.name = 'Sharpen Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`SharpenTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element sharpenTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
