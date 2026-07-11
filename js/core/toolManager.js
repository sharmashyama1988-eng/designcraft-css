export default class ToolManager {
    constructor(editor) {
        this.editor = editor;
        this.registry = new Map(); // Metadata for tools
        this.activeTool = null;
    }

    // Register metadata without downloading the full tool code
    registerTool(metadata) {
        this.registry.set(metadata.id, metadata);
    }

    async activateTool(toolId) {
        if (this.activeTool && this.activeTool.id === toolId) return;

        // 1. Deactivate current
        if (this.activeTool) {
            this.activeTool.onDeactivate();
        }

        // 2. Lazy load the module if not already cached
        const meta = this.registry.get(toolId);
        if (!meta) {
            console.error(`Tool metadata not found for: ${toolId}`);
            return;
        }

        if (!meta.instance) {
            try {
                // Dynamic import pattern using ES modules
                const ToolModule = await import(`../tools/${meta.path}`);
                const ToolClass = ToolModule.default;
                meta.instance = new ToolClass(this);
                await meta.instance.onRegister();
            } catch (error) {
                console.error(`Failed to load tool: ${toolId}`, error);
                return; // Graceful fallback
            }
        }

        // 3. Activate
        this.activeTool = meta.instance;
        this.activeTool.onActivate();
        
        // Update UI state
        document.querySelectorAll('.tool-btn')?.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === toolId);
        });
    }

    // Route global events to the active tool
    handlePointerDown(e) {
        if (this.activeTool) this.activeTool.onPointerDown(e);
    }

    handlePointerMove(e) {
        if (this.activeTool) this.activeTool.onPointerMove(e);
    }

    handlePointerUp(e) {
        if (this.activeTool) this.activeTool.onPointerUp(e);
    }
}
