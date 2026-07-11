import BaseTool from '../baseTool.js';

export default class CalligraphyTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'calligraphyTool';
        this.name = 'Calligraphy Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`CalligraphyTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element calligraphyTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
