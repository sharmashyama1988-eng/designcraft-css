import BaseTool from '../baseTool.js';

export default class PaintBucketTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'paintBucketTool';
        this.name = 'PaintBucket Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`PaintBucketTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element paintBucketTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
