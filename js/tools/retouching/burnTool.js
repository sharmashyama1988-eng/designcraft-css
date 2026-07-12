import BaseTool from '../baseTool.js';

export default class BurnTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'burnTool';
        this.name = 'Burn Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`BurnTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element burnTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
