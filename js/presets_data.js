/* DesignCraft 50+ Stunning Style Presets Database
   Contains 54 premium presets categorized into 6 design systems.
   Applies HSL variables, baseline classes, and specific box-shadow / border rules. */

const PRESETS_DATABASE = {
    glass: [
        { id: "glass-frost-l", name: "Frosted Light", style: "glassmorphism", vars: { hue: 210, bgL: 95, textL: 12 }, css: { background: "rgba(255, 255, 255, 0.3)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.4)", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" } },
        { id: "glass-frost-d", name: "Obsidian Frost", style: "glassmorphism", vars: { hue: 240, bgL: 6, textL: 95 }, css: { background: "rgba(10, 10, 15, 0.45)", backdropFilter: "blur(18px)", border: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 12px 40px rgba(0,0,0,0.4)" } },
        { id: "glass-cobalt", name: "Cobalt Plate", style: "glassmorphism", vars: { hue: 220, bgL: 12, textL: 96 }, css: { background: "rgba(30, 41, 59, 0.5)", backdropFilter: "blur(14px)", border: "1px solid rgba(99, 102, 241, 0.25)", boxShadow: "0 8px 32px rgba(30,41,59,0.3)" } },
        { id: "glass-emerald", name: "Emerald Glare", style: "glassmorphism", vars: { hue: 150, bgL: 8, textL: 94 }, css: { background: "rgba(6, 78, 59, 0.35)", backdropFilter: "blur(15px)", border: "1px solid rgba(16, 185, 129, 0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" } },
        { id: "glass-sunset", name: "Sunset Aura", style: "glassmorphism", vars: { hue: 18, bgL: 9, textL: 97 }, css: { background: "rgba(124, 45, 18, 0.3)", backdropFilter: "blur(16px)", border: "1px solid rgba(251, 146, 60, 0.3)", boxShadow: "0 10px 30px rgba(251,146,60,0.1)" } },
        { id: "glass-golden", name: "Royal Amber", style: "glassmorphism", vars: { hue: 45, bgL: 8, textL: 95 }, css: { background: "rgba(251, 191, 36, 0.08)", backdropFilter: "blur(20px)", border: "1px solid rgba(251, 191, 36, 0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" } },
        { id: "glass-matrix", name: "Matrix Veil", style: "glassmorphism", vars: { hue: 120, bgL: 4, textL: 95 }, css: { background: "rgba(0, 20, 0, 0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(0, 255, 0, 0.2)", boxShadow: "0 8px 24px rgba(0,255,0,0.1)" } },
        { id: "glass-neon-p", name: "Cyber Blossom", style: "glassmorphism", vars: { hue: 320, bgL: 6, textL: 97 }, css: { background: "rgba(255, 0, 128, 0.08)", backdropFilter: "blur(16px)", border: "1px solid rgba(255, 0, 128, 0.3)", boxShadow: "0 8px 32px rgba(255,0,128,0.15)" } },
        { id: "glass-deep", name: "Vortex Blur", style: "glassmorphism", vars: { hue: 260, bgL: 5, textL: 95 }, css: { background: "rgba(20, 10, 35, 0.5)", backdropFilter: "blur(28px)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 15px 50px rgba(0,0,0,0.5)" } }
    ],
    neumorphic: [
        { id: "neu-light-emb", name: "Soft Embossed", style: "neumorphic-light", vars: { hue: 210, bgL: 93, textL: 15 }, css: { background: "#edf2f7", border: "none", boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff" } },
        { id: "neu-light-deb", name: "Soft Debossed", style: "neumorphic-light", vars: { hue: 210, bgL: 93, textL: 15 }, css: { background: "#edf2f7", border: "none", boxShadow: "inset 6px 6px 12px #d1d9e6, inset -6px -6px 12px #ffffff" } },
        { id: "neu-dark-emb", name: "Dark Embossed", style: "neumorphic-dark", vars: { hue: 230, bgL: 10, textL: 92 }, css: { background: "#1a1a24", border: "none", boxShadow: "6px 6px 12px #0c0c11, -6px -6px 12px #282837" } },
        { id: "neu-dark-deb", name: "Dark Debossed", style: "neumorphic-dark", vars: { hue: 230, bgL: 10, textL: 92 }, css: { background: "#1a1a24", border: "none", boxShadow: "inset 6px 6px 12px #0c0c11, inset -6px -6px 12px #282837" } },
        { id: "neu-clay-b", name: "Clay Blue", style: "neumorphic-light", vars: { hue: 210, bgL: 85, textL: 12 }, css: { background: "#c3dafe", border: "none", borderRadius: "24px", boxShadow: "8px 8px 16px #a5bdf0, -8px -8px 16px #e1f7ff, inset 2px 2px 4px #ffffff, inset -2px -2px 4px rgba(0,0,0,0.1)" } },
        { id: "neu-clay-p", name: "Clay Peach", style: "neumorphic-light", vars: { hue: 20, bgL: 90, textL: 15 }, css: { background: "#fed7d7", border: "none", borderRadius: "24px", boxShadow: "8px 8px 16px #d9b5b5, -8px -8px 16px #ffffff, inset 2px 2px 4px #ffffff, inset -2px -2px 4px rgba(0,0,0,0.08)" } },
        { id: "neu-steel", name: "Sleek Steel", style: "neumorphic-dark", vars: { hue: 220, bgL: 14, textL: 94 }, css: { background: "linear-gradient(145deg, #252532, #1f1f2a)", border: "none", boxShadow: "5px 5px 15px #0f0f15, -5px -5px 15px #2f2f3f" } },
        { id: "neu-cushion", name: "Cushion Pill", style: "neumorphic-light", vars: { hue: 240, bgL: 96, textL: 12 }, css: { background: "#f8fafc", border: "none", borderRadius: "30px", boxShadow: "8px 8px 20px #e2e8f0, -8px -8px 20px #ffffff" } },
        { id: "neu-velvet", name: "Royal Velvet", style: "neumorphic-dark", vars: { hue: 280, bgL: 8, textL: 93 }, css: { background: "#160f20", border: "none", boxShadow: "6px 6px 12px #0a070e, -6px -6px 12px #221732" } }
    ],
    cyber: [
        { id: "cyb-cyan", name: "Neon Cyan Grid", style: "cyberpunk", vars: { hue: 180, bgL: 0, textL: 100 }, css: { background: "#000000", border: "2px solid #00f0ff", boxShadow: "0 0 15px rgba(0,240,255,0.4), inset 0 0 8px rgba(0,240,255,0.2)" } },
        { id: "cyb-matrix", name: "Green Code", style: "cyberpunk", vars: { hue: 120, bgL: 0, textL: 95 }, css: { background: "#000000", border: "2px solid #39ff14", fontFamily: "'Fira Code', monospace", boxShadow: "0 0 12px rgba(57,255,20,0.4)" } },
        { id: "cyb-tokyo", name: "Tokyo Neon", style: "cyberpunk", vars: { hue: 320, bgL: 2, textL: 98 }, css: { background: "#050008", border: "2px solid #ff00f0", boxShadow: "0 0 15px rgba(255,0,240,0.5), 0 0 5px #00f0ff" } },
        { id: "cyb-toxic", name: "Radioactive Lime", style: "cyberpunk", vars: { hue: 85, bgL: 1, textL: 96 }, css: { background: "#020400", border: "2px solid #adff2f", boxShadow: "0 0 14px rgba(173,255,47,0.45)" } },
        { id: "cyb-mars", name: "Deep Space Red", style: "cyberpunk", vars: { hue: 0, bgL: 0, textL: 95 }, css: { background: "#000000", border: "2px solid #ef4444", boxShadow: "0 0 15px rgba(239,68,68,0.5), inset 0 0 6px rgba(239,68,68,0.2)" } },
        { id: "cyb-hud", name: "Retro Amber HUD", style: "cyberpunk", vars: { hue: 35, bgL: 3, textL: 95 }, css: { background: "#0a0600", border: "2px solid #f59e0b", fontFamily: "'Fira Code', monospace", boxShadow: "0 0 10px rgba(245,158,11,0.4)" } },
        { id: "cyb-quantum", name: "Quantum Blue", style: "cyberpunk", vars: { hue: 200, bgL: 0, textL: 97 }, css: { background: "#000005", border: "2px solid #3b82f6", boxShadow: "0 0 20px rgba(59,130,246,0.6)" } },
        { id: "cyb-voltage", name: "Volt Lavender", style: "cyberpunk", vars: { hue: 270, bgL: 2, textL: 98 }, css: { background: "#040108", border: "2px solid #8b5cf6", boxShadow: "0 0 14px rgba(139,92,246,0.5), inset 0 0 10px rgba(139,92,246,0.2)" } },
        { id: "cyb-sun", name: "Solar Flare", style: "cyberpunk", vars: { hue: 22, bgL: 0, textL: 95 }, css: { background: "#000000", border: "2px solid #f97316", boxShadow: "0 0 16px rgba(249,115,22,0.5)" } }
    ],
    minimal: [
        { id: "min-charcoal", name: "Slate Charcoal", style: "minimal-dark", vars: { hue: 220, bgL: 6, textL: 95 }, css: { background: "#0b0b0d", border: "1px solid #1e1e24", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" } },
        { id: "min-obsidian", name: "Deep Obsidian", style: "minimal-dark", vars: { hue: 240, bgL: 3, textL: 97 }, css: { background: "#050507", border: "1px solid #131317", borderRadius: "16px" } },
        { id: "min-jet", name: "Void Black", style: "minimal-dark", vars: { hue: 0, bgL: 0, textL: 98 }, css: { background: "#000000", border: "1px solid #111111", borderRadius: "8px" } },
        { id: "min-ash", name: "Cool Ash", style: "minimal-dark", vars: { hue: 210, bgL: 12, textL: 94 }, css: { background: "#1f2937", border: "1px solid #374151", borderRadius: "10px" } },
        { id: "min-sand", name: "Warm Sand Light", style: "minimal-dark", vars: { hue: 35, bgL: 94, textL: 12 }, css: { background: "#fdfbf7", border: "1px solid #e7e2d8", borderRadius: "14px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" } },
        { id: "min-white", name: "Matte White", style: "minimal-dark", vars: { hue: 240, bgL: 98, textL: 10 }, css: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 8px 24px rgba(148,163,184,0.08)" } },
        { id: "min-space", name: "Silent Space", style: "minimal-dark", vars: { hue: 230, bgL: 8, textL: 95 }, css: { background: "#111827", border: "1px solid #1f2937", borderRadius: "20px" } },
        { id: "min-alpine", name: "Alpine Grey", style: "minimal-dark", vars: { hue: 200, bgL: 90, textL: 15 }, css: { background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "12px" } },
        { id: "min-steel", name: "Industrial Steel", style: "minimal-dark", vars: { hue: 210, bgL: 15, textL: 96 }, css: { background: "#1e293b", border: "1px solid #475569", borderRadius: "6px" } }
    ],
    aura: [
        { id: "aur-nebula", name: "Cosmic Nebula", style: "minimal-dark", vars: { hue: 275, bgL: 8, textL: 97 }, css: { background: "radial-gradient(circle at 0% 0%, rgba(139,92,246,0.3) 0%, transparent 60%), radial-gradient(circle at 100% 100%, rgba(236,72,153,0.3) 0%, transparent 50%), #0d0d11", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px" } },
        { id: "aur-twilight", name: "Twilight Glow", style: "minimal-dark", vars: { hue: 290, bgL: 9, textL: 96 }, css: { background: "radial-gradient(circle at 10% 20%, rgba(124,58,237,0.2) 0%, transparent 70%), radial-gradient(circle at 90% 80%, rgba(79,70,229,0.25) 0%, transparent 60%), #09090e", border: "1px solid rgba(139,92,246,0.2)" } },
        { id: "aur-bubblegum", name: "Bubblegum Sky", style: "minimal-dark", vars: { hue: 330, bgL: 10, textL: 98 }, css: { background: "radial-gradient(circle at 100% 0%, rgba(244,114,182,0.25) 0%, transparent 70%), radial-gradient(circle at 0% 100%, rgba(96,165,250,0.25) 0%, transparent 70%), #0f0f15" } },
        { id: "aur-eclipse", name: "Solar Eclipse", style: "minimal-dark", vars: { hue: 20, bgL: 6, textL: 95 }, css: { background: "radial-gradient(circle at 50% -20%, rgba(249,115,22,0.25) 0%, transparent 80%), #07070a", border: "1px solid rgba(249,115,22,0.15)" } },
        { id: "aur-emerald", name: "Emerald Ray", style: "minimal-dark", vars: { hue: 155, bgL: 7, textL: 94 }, css: { background: "radial-gradient(circle at 80% 20%, rgba(52,211,153,0.2) 0%, transparent 60%), #050806", border: "1px solid rgba(52,211,153,0.12)" } },
        { id: "aur-ocean", name: "Neon Ocean", style: "minimal-dark", vars: { hue: 195, bgL: 8, textL: 96 }, css: { background: "radial-gradient(circle at 0% 100%, rgba(6,182,212,0.22) 0%, transparent 60%), radial-gradient(circle at 100% 0%, rgba(59,130,246,0.22) 0%, transparent 60%), #0b0f19" } },
        { id: "aur-lavender", name: "Electric Mint", style: "minimal-dark", vars: { hue: 250, bgL: 9, textL: 97 }, css: { background: "radial-gradient(circle at 20% 30%, rgba(99,102,241,0.22) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.22) 0%, transparent 50%), #0d0d12" } },
        { id: "aur-infrared", name: "Infrared Ray", style: "minimal-dark", vars: { hue: 350, bgL: 7, textL: 95 }, css: { background: "radial-gradient(circle at 50% 50%, rgba(239,68,68,0.18) 0%, transparent 70%), #090505" } },
        { id: "aur-horizon", name: "Golden Horizon", style: "minimal-dark", vars: { hue: 40, bgL: 9, textL: 96 }, css: { background: "radial-gradient(circle at 50% 120%, rgba(245,158,11,0.25) 0%, transparent 70%), #0f0d0a" } }
    ],
    brutalist: [
        { id: "brut-yellow", name: "Brutal Comic", style: "neo-brutalism", vars: { hue: 45, bgL: 68, textL: 5 }, css: { backgroundColor: "#fef08a", border: "4px solid #000000", borderRadius: "0px", boxShadow: "6px 6px 0px #000000" } },
        { id: "brut-purple", name: "Toxic Comic", style: "neo-brutalism", vars: { hue: 280, bgL: 65, textL: 5 }, css: { backgroundColor: "#d8b4fe", border: "4px solid #000000", borderRadius: "0px", boxShadow: "6px 6px 0px #000000" } },
        { id: "brut-orange", name: "Tangerine", style: "neo-brutalism", vars: { hue: 24, bgL: 60, textL: 5 }, css: { backgroundColor: "#fdba74", border: "4px solid #000000", borderRadius: "0px", boxShadow: "6px 6px 0px #000000" } },
        { id: "brut-pink", name: "Punk Rock", style: "neo-brutalism", vars: { hue: 330, bgL: 65, textL: 5 }, css: { backgroundColor: "#fbcfe8", border: "4px solid #000000", borderRadius: "0px", boxShadow: "6px 6px 0px #000000" } },
        { id: "brut-blue", name: "Heavy Contrast", style: "neo-brutalism", vars: { hue: 200, bgL: 55, textL: 100 }, css: { backgroundColor: "#3b82f6", border: "4px solid #000000", borderRadius: "0px", boxShadow: "6px 6px 0px #000000" } },
        { id: "brut-retro", name: "Gameboy Green", style: "neo-brutalism", vars: { hue: 90, bgL: 45, textL: 5 }, css: { backgroundColor: "#8bab1c", border: "3px solid #000000", borderRadius: "4px", boxShadow: "4px 4px 0px #000000" } },
        { id: "brut-newspaper", name: "Cream Paper", style: "neo-brutalism", vars: { hue: 40, bgL: 92, textL: 8 }, css: { backgroundColor: "#fafaf6", border: "3px solid #000000", borderRadius: "0px", boxShadow: "5px 5px 0px #000000" } },
        { id: "brut-bauhaus", name: "Bauhaus Red", style: "neo-brutalism", vars: { hue: 0, bgL: 50, textL: 100 }, css: { backgroundColor: "#dc2626", border: "4px solid #000000", borderRadius: "0px", boxShadow: "6px 6px 0px #000000" } },
        { id: "brut-aqua", name: "Cyan Pop", style: "neo-brutalism", vars: { hue: 180, bgL: 60, textL: 5 }, css: { backgroundColor: "#67e8f9", border: "4px solid #000000", borderRadius: "0px", boxShadow: "6px 6px 0px #000000" } }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    const presetTabs = document.getElementById('preset-category-tabs');
    const presetsGrid = document.getElementById('presets-dynamic-grid');

    if (!presetTabs || !presetsGrid) return;

    // Render presets of a specific category
    function renderPresets(category) {
        presetsGrid.innerHTML = '';
        const list = PRESETS_DATABASE[category] || [];

        list.forEach(p => {
            const btn = document.createElement('button');
            btn.className = 'preset-card';
            btn.dataset.presetId = p.id;
            btn.title = p.name;

            // Generate a style preview string for the mini swatch
            let styleStr = '';
            for (const [k, v] of Object.entries(p.css)) {
                // Convert camelCase style to kebab-case
                const kebabKey = k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
                styleStr += `${kebabKey}: ${v}; `;
            }

            // Create circular swatch preview
            btn.innerHTML = `
                <div class="preview-swatch" style="${styleStr} border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; overflow: hidden; height: 32px; width: 100%; border: 1px solid var(--panel-border);"></div>
                <span style="font-size: 9px; font-weight: 500; margin-top: 4px; display: block; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; width: 100%; text-align: center;">${p.name}</span>
            `;

            btn?.addEventListener('click', () => {
                applyPresetToSelection(p);
            });

            presetsGrid.appendChild(btn);
        });
    }

    // Apply selected preset tokens to current canvas element
    function applyPresetToSelection(preset) {
        const el = window.canvasEditor?.selectedElement;
        if (!el) {
            alert("Select an element on the canvas first to apply this preset style!");
            return;
        }

        // 1. Remove all old trend preset classes
        el.classList.remove('preset-glassmorphism', 'preset-minimal-dark', 'preset-cyberpunk', 'preset-neo-brutalism');
        
        // 2. Add new preset trend class
        el.classList.add(`preset-${preset.style}`);

        // 3. Reset standard inline background / border style overrides
        el.style.background = '';
        el.style.backgroundColor = '';
        el.style.border = '';
        el.style.boxShadow = '';
        el.style.backdropFilter = '';
        el.style.borderRadius = '';
        el.style.fontFamily = '';

        // 4. Inject specific preset styles
        for (const [k, v] of Object.entries(preset.css)) {
            el.style[k] = v;
        }

        // 5. Inject HSL Variable overrides
        el.style.setProperty('--hue', preset.vars.hue);
        el.style.setProperty('--bg-h', preset.vars.hue);
        el.style.setProperty('--bg-s', '15%');
        el.style.setProperty('--bg-l', `${preset.vars.bgL}%`);
        
        el.style.setProperty('--text-h', preset.vars.hue);
        el.style.setProperty('--text-s', '10%');
        el.style.setProperty('--text-l', `${preset.vars.textL}%`);

        el.style.setProperty('--accent-h', preset.vars.hue);
        el.style.setProperty('--accent-s', '90%');
        el.style.setProperty('--accent-l', '60%');

        // Sync inspector panel controls
        if (window.controlsManager) {
            window.controlsManager.syncActiveElementToInspector();
        }

        window.canvasEditor.updateSelectionBox();
        window.canvasEditor.triggerHistorySave();
    }

    // Tab clicks event delegation
    presetTabs?.addEventListener('click', (e) => {
        const tab = e.target.closest('.preset-cat-btn');
        if (!tab) return;

        // Clear active classes
        presetTabs.querySelectorAll('.preset-cat-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Set active
        tab.classList.add('active');

        // Render presets
        const cat = tab.dataset.cat;
        renderPresets(cat);
    });

    // Render default Glass category on start
    renderPresets('glass');
});
