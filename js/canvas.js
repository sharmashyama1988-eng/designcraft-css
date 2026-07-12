/* DesignCraft Canvas Editor
   Manages elements selection, movement, resizing, snapping, layer ordering, and double-click text editing. */

class CanvasEditor {
    constructor() {
        this.artboard = document.getElementById('paint-artboard');
        this.selectionBox = document.getElementById('selection-box');
        this.zoomPercent = document.getElementById('zoom-percent');
        this.coordDisplay = document.getElementById('element-coord');
        this.countDisplay = document.getElementById('canvas-elements-count');
        
        this.selectedElement = null;
        this.zoomLevel = 1.0;
        this.isDragging = false;
        this.isResizing = false;
        this.activeHandle = null;
        
        this.startX = 0;
        this.startY = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        this.startLeft = 0;
        this.startTop = 0;
        
        this.snapThreshold = 8; // Pixels
        this.elementCounter = 0;
        this.clipboard = null;
        
        this.initEvents();
    }

    initEvents() {
        // Selection/Click-off
        this.artboard?.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', () => this.handleMouseUp());
        
        // Double-click for text edit
        this.artboard?.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        
        // Key bindings (Delete element, Copy/Paste)
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Zoom bindings
        document.getElementById('zoom-in')?.addEventListener('click', () => this.adjustZoom(0.1));
        document.getElementById('zoom-out')?.addEventListener('click', () => this.adjustZoom(-0.1));
        
        // Alignments
        document.getElementById('order-to-front')?.addEventListener('click', () => this.bringToFront());
        document.getElementById('order-forward')?.addEventListener('click', () => this.moveForward());
        document.getElementById('order-backward')?.addEventListener('click', () => this.moveBackward());
        document.getElementById('order-to-back')?.addEventListener('click', () => this.sendToBack());

        document.getElementById('align-left')?.addEventListener('click', () => this.alignElement('left'));
        document.getElementById('align-center')?.addEventListener('click', () => this.alignElement('center'));
        document.getElementById('align-right')?.addEventListener('click', () => this.alignElement('right'));
        document.getElementById('align-top')?.addEventListener('click', () => this.alignElement('top'));
        document.getElementById('align-middle')?.addEventListener('click', () => this.alignElement('middle'));
        document.getElementById('align-bottom')?.addEventListener('click', () => this.alignElement('bottom'));

        document.getElementById('action-group')?.addEventListener('click', () => this.groupElements());
        document.getElementById('action-ungroup')?.addEventListener('click', () => this.ungroupElements());

        // Dynamic 3D Tilt interaction delegated on the artboard
        this.artboard?.addEventListener('mousemove', (e) => {
            const tiltCheckbox = document.getElementById('ai-enable-tilt');
            if (tiltCheckbox && !tiltCheckbox.checked) return;

            const el = e.target.closest('.canvas-element');
            if (!el || this.isDragging || this.isResizing || el.classList.contains('editing')) return;
            
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const midX = rect.width / 2;
            const midY = rect.height / 2;
            
            const maxTilt = 10; // degrees
            const tiltY = ((x - midX) / midX) * maxTilt;
            const tiltX = -((y - midY) / midY) * maxTilt;
            
            el.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
            el.style.transition = 'transform 0.05s ease';
            el.style.transformStyle = 'preserve-3d';
        });

        // Toggle listener to clear tilt styles instantly when disabled
        const tiltCheckbox = document.getElementById('ai-enable-tilt');
        if (tiltCheckbox) {
            tiltCheckbox?.addEventListener('change', () => {
                if (!tiltCheckbox.checked) {
                    document.querySelectorAll('.canvas-element')?.forEach(el => {
                        el.style.transform = '';
                    });
                }
            });
        }
        
        this.artboard?.addEventListener('mouseout', (e) => {
            const tiltCheckbox = document.getElementById('ai-enable-tilt');
            if (tiltCheckbox && !tiltCheckbox.checked) return;
            const el = e.target.closest('.canvas-element');
            if (!el) return;
            el.style.transform = '';
            el.style.transition = 'transform 0.25s ease';
        });
    }

    // Add Shape Element
    addShape(shapeType) {
        const el = document.createElement('div');
        el.className = 'canvas-element';
        el.id = `el-${Date.now()}`;
        el.dataset.type = 'shape';
        el.dataset.shape = shapeType;
        el.dataset.name = `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} ${++this.elementCounter}`;
        
        // Set standard shape positioning and base design
        el.style.left = '100px';
        el.style.top = '100px';
        el.style.width = '150px';
        el.style.height = '150px';
        el.style.backgroundColor = '#6366f1';
        el.style.color = '#ffffff';
        el.style.zIndex = this.getMaxZIndex() + 1;
        
        // Shape clips
        if (shapeType === 'circle') {
            el.style.borderRadius = '50%';
        } else if (shapeType === 'triangle') {
            el.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
        } else if (shapeType === 'star') {
            el.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
        } else if (shapeType === 'blob') {
            el.style.borderRadius = '60% 40% 30% 70% / 60% 30% 70% 40%';
        } else if (shapeType === 'rectangle') {
            // Plain rectangle — no clip, no special radius. borderRadius left at default 0.
            el.style.borderRadius = '4px';
        } else if (shapeType === 'line') {
            el.style.width = '200px';
            el.style.height = '3px';
            el.style.borderRadius = '0';
        }
        
        this.artboard.appendChild(el);
        this.selectElement(el);
        this.triggerHistorySave();
        this.updateElementsCount();
        if (window.controlsManager) window.controlsManager.updateLayersList();
    }

    // Add Text Element
    addText(textString = 'Double-click to Edit') {
        const el = document.createElement('div');
        el.className = 'canvas-element text-element';
        el.id = `el-${Date.now()}`;
        el.dataset.type = 'text';
        el.dataset.name = `Text ${++this.elementCounter}`;
        el.innerText = textString;
        
        el.style.left = '100px';
        el.style.top = '100px';
        el.style.width = '240px';
        el.style.height = 'auto';
        el.style.fontSize = '24px';
        el.style.fontFamily = "'Outfit', sans-serif";
        el.style.fontWeight = '600';
        el.style.color = '#ffffff';
        el.style.zIndex = this.getMaxZIndex() + 1;
        
        this.artboard.appendChild(el);
        this.selectElement(el);
        this.triggerHistorySave();
        this.updateElementsCount();
        if (window.controlsManager) window.controlsManager.updateLayersList();
    }

    // Selection logic
    selectElement(el) {
        if (this.selectedElement === el) return;
        
        // De-select old
        this.deselectAll();
        
        if (el && el.classList.contains('canvas-element')) {
            this.selectedElement = el;
            el.setAttribute('data-selected', 'true');
            this.updateSelectionBox();
            
            // Sync Property Inspector sidebar
            if (window.controlsManager) {
                window.controlsManager.syncInspector(el);
            }
        }
    }

    deselectAll() {
        if (this.selectedElement) {
            this.selectedElement.removeAttribute('data-selected');
        }
        this.selectedElement = null;
        this.selectionBox.classList.add('hidden');
        
        // Sync empty Property Inspector
        if (window.controlsManager) {
            window.controlsManager.syncInspector(null);
        }
        
        // Remove guides
        this.hideGuides();
    }

    updateSelectionBox() {
        if (!this.selectedElement) {
            this.selectionBox.classList.add('hidden');
            return;
        }
        
        const el = this.selectedElement;
        
        // Position Selection Box directly overlaying the element
        this.selectionBox.style.left = el.style.left;
        this.selectionBox.style.top = el.style.top;
        this.selectionBox.style.width = el.style.width;
        this.selectionBox.style.height = el.style.height;
        this.selectionBox.style.transform = el.style.transform;
        
        this.selectionBox.classList.remove('hidden');
        
        // Update Coordinates
        const left = parseInt(el.style.left);
        const top = parseInt(el.style.top);
        this.coordDisplay.innerText = `X: ${left}px, Y: ${top}px`;
    }

    // Handles mousedown on Canvas elements & handles
    handleMouseDown(e) {
        // If clicking on resize handles
        if (e.target.classList.contains('resize-handle')) {
            e.stopPropagation();
            this.isResizing = true;
            this.activeHandle = e.target.dataset.handle;
            
            this.startX = e.clientX;
            this.startY = e.clientY;
            
            this.startWidth = parseInt(this.selectedElement.style.width);
            this.startHeight = parseInt(this.selectedElement.style.height);
            this.startLeft = parseInt(this.selectedElement.style.left);
            this.startTop = parseInt(this.selectedElement.style.top);
            return;
        }
        
        // Clicked canvas element
        const clickedEl = e.target.closest('.canvas-element');
        if (clickedEl) {
            e.stopPropagation();
            
            // Do not break editing if user clicks inside active textarea
            if (clickedEl.querySelector('.editing-input-active')) return;
            
            this.selectElement(clickedEl);
            
            this.isDragging = true;
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.startLeft = parseInt(clickedEl.style.left);
            this.startTop = parseInt(clickedEl.style.top);
            return;
        }
        
        // Clicked outside elements -> Deselect
        this.deselectAll();
    }

    // Handles dragging & resizing movements
    handleMouseMove(e) {
        if (!this.selectedElement) return;
        
        const deltaX = (e.clientX - this.startX) / this.zoomLevel;
        const deltaY = (e.clientY - this.startY) / this.zoomLevel;
        
        if (this.isDragging) {
            let newLeft = Math.round(this.startLeft + deltaX);
            let newTop = Math.round(this.startTop + deltaY);
            
            // Snapping to margins & coordinates
            const snapped = this.checkSnapping(newLeft, newTop);
            newLeft = snapped.x;
            newTop = snapped.y;
            
            this.selectedElement.style.left = `${newLeft}px`;
            this.selectedElement.style.top = `${newTop}px`;
            this.updateSelectionBox();
            
            // Sync values to sidebar size fields
            const propW = document.getElementById('prop-width');
            const propH = document.getElementById('prop-height');
            if (propW) propW.value = parseInt(this.selectedElement.style.width);
            if (propH) propH.value = parseInt(this.selectedElement.style.height);
        }
        
        if (this.isResizing) {
            let newWidth = this.startWidth;
            let newHeight = this.startHeight;
            let newLeft = this.startLeft;
            let newTop = this.startTop;
            
            const handle = this.activeHandle;
            
            // Compute Resizing metrics
            if (handle.includes('r')) {
                newWidth = Math.max(10, Math.round(this.startWidth + deltaX));
            }
            if (handle.includes('b')) {
                newHeight = Math.max(10, Math.round(this.startHeight + deltaY));
            }
            if (handle.includes('l')) {
                const computedWidth = this.startWidth - deltaX;
                if (computedWidth > 10) {
                    newWidth = Math.round(computedWidth);
                    newLeft = Math.round(this.startLeft + deltaX);
                }
            }
            if (handle.includes('t')) {
                const computedHeight = this.startHeight - deltaY;
                if (computedHeight > 10) {
                    newHeight = Math.round(computedHeight);
                    newTop = Math.round(this.startTop + deltaY);
                }
            }
            
            this.selectedElement.style.width = `${newWidth}px`;
            this.selectedElement.style.height = `${newHeight}px`;
            this.selectedElement.style.left = `${newLeft}px`;
            this.selectedElement.style.top = `${newTop}px`;
            this.updateSelectionBox();
            
            // Sync values to sidebar size fields
            const propW = document.getElementById('prop-width');
            const propH = document.getElementById('prop-height');
            if (propW) propW.value = newWidth;
            if (propH) propH.value = newHeight;
        }
    }

    handleMouseUp() {
        if (this.isDragging || this.isResizing) {
            this.isDragging = false;
            this.isResizing = false;
            this.activeHandle = null;
            this.hideGuides();
            this.triggerHistorySave();
            
            // Trigger layers list reorder syncing in sidebar if element dragged
            if (window.controlsManager) {
                window.controlsManager.updateLayersList();
            }
        }
    }

    // Check snapping coordinates relative to artboard boundaries & other elements
    checkSnapping(x, y) {
        let snappedX = x;
        let snappedY = y;
        let showXGuide = false;
        let showYGuide = false;
        
        const elWidth = parseInt(this.selectedElement.style.width);
        const elHeight = parseInt(this.selectedElement.style.height);
        
        const artboardW = parseInt(this.artboard.style.width);
        const artboardH = parseInt(this.artboard.style.height);
        
        // 1. Check Artboard Boundary & Center Snapping
        const guides = {
            vertical: [0, artboardW / 2 - elWidth / 2, artboardW - elWidth],
            horizontal: [0, artboardH / 2 - elHeight / 2, artboardH - elHeight]
        };
        
        // Vertical Snapping (X coord)
        for (const snapVal of guides.vertical) {
            if (Math.abs(x - snapVal) < this.snapThreshold) {
                snappedX = snapVal;
                showYGuide = true;
                const guideY = document.getElementById('guide-y');
                guideY.style.left = `${snappedX + elWidth / 2}px`;
                break;
            }
        }
        
        // Horizontal Snapping (Y coord)
        for (const snapVal of guides.horizontal) {
            if (Math.abs(y - snapVal) < this.snapThreshold) {
                snappedY = snapVal;
                showXGuide = true;
                const guideX = document.getElementById('guide-x');
                guideX.style.top = `${snappedY + elHeight / 2}px`;
                break;
            }
        }
        
        // Display guides
        document.getElementById('guide-x')?.classList.toggle('hidden', !showXGuide);
        document.getElementById('guide-y')?.classList.toggle('hidden', !showYGuide);
        
        return { x: snappedX, y: snappedY };
    }

    hideGuides() {
        document.getElementById('guide-x')?.classList.add('hidden');
        document.getElementById('guide-y')?.classList.add('hidden');
    }

    // Double-click text box to edit text in place
    handleDoubleClick(e) {
        const textEl = e.target.closest('.text-element');
        if (!textEl) return;
        
        e.stopPropagation();
        this.deselectAll();
        
        const originalText = textEl.innerText;
        textEl.innerText = '';
        
        // Create matching textarea
        const textarea = document.createElement('textarea');
        textarea.className = 'editing-input-active';
        textarea.value = originalText;
        
        // Match CSS details
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.style.fontFamily = textEl.style.fontFamily;
        textarea.style.fontSize = textEl.style.fontSize;
        textarea.style.fontWeight = textEl.style.fontWeight;
        textarea.style.color = textEl.style.color;
        textarea.style.textAlign = textEl.style.textAlign || 'left';
        
        textEl.appendChild(textarea);
        textarea.focus();
        
        // Autosize helper
        textarea.style.height = `${textarea.scrollHeight}px`;
        
        const finishEdit = () => {
            const newText = textarea.value.trim() === '' ? originalText : textarea.value;
            textEl.innerHTML = '';
            textEl.innerText = newText;
            
            // Re-select element
            this.selectElement(textEl);
            this.triggerHistorySave();
        };
        
        textarea?.addEventListener('blur', finishEdit);
        textarea?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                textarea.blur();
            }
            if (e.key === 'Escape') {
                textarea.value = originalText;
                textarea.blur();
            }
        });
    }

    // Delete or Copy/Paste key binds
    handleKeyDown(e) {
        // Prevent action if in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.getAttribute('contenteditable') === 'true') {
            return;
        }
        
        // Delete element
        if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedElement) {
            e.preventDefault();
            const elToDelete = this.selectedElement;
            this.deselectAll();
            elToDelete.remove();
            
            this.triggerHistorySave();
            this.updateElementsCount();
            if (window.controlsManager) window.controlsManager.updateLayersList();
        }
        
        // Copy (Ctrl+C)
        if (e.ctrlKey && e.key.toLowerCase() === 'c' && this.selectedElement) {
            e.preventDefault();
            this.clipboard = this.selectedElement.cloneNode(true);
            this.clipboard.removeAttribute('data-selected');
        }
        
        // Paste (Ctrl+V)
        if (e.ctrlKey && e.key.toLowerCase() === 'v' && this.clipboard) {
            e.preventDefault();
            const clone = this.clipboard.cloneNode(true);
            clone.id = `el-${Date.now()}`;
            clone.style.left = `${parseInt(clone.style.left) + 20}px`;
            clone.style.top = `${parseInt(clone.style.top) + 20}px`;
            clone.dataset.name = clone.dataset.name + ' Copy';
            
            this.artboard.appendChild(clone);
            this.selectElement(clone);
            
            this.triggerHistorySave();
            this.updateElementsCount();
            if (window.controlsManager) window.controlsManager.updateLayersList();
        }
        
        // Undo (Ctrl+Z)
        if (e.ctrlKey && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            document.getElementById('action-undo').click();
        }
        
        // Redo (Ctrl+Y)
        if (e.ctrlKey && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            document.getElementById('action-redo').click();
        }
    }

    // Zoom adjust
    adjustZoom(amount) {
        this.zoomLevel = Math.max(0.2, Math.min(3.0, this.zoomLevel + amount));
        this.artboard.style.transform = `scale(${this.zoomLevel})`;
        this.zoomPercent.innerText = `${Math.round(this.zoomLevel * 100)}%`;
        this.updateSelectionBox();
    }

    // Get max z-index
    getMaxZIndex() {
        let max = 0;
        const elements = this.artboard.querySelectorAll('.canvas-element');
        elements.forEach(el => {
            const z = parseInt(el.style.zIndex) || 0;
            if (z > max) max = z;
        });
        return max;
    }

    // Z-Index ordering
    bringToFront() {
        if (!this.selectedElement) return;
        this.artboard.appendChild(this.selectedElement);
        this.updateSelectionBox();
        this.triggerHistorySave();
        if (window.controlsManager) window.controlsManager.updateLayersList();
    }

    sendToBack() {
        if (!this.selectedElement) return;
        this.artboard.insertBefore(this.selectedElement, this.artboard.firstChild);
        this.updateSelectionBox();
        this.triggerHistorySave();
        if (window.controlsManager) window.controlsManager.updateLayersList();
    }

    moveForward() {
        if (!this.selectedElement) return;
        const next = this.selectedElement.nextElementSibling;
        // Skip selection box and guide lines which are at bottom
        if (next && next.classList.contains('canvas-element')) {
            this.artboard.insertBefore(next, this.selectedElement);
            this.updateSelectionBox();
            this.triggerHistorySave();
            if (window.controlsManager) window.controlsManager.updateLayersList();
        }
    }

    moveBackward() {
        if (!this.selectedElement) return;
        const prev = this.selectedElement.previousElementSibling;
        if (prev && prev.classList.contains('canvas-element')) {
            this.artboard.insertBefore(this.selectedElement, prev);
            this.updateSelectionBox();
            this.triggerHistorySave();
            if (window.controlsManager) window.controlsManager.updateLayersList();
        }
    }

    alignElement(alignment) {
        if (!this.selectedElement) return;

        const el = this.selectedElement;
        const parent = el.parentElement || this.artboard;
        
        const parentWidth = parent.clientWidth || parent.offsetWidth;
        const parentHeight = parent.clientHeight || parent.offsetHeight;
        
        const elWidth = el.offsetWidth;
        const elHeight = el.offsetHeight;
        
        switch (alignment) {
            case 'left':
                el.style.left = '0px';
                break;
            case 'center':
                el.style.left = Math.round((parentWidth - elWidth) / 2) + 'px';
                break;
            case 'right':
                el.style.left = Math.round(parentWidth - elWidth) + 'px';
                break;
            case 'top':
                el.style.top = '0px';
                break;
            case 'middle':
                el.style.top = Math.round((parentHeight - elHeight) / 2) + 'px';
                break;
            case 'bottom':
                el.style.top = Math.round(parentHeight - elHeight) + 'px';
                break;
        }

        this.updateSelectionBox();
        this.triggerHistorySave();
    }

    groupElements() {
        if (!this.selectedElement) return;
        // Basic grouping logic for a single element (just puts it in a wrapper)
        // Multi-select requires shift-click logic to be fully functional
        const el = this.selectedElement;
        
        // Don't group if already a group
        if (el.classList.contains('canvas-group')) return;

        const groupNode = document.createElement('div');
        groupNode.className = 'canvas-element canvas-group';
        groupNode.id = 'group-' + Date.now();
        
        // Inherit position and size
        groupNode.style.position = 'absolute';
        groupNode.style.left = el.style.left;
        groupNode.style.top = el.style.top;
        groupNode.style.width = el.style.width;
        groupNode.style.height = el.style.height;
        groupNode.style.zIndex = el.style.zIndex || 1;

        // Reset element position to 0,0 relative to group
        el.style.left = '0px';
        el.style.top = '0px';
        
        el.parentNode.insertBefore(groupNode, el);
        groupNode.appendChild(el);

        this.selectElement(groupNode);
        this.triggerHistorySave();
        this.updateElementsCount();
        if (window.controlsManager) window.controlsManager.updateLayersList();
    }

    ungroupElements() {
        if (!this.selectedElement || !this.selectedElement.classList.contains('canvas-group')) return;
        
        const groupNode = this.selectedElement;
        const children = Array.from(groupNode.children);
        
        const parent = groupNode.parentNode;
        let firstChild = null;

        children.forEach(child => {
            if (child.classList.contains('canvas-element')) {
                // Restore global coordinates
                const gLeft = parseInt(groupNode.style.left) || 0;
                const gTop = parseInt(groupNode.style.top) || 0;
                const cLeft = parseInt(child.style.left) || 0;
                const cTop = parseInt(child.style.top) || 0;
                
                child.style.left = `${gLeft + cLeft}px`;
                child.style.top = `${gTop + cTop}px`;
                child.style.zIndex = groupNode.style.zIndex;
                
                parent.insertBefore(child, groupNode);
                if (!firstChild) firstChild = child;
            }
        });
        
        parent.removeChild(groupNode);
        this.deselectAll();
        if (firstChild) this.selectElement(firstChild);
        
        this.triggerHistorySave();
        this.updateElementsCount();
        if (window.controlsManager) window.controlsManager.updateLayersList();
    }

    // Count updates
    updateElementsCount() {
        const count = this.artboard.querySelectorAll('.canvas-element').length;
        this.countDisplay.innerText = `${count} Element${count === 1 ? '' : 's'}`;
    }

    // State HTML representation for undo/redo snapshots
    getSnapshot() {
        // Clone and strip selections
        const clone = this.artboard.cloneNode(true);
        // Remove guides & selection box from snapshot
        const helpers = clone.querySelectorAll('.selection-overlay, .guide-line');
        helpers.forEach(h => h.remove());
        
        // Remove selected tags
        const selected = clone.querySelectorAll('[data-selected="true"]');
        selected.forEach(s => s.removeAttribute('data-selected'));
        
        return clone.innerHTML;
    }

    loadSnapshot(htmlContent) {
        // Keep helpers
        const selectionBoxHtml = this.selectionBox.outerHTML;
        const guideXHtml = document.getElementById('guide-x').outerHTML;
        const guideYHtml = document.getElementById('guide-y').outerHTML;
        
        this.artboard.innerHTML = htmlContent;
        
        // Append helpers back
        const parser = new DOMParser();
        this.artboard.appendChild(parser.parseFromString(selectionBoxHtml, 'text/html').body.firstChild);
        this.artboard.appendChild(parser.parseFromString(guideXHtml, 'text/html').body.firstChild);
        this.artboard.appendChild(parser.parseFromString(guideYHtml, 'text/html').body.firstChild);
        
        // Re-hook local refs
        this.selectionBox = document.getElementById('selection-box');
        
        // Reselect if applicable
        const active = this.artboard.querySelector('[data-selected="true"]');
        if (active) {
            this.selectedElement = active;
            this.updateSelectionBox();
        } else {
            this.deselectAll();
        }
        
        this.updateElementsCount();
        if (window.controlsManager) window.controlsManager.updateLayersList();
    }

    reorderElement(action) {
        if (!this.selectedElement) return;
        
        const el = this.selectedElement;
        const currentZ = parseInt(window.getComputedStyle(el).zIndex) || 1;
        
        if (action === 'front') el.style.zIndex = 999;
        if (action === 'forward') el.style.zIndex = currentZ + 1;
        if (action === 'backward') el.style.zIndex = Math.max(0, currentZ - 1);
        if (action === 'back') el.style.zIndex = 0;
        
        this.triggerHistorySave();
    }

    alignElement(alignment) {
        if (!this.selectedElement) return;
        
        const el = this.selectedElement;
        const parentW = this.artboard.offsetWidth;
        const parentH = this.artboard.offsetHeight;
        const elW = el.offsetWidth;
        const elH = el.offsetHeight;
        
        switch (alignment) {
            case 'left': el.style.left = '0px'; break;
            case 'center': el.style.left = `${(parentW - elW) / 2}px`; break;
            case 'right': el.style.left = `${parentW - elW}px`; break;
            case 'top': el.style.top = '0px'; break;
            case 'middle': el.style.top = `${(parentH - elH) / 2}px`; break;
            case 'bottom': el.style.top = `${parentH - elH}px`; break;
        }
        
        this.updateSelectionBox();
        this.triggerHistorySave();
    }

    triggerHistorySave() {
        const snapshot = this.getSnapshot();
        window.historyManager.saveState(snapshot);
    }
}

// Export singleton instance
window.canvasEditor = new CanvasEditor();
