import BaseTool from '../baseTool.js';

export default class ArtboardTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'artboardTool';
        this.name = 'Artboard Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`ArtboardTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element artboardTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
