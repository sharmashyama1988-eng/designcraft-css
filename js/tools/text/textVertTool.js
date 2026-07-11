import BaseTool from '../baseTool.js';

export default class TextVertTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'textVertTool';
        this.name = 'TextVert Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`TextVertTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element textVertTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
