import BaseTool from '../baseTool.js';

export default class SliceTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'sliceTool';
        this.name = 'Slice Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`SliceTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element sliceTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
