import BaseTool from '../baseTool.js';

export default class DelAnchorTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'delAnchorTool';
        this.name = 'DelAnchor Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`DelAnchorTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element delAnchorTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
