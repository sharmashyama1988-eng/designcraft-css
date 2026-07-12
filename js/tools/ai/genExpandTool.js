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
        
        fetch('/api/tools', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({action: 'genExpand'})
        }).then(res => res.json()).then(data => alert(data.message)).catch(err => console.error(err));
    
    }
}