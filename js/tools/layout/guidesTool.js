import BaseTool from '../baseTool.js';

export default class GuidesTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'guidesTool';
        this.name = 'Guides Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`GuidesTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element guidesTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
