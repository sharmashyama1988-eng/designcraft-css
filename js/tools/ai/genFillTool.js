import BaseTool from '../baseTool.js';
export default class GenFillTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_gen_fill';
        this.name = 'Generative Fill';
        this.cursor = 'crosshair';
        this.isSelecting = false;
        this.startPos = null;
        this.selectionRect = null;
    }
    onActivate() {
        super.onActivate();
        if (window.console) console.log('Generative Fill activated: Drag to select an area.');
    }
    onPointerDown(e) {
        this.isSelecting = true;
        this.startPos = this.getPointerPos(e);
        this.selectionRect = { x: this.startPos.x, y: this.startPos.y, w: 0, h: 0 };
    }
    onPointerMove(e) {
        if (!this.isSelecting) return;
        const currentPos = this.getPointerPos(e);
        this.selectionRect.w = currentPos.x - this.startPos.x;
        this.selectionRect.h = currentPos.y - this.startPos.y;
    }
    onPointerUp(e) {
        if (!this.isSelecting) return;
        this.isSelecting = false;
        this.promptGenerativeFill();
    }
    async promptGenerativeFill() {
        try {
            if (Math.abs(this.selectionRect.w) < 10 || Math.abs(this.selectionRect.h) < 10) return;
            const prompt = window.prompt("Enter prompt for Generative Fill:", "");
            if (!prompt) return;
            
        fetch('/api/tools', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({action: 'genFill'})
        }).then(res => res.json()).then(data => alert(data.message)).catch(err => console.error(err));
    
        } catch (error) {
            console.error("Error in generative fill:", error);
        }
    }
}