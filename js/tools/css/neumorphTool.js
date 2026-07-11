import BaseTool from '../baseTool.js';
export default class NeumorphTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_neumorph';
        this.name = 'Neumorphism';
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        const el = this.editor.selectedElement;
        el.style.background = '#e0e0e0';
        el.style.borderRadius = '20px';
        el.style.boxShadow = '20px 20px 60px #bebebe, -20px -20px 60px #ffffff';
    }
}