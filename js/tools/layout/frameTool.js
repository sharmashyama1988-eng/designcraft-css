import BaseTool from '../baseTool.js';

export default class FrameTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'frameTool';
        this.name = 'Frame Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`FrameTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element frameTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
