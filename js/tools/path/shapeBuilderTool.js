import BaseTool from '../baseTool.js';

export default class ShapeBuilderTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'shapeBuilderTool';
        this.name = 'ShapeBuilder Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`ShapeBuilderTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element shapeBuilderTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
