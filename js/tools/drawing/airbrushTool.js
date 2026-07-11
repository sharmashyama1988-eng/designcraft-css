import BaseTool from '../baseTool.js';

export default class AirbrushTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'airbrushTool';
        this.name = 'Airbrush Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`AirbrushTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element airbrushTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
