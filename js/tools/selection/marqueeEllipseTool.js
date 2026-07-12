import BaseTool from '../baseTool.js';

export default class MarqueeEllipseTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'marqueeEllipseTool';
        this.name = 'MarqueeEllipse Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`MarqueeEllipseTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element marqueeEllipseTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
