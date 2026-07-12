import BaseTool from '../baseTool.js';

export default class DropCapTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'dropCapTool';
        this.name = 'DropCap Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`DropCapTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element dropCapTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
