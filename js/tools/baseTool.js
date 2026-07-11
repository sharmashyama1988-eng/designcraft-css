export default class BaseTool {
    constructor(manager) {
        this.manager = manager; 
        this.editor = manager.editor; // Access to canvas, state, layers
        this.id = 'base_tool';
        this.name = 'Base Tool';
        this.category = 'utility';
        this.icon = '';
        this.shortcut = null;
        this.cursor = 'default';
    }

    // --- Lifecycle Methods ---
    async onRegister() { 
        // Called when app boots or tool is first loaded
    }
    
    onActivate() { 
        // Setup UI, change cursor, attach local listeners
        if (this.editor && this.editor.canvas) {
            this.editor.canvas.style.cursor = this.cursor;
        }
    }
    
    onDeactivate() { 
        // Clean up UI, detach listeners, commit final states
    }

    // --- Interaction Hooks ---
    onPointerDown(event) {}
    onPointerMove(event) {}
    onPointerUp(event) {}
    onKeyDown(event) {}
    onKeyUp(event) {}

    // --- Utility ---
    getPointerPos(e) {
        const rect = this.editor.canvas.getBoundingClientRect();
        let clientX = e.clientX;
        let clientY = e.clientY;
        
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
}
