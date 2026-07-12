import BaseTool from '../baseTool.js';

export default class RotateViewTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'rotateViewTool';
        this.name = 'RotateView Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`RotateViewTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element rotateViewTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
