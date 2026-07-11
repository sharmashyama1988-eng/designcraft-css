import BaseTool from '../baseTool.js';

export default class KerningTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'kerningTool';
        this.name = 'Kerning Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`KerningTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element kerningTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
