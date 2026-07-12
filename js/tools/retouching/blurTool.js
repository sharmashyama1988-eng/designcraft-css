import BaseTool from '../baseTool.js';

export default class BlurTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'blurTool';
        this.name = 'Blur Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`BlurTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element blurTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
