/* DesignCraft Main Application Coordinator
   Initializes the workspace, sets up toolbar bindings, manages global application
   states (tool selection, themes, baseline snaps), and handles undo/redo coordinator. */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Vector Icons
    lucide.createIcons();

    // 2. Toolbar Bindings (Insert Element Tools)
    const btnSelect = document.getElementById('tool-select');
    const btnText = document.getElementById('tool-text');
    const shapeOptions = document.querySelectorAll('.shape-option');
    const btnClear = document.getElementById('action-clear');
    
    let activeTool = 'select'; // select, text, shape

    const setActiveTool = (toolName, btnEl) => {
        activeTool = toolName;
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.removeAttribute('data-active');
        });
        if (btnEl) btnEl.setAttribute('data-active', 'true');
    };

    btnSelect.addEventListener('click', () => setActiveTool('select', btnSelect));
    
    btnText.addEventListener('click', () => {
        setActiveTool('select', btnSelect); // Keep selection pointer active
        window.canvasEditor.addText();
    });

    shapeOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            const shape = btn.dataset.shape;
            setActiveTool('select', btnSelect); // Keep selection active
            window.canvasEditor.addShape(shape);
        });
    });

    // 3. Toolbar Undo/Redo & Clear Actions
    const btnUndo = document.getElementById('action-undo');
    const btnRedo = document.getElementById('action-redo');

    btnUndo.addEventListener('click', () => {
        const currentSnapshot = window.canvasEditor.getSnapshot();
        const prevSnapshot = window.historyManager.undo(currentSnapshot);
        if (prevSnapshot !== null) {
            window.canvasEditor.loadSnapshot(prevSnapshot);
        }
    });

    btnRedo.addEventListener('click', () => {
        const currentSnapshot = window.canvasEditor.getSnapshot();
        const nextSnapshot = window.historyManager.redo(currentSnapshot);
        if (nextSnapshot !== null) {
            window.canvasEditor.loadSnapshot(nextSnapshot);
        }
    });

    btnClear.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear the canvas? All elements will be deleted.")) {
            // Remove all canvas element nodes
            const artboard = document.getElementById('paint-artboard');
            const elements = artboard.querySelectorAll('.canvas-element');
            elements.forEach(el => el.remove());
            
            window.canvasEditor.deselectAll();
            window.canvasEditor.updateElementsCount();
            window.canvasEditor.triggerHistorySave();
            
            if (window.controlsManager) {
                window.controlsManager.updateLayersList();
            }
        }
    });

    // 4. Dark & Light Theme Switcher
    const themeBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('designcraft_theme') || 'dark';

    if (currentTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    }

    themeBtn.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-theme');
        if (isDark) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            localStorage.setItem('designcraft_theme', 'light');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            localStorage.setItem('designcraft_theme', 'dark');
        }
    });

    // 5. Initialize Blank Baseline History Snapshot
    const baseline = window.canvasEditor.getSnapshot();
    window.historyManager.saveState(baseline);
    
    // Set up default canvas details
    window.canvasEditor.updateElementsCount();
    if (window.controlsManager) {
        window.controlsManager.updateLayersList();
    }

    // 6. Web Audio Soundscape Manager
    let audioCtx = null;
    let userHasInteracted = false;
    document.addEventListener('click', () => userHasInteracted = true, { once: true, capture: true });
    document.addEventListener('keydown', () => userHasInteracted = true, { once: true, capture: true });

    function playUISound(type) {
        if (!userHasInteracted) return;
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            const now = audioCtx.currentTime;
            
            if (type === 'click') {
                // Short organic pop sound: frequency sweep 350Hz -> 80Hz in 0.08s
                osc.frequency.setValueAtTime(350, now);
                osc.frequency.exponentialRampToValueAtTime(85, now + 0.08);
                gainNode.gain.setValueAtTime(0.15, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'hover') {
                // Ultra-short muted click: high frequency, decaying very quickly
                osc.frequency.setValueAtTime(1000, now);
                gainNode.gain.setValueAtTime(0.015, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                osc.start(now);
                osc.stop(now + 0.03);
            } else if (type === 'success') {
                // High-end soft double chime
                const osc2 = audioCtx.createOscillator();
                const gainNode2 = audioCtx.createGain();
                osc2.connect(gainNode2);
                gainNode2.connect(audioCtx.destination);
                
                // First note: C5 (523Hz)
                osc.frequency.setValueAtTime(523.25, now);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                
                // Second note: E5 (659Hz) delayed by 0.07s
                osc2.frequency.setValueAtTime(659.25, now + 0.07);
                gainNode2.gain.setValueAtTime(0.08, now + 0.07);
                gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 0.37);
                
                osc.start(now);
                osc.stop(now + 0.3);
                osc2.start(now + 0.07);
                osc2.stop(now + 0.37);
            }
        } catch (e) {
            console.warn("Audio Context blocked or unsupported", e);
        }
    }
    window.playUISound = playUISound;

    // Global sound triggers
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button, .tab-btn, .swatch-color, .swatch-gradient, .preset-card, .code-tab');
        if (target) {
            playUISound('click');
        }
    });

    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('button, .tab-btn, .swatch-color, .swatch-gradient, .preset-card, .code-tab');
        if (target && !target.dataset.hoverSoundPlayed) {
            playUISound('hover');
            // Prevent spamming hover sound on same session mouse moves
            target.dataset.hoverSoundPlayed = 'true';
            setTimeout(() => { target.removeAttribute('data-hover-sound-played'); }, 300);
        }
    });
});
