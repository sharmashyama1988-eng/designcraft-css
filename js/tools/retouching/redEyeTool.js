import BaseTool from '../baseTool.js';

export default class RedEyeTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'redEyeTool';
        this.name = 'RedEye Tool';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(`RedEyeTool - Pointer Down`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element redEyeTool-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
