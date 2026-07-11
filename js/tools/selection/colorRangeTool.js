import BaseTool from '../baseTool.js';

export default class ColorRangeTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'colorRangeTool';
        this.name = 'ColorRange Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`ColorRangeTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element colorRangeTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
