import BaseTool from '../baseTool.js';

export default class PixelArtTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'pixelArtTool';
        this.name = 'PixelArt Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`PixelArtTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element pixelArtTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
