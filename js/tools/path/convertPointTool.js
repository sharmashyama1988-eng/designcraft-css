import BaseTool from '../baseTool.js';

export default class ConvertPointTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'convertPointTool';
        this.name = 'ConvertPoint Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`ConvertPointTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element convertPointTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
