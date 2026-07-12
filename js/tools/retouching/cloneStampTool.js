import BaseTool from '../baseTool.js';

export default class CloneStampTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'cloneStampTool';
        this.name = 'CloneStamp Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`CloneStampTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element cloneStampTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
