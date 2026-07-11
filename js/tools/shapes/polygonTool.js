import BaseTool from '../baseTool.js';

export default class PolygonTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'polygonTool';
        this.name = 'Polygon Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`PolygonTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element polygonTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
