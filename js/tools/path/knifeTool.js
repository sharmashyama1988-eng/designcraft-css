import BaseTool from '../baseTool.js';

export default class KnifeTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'knifeTool';
        this.name = 'Knife Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`KnifeTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element knifeTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
