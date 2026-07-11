import BaseTool from '../baseTool.js';

export default class ZoomTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'zoomTool';
        this.name = 'Zoom Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`ZoomTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element zoomTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
