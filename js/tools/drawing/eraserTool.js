import BaseTool from '../baseTool.js';

export default class EraserTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'eraserTool';
        this.name = 'Eraser Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`EraserTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element eraserTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
