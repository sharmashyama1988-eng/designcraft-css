import BaseTool from '../baseTool.js';

export default class EyedropperTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'eyedropperTool';
        this.name = 'Eyedropper Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`EyedropperTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element eyedropperTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
