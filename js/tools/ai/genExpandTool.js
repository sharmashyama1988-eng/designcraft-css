import BaseTool from '../baseTool.js';
export default class GenExpandTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_gen_expand';
        this.name = 'Generative Expand';
        this.cursor = 'nesw-resize';
    }
    onPointerDown(e) {
        const prompt = window.prompt("Enter prompt to guide the background expansion (optional):", "");
        alert('Expanding canvas via AI...');
    }
}