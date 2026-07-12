import BaseTool from '../baseTool.js';
export default class BgRemoveTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_bg_remove';
        this.name = 'Background Remover';
        this.cursor = 'pointer';
    }
    onPointerDown(e) {
        
        fetch('/api/tools', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({action: 'bgRemove'})
        }).then(res => res.json()).then(data => alert(data.message)).catch(err => console.error(err));
    
    }
}