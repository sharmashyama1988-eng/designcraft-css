import BaseTool from '../baseTool.js';

export default class FreePenTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'freePenTool';
        this.name = 'FreePen Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`FreePenTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element freePenTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
