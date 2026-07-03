/* DesignCraft History Manager
   Provides Undo and Redo operations by keeping snapshots of the canvas HTML. */

class HistoryManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxSize = 50; // Limit history size
    }

    // Save a new state
    saveState(stateHtml) {
        // If state is the same as the last one, do nothing
        if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === stateHtml) {
            return;
        }
        
        this.undoStack.push(stateHtml);
        this.redoStack = []; // Clear redo stack on new action
        
        if (this.undoStack.length > this.maxSize) {
            this.undoStack.shift(); // Remove oldest
        }
        this.updateButtons();
    }

    // Perform Undo
    undo(currentStateHtml) {
        if (this.undoStack.length === 0) return null;
        
        // Push current state to redo
        this.redoStack.push(currentStateHtml);
        
        // Pop previous state
        const prevState = this.undoStack.pop();
        this.updateButtons();
        return prevState;
    }

    // Perform Redo
    redo(currentStateHtml) {
        if (this.redoStack.length === 0) return null;
        
        // Push current state to undo
        this.undoStack.push(currentStateHtml);
        
        // Pop next state
        const nextState = this.redoStack.pop();
        this.updateButtons();
        return nextState;
    }

    // Clear history
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.updateButtons();
    }

    // Enable/disable UI buttons
    updateButtons() {
        const undoBtn = document.getElementById('action-undo');
        const redoBtn = document.getElementById('action-redo');
        
        if (undoBtn) {
            undoBtn.disabled = this.undoStack.length === 0;
            undoBtn.style.opacity = this.undoStack.length === 0 ? '0.4' : '1';
        }
        if (redoBtn) {
            redoBtn.disabled = this.redoStack.length === 0;
            redoBtn.style.opacity = this.redoStack.length === 0 ? '0.4' : '1';
        }
    }
}

// Export singleton instance
window.historyManager = new HistoryManager();
