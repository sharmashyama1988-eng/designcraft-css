import BaseTool from '../baseTool.js';

export default class MarqueeRectTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'marqueeRectTool';
        this.name = 'MarqueeRect Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`MarqueeRectTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element marqueeRectTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
