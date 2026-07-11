import BaseTool from '../baseTool.js';

export default class NoteTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'noteTool';
        this.name = 'Note Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`NoteTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element noteTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
