import BaseTool from '../baseTool.js';

export default class CustomShapeTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'customShapeTool';
        this.name = 'CustomShape Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`CustomShapeTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element customShapeTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
