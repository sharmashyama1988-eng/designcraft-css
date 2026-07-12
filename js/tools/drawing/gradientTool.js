import BaseTool from '../baseTool.js';

export default class GradientTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'gradientTool';
        this.name = 'Gradient Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`GradientTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element gradientTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
