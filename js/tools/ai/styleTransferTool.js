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
            alert(`Transferring style to '${prompt}'...`);
        }
    }
}