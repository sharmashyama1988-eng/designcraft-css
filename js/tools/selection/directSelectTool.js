import BaseTool from '../baseTool.js';

export default class DirectSelectTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'directSelectTool';
        this.name = 'DirectSelect Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`DirectSelectTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element directSelectTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
