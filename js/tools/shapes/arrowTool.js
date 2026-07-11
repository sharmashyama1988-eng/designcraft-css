import BaseTool from '../baseTool.js';

export default class ArrowTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'arrowTool';
        this.name = 'Arrow Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`ArrowTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element arrowTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
