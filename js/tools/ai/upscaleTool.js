import BaseTool from '../baseTool.js';
export default class UpscaleTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_upscale';
        this.name = 'AI Upscaler';
        this.cursor = 'zoom-in';
    }
    onPointerDown(e) {
        
        fetch('/api/tools', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({action: 'upscale'})
        }).then(res => res.json()).then(data => alert(data.message)).catch(err => console.error(err));
    
    }
}