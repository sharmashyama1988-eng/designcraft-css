import BaseTool from '../baseTool.js';

export default class AreaTypeTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'areaTypeTool';
        this.name = 'AreaType Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`AreaTypeTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element areaTypeTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
