import BaseTool from '../baseTool.js';
export default class ColorizeTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_colorize';
        this.name = 'Auto-Colorize';
        this.cursor = 'crosshair';
    }
    onPointerDown(e) {
        
        fetch('/api/tools', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({action: 'colorize'})
        }).then(res => res.json()).then(data => alert(data.message)).catch(err => console.error(err));
    
    }
}