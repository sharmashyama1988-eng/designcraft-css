import BaseTool from '../baseTool.js';

export default class BlobTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'blobTool';
        this.name = 'Blob Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`BlobTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element blobTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
