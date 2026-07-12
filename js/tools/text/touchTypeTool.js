import BaseTool from '../baseTool.js';

export default class TouchTypeTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'touchTypeTool';
        this.name = 'TouchType Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`TouchTypeTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element touchTypeTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
