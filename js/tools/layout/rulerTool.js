import BaseTool from '../baseTool.js';

export default class RulerTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'rulerTool';
        this.name = 'Ruler Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`RulerTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element rulerTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
