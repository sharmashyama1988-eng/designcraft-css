import BaseTool from '../baseTool.js';

export default class BrushTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'brushTool';
        this.name = 'Brush Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`BrushTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element brushTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
