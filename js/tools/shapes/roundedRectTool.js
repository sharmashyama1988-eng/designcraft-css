import BaseTool from '../baseTool.js';

export default class RoundedRectTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'roundedRectTool';
        this.name = 'RoundedRect Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`RoundedRectTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element roundedRectTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
