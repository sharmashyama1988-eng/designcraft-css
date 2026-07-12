import BaseTool from '../baseTool.js';

export default class GridGenTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'gridGenTool';
        this.name = 'GridGen Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`GridGenTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element gridGenTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
