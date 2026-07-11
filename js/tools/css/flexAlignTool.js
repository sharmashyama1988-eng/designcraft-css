import BaseTool from '../baseTool.js';
export default class FlexAlignTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_flex_align';
        this.name = 'Flexbox Aligner';
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        const el = this.editor.selectedElement;
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
    }
}