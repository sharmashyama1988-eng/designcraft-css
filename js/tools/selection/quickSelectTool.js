import BaseTool from '../baseTool.js';

export default class QuickSelectTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'quickSelectTool';
        this.name = 'QuickSelect Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`QuickSelectTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element quickSelectTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
