/* DesignCraft Procedural Generators
   Implements Figma-killing asset generators:
   1. Procedural SVG Blob Vector Creator (polar coordinate math & quadratic curves).
   2. Dynamic CSS Background Pattern Injector. */

document.addEventListener('DOMContentLoaded', () => {
    // 1. SVG Blob Sliders Sync
    const blobPoints = document.getElementById('gen-blob-points');
    const blobSpiky = document.getElementById('gen-blob-spiky');
    const valPoints = document.getElementById('val-blob-points');
    const valSpiky = document.getElementById('val-blob-spiky');
    
    if (blobPoints && valPoints) {
        blobPoints?.addEventListener('input', (e) => {
            valPoints.innerText = e.target.value;
        });
    }
    
    if (blobSpiky && valSpiky) {
        blobSpiky?.addEventListener('input', (e) => {
            valSpiky.innerText = e.target.value;
        });
    }

    // 2. Blob Generator Math & Execution
    const btnGenBlob = document.getElementById('btn-generate-blob');
    if (btnGenBlob) {
        btnGenBlob?.addEventListener('click', () => {
            const points = parseInt(blobPoints.value) || 5;
            const spikiness = parseInt(blobSpiky.value) || 40;
            
            // Generate polar noise-offset SVG path
            const pathData = generateProceduralBlobPath(points, spikiness);
            
            // Create canvas element container
            const el = document.createElement('div');
            el.className = 'canvas-element';
            el.id = `blob-${Date.now()}`;
            el.dataset.type = 'shape';
            el.dataset.shape = 'custom-blob';
            
            // Descriptive Name
            window.canvasEditor.elementCounter = (window.canvasEditor.elementCounter || 0) + 1;
            el.dataset.name = `Procedural Blob ${window.canvasEditor.elementCounter}`;
            
            // Sizing and positioning (dynamically centered on the artboard)
            const artboardEl = document.getElementById('paint-artboard');
            const abW = artboardEl ? artboardEl.clientWidth : 1000;
            const abH = artboardEl ? artboardEl.clientHeight : 650;
            el.style.left = `${(abW - 180) / 2}px`;
            el.style.top = `${(abH - 180) / 2}px`;
            el.style.width = '180px';
            el.style.height = '180px';
            el.style.zIndex = window.canvasEditor.getMaxZIndex() + 1;
            
            // Apply SVG markup inside
            const activeHue = window.controlsManager?.activeElement?.style.getPropertyValue('--hue') || Math.floor(Math.random() * 360);
            const fillGradientId = `blob-grad-${Date.now()}`;
            
            el.innerHTML = `
                <svg viewBox="0 0 200 200" width="100%" height="100%">
                    <defs>
                        <linearGradient id="${fillGradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="hsl(${activeHue}, 90%, 65%)" />
                            <stop offset="100%" stop-color="hsl(${(activeHue + 40) % 360}, 90%, 50%)" />
                        </linearGradient>
                    </defs>
                    <path d="${pathData}" fill="url(#${fillGradientId})" />
                </svg>
            `;
            
            // Paint element on artboard
            const artboard = document.getElementById('paint-artboard');
            artboard.appendChild(el);
            
            // Select and save state
            window.canvasEditor.selectElement(el);
            window.canvasEditor.triggerHistorySave();
            window.canvasEditor.updateElementsCount();
            
            if (window.controlsManager) {
                window.controlsManager.updateLayersList();
            }
        });
    }

    // Mathematical polar-offset blob generator
    function generateProceduralBlobPath(pointsCount, spikiness) {
        const center = 100;
        const baseRadius = 75;
        const maxOffset = baseRadius * (spikiness / 100) * 0.65;
        
        const points = [];
        const angleStep = (Math.PI * 2) / pointsCount;
        
        for (let i = 0; i < pointsCount; i++) {
            const angle = i * angleStep;
            // Random offset scaled by spikiness parameter
            const offset = (Math.random() - 0.5) * 2 * maxOffset;
            const radius = baseRadius + offset;
            
            const x = center + Math.cos(angle) * radius;
            const y = center + Math.sin(angle) * radius;
            points.push({ x, y });
        }
        
        // Generate smooth path using quadratic curves
        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < pointsCount; i++) {
            const p0 = points[i];
            const p1 = points[(i + 1) % pointsCount];
            const p2 = points[(i + 2) % pointsCount];
            
            // Compute middle control points
            const xc = (p1.x + p2.x) / 2;
            const yc = (p1.y + p2.y) / 2;
            
            path += ` Q ${p1.x} ${p1.y}, ${xc} ${yc}`;
        }
        path += " Z";
        return path;
    }

    // 3. Dynamic Background Patterns click listeners
    const patternGrid = document.getElementById('gen-pattern-grid');
    if (patternGrid) {
        patternGrid?.addEventListener('click', (e) => {
            const card = e.target.closest('.preset-card');
            if (!card || !window.controlsManager.activeElement) return;
            
            const pattern = card.dataset.pattern;
            const el = window.controlsManager.activeElement;
            const activeHue = el.style.getPropertyValue('--hue') || 240;
            
            let bgStyle = '';
            
            switch (pattern) {
                case 'grid':
                    bgStyle = `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`;
                    el.style.backgroundSize = '16px 16px';
                    break;
                case 'dots':
                    bgStyle = `radial-gradient(rgba(255,255,255,0.12) 1.5px, transparent 1.5px)`;
                    el.style.backgroundSize = '12px 12px';
                    break;
                case 'stripes':
                    bgStyle = `repeating-linear-gradient(45deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 10px, transparent 10px, transparent 20px)`;
                    el.style.backgroundSize = 'auto';
                    break;
                case 'aurora':
                    bgStyle = `radial-gradient(circle at 10% 20%, hsl(${activeHue}, 80%, 20%, 0.45) 0%, transparent 60%), radial-gradient(circle at 90% 80%, hsl(${(parseInt(activeHue)+120)%360}, 80%, 20%, 0.45) 0%, transparent 50%), hsl(${activeHue}, 12%, 8%)`;
                    el.style.backgroundSize = 'auto';
                    break;
            }
            
            el.style.background = bgStyle;
            el.style.backgroundColor = ''; // clear solid fallback
            
            // Sync values to inspector
            if (document.getElementById('prop-bg-type')) document.getElementById('prop-bg-type').value = 'transparent'; // Fallback display
            document.getElementById('bg-color-control')?.classList.add('hidden');
            document.getElementById('bg-gradient-control')?.classList.add('hidden');
            
            window.canvasEditor.updateSelectionBox();
            window.canvasEditor.triggerHistorySave();
        });
    }

    // 4. Premium Designer Palettes click listener
    document.addEventListener('click', (e) => {
        const row = e.target.closest('.premium-palette-row');
        if (!row) return;
        
        const el = window.canvasEditor?.selectedElement;
        if (!el) {
            alert("Select an element on the canvas first to apply this premium palette!");
            return;
        }

        const hue = row.dataset.paletteHue;
        const bgL = row.dataset.paletteBg;
        const textL = row.dataset.paletteText;
        const accentHue = row.dataset.paletteAccentH;

        // Apply HSL variable tokens to current selected element style
        el.style.setProperty('--hue', hue);
        el.style.setProperty('--bg-h', hue);
        el.style.setProperty('--bg-s', '15%');
        el.style.setProperty('--bg-l', `${bgL}%`);
        
        el.style.setProperty('--text-h', hue);
        el.style.setProperty('--text-s', '10%');
        el.style.setProperty('--text-l', `${textL}%`);

        el.style.setProperty('--accent-h', accentHue);
        el.style.setProperty('--accent-s', '90%');
        el.style.setProperty('--accent-l', '60%');

        // Force background & text update matching HSL tokens
        el.style.background = 'hsl(var(--bg-h), var(--bg-s), var(--bg-l))';
        el.style.color = 'hsl(var(--text-h), var(--text-s), var(--text-l))';
        el.style.borderColor = 'hsl(var(--accent-h), var(--accent-s), var(--accent-l), 0.35)';

        // Sync inspector panel controls if controlsManager is present
        if (window.controlsManager) {
            window.controlsManager.syncActiveElementToInspector();
        }

        window.canvasEditor.updateSelectionBox();
        window.canvasEditor.triggerHistorySave();
    });

    // 5. Random HSL Palette Generator click listener
    const btnRandomPalette = document.getElementById('btn-random-palette');
    if (btnRandomPalette) {
        btnRandomPalette?.addEventListener('click', () => {
            const el = window.canvasEditor?.selectedElement;
            if (!el) {
                alert("Select an element on the canvas first to apply a random HSL palette!");
                return;
            }

            const h = Math.floor(Math.random() * 360);
            const isDark = Math.random() > 0.4;
            const bgL = isDark ? (Math.floor(Math.random() * 8) + 4) : (Math.floor(Math.random() * 8) + 90);
            const textL = isDark ? 95 : 10;
            const accentH = (h + 120 + Math.floor(Math.random() * 60)) % 360;

            // Apply HSL variable tokens to current selected element style
            el.style.setProperty('--hue', h);
            el.style.setProperty('--bg-h', h);
            el.style.setProperty('--bg-s', '15%');
            el.style.setProperty('--bg-l', `${bgL}%`);
            
            el.style.setProperty('--text-h', h);
            el.style.setProperty('--text-s', '10%');
            el.style.setProperty('--text-l', `${textL}%`);

            el.style.setProperty('--accent-h', accentH);
            el.style.setProperty('--accent-s', '90%');
            el.style.setProperty('--accent-l', '60%');

            // Force background & text update matching HSL tokens
            el.style.background = 'hsl(var(--bg-h), var(--bg-s), var(--bg-l))';
            el.style.color = 'hsl(var(--text-h), var(--text-s), var(--text-l))';
            el.style.borderColor = 'hsl(var(--accent-h), var(--accent-s), var(--accent-l), 0.35)';

            // Sync inspector panel controls if controlsManager is present
            if (window.controlsManager) {
                window.controlsManager.syncActiveElementToInspector();
            }

            window.canvasEditor.updateSelectionBox();
            window.canvasEditor.triggerHistorySave();
        });
    }
});
