import BaseTool from '../baseTool.js';
export default class WireUiTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_wire_ui';
        this.name = 'Wireframe-to-UI';
        this.cursor = 'pointer';
    }
    onPointerDown(e) {
        
        fetch('/api/tools', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({action: 'wireUi'})
        }).then(res => res.json()).then(data => alert(data.message)).catch(err => console.error(err));
    
    }
}