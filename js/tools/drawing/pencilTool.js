import BaseTool from '../baseTool.js';

export default class PencilTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'pencilTool';
        this.name = 'Pencil Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`PencilTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element pencilTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
