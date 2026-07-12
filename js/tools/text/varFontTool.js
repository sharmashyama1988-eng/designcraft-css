import BaseTool from '../baseTool.js';

export default class VarFontTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'varFontTool';
        this.name = 'VarFont Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`VarFontTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element varFontTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
