import BaseTool from '../baseTool.js';

export default class SliceSelectTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'sliceSelectTool';
        this.name = 'SliceSelect Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`SliceSelectTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element sliceSelectTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
