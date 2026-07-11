import BaseTool from '../baseTool.js';

export default class DodgeTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'dodgeTool';
        this.name = 'Dodge Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`DodgeTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element dodgeTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
