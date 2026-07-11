import BaseTool from '../baseTool.js';

export default class StarTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'starTool';
        this.name = 'Star Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`StarTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element starTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
