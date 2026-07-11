import BaseTool from '../baseTool.js';
export default class WireUiTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_wire_ui';
        this.name = 'Wireframe-to-UI';
        this.cursor = 'pointer';
    }
    onPointerDown(e) {
        alert('Analyzing wireframe and generating UI...');
    }
}