import BaseTool from '../baseTool.js';
export default class StyleTransferTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_style_transfer';
        this.name = 'Style Transfer';
        this.cursor = 'crosshair';
    }
    onPointerDown(e) {
        const prompt = window.prompt("Enter style description (e.g. 'Cyberpunk', 'Watercolor'):", "Cyberpunk");
        if (prompt) {
            
        fetch('/api/tools', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({action: 'styleTransfer'})
        }).then(res => res.json()).then(data => alert(data.message)).catch(err => console.error(err));
    
        }
    }
}