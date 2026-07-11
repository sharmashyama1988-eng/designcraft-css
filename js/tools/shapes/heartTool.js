import BaseTool from '../baseTool.js';

export default class HeartTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'heartTool';
        this.name = 'Heart Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`HeartTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element heartTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
