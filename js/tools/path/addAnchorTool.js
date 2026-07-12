import BaseTool from '../baseTool.js';

export default class AddAnchorTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'addAnchorTool';
        this.name = 'AddAnchor Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`AddAnchorTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element addAnchorTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
