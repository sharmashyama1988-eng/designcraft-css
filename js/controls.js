/* DesignCraft Property Inspector & Panel Controls
   Manages tab navigation, links HTML input controls to canvas elements, 
   manages layers panel, color swatches, animations, and preset styles. */

class ControlsManager {
    constructor() {
        this.activeElement = null;
        this.initTabs();
        this.initInspectorListeners();
        this.initPresetListeners();
        this.initSwatchListeners();
    }

    // Tab switcher layout
    initTabs() {
        // Main tabs
        document.querySelectorAll('.sidebar-tabs')?.forEach(container => {
            container?.addEventListener('click', (e) => {
                const btn = e.target.closest('.tab-btn');
                if (!btn) return;
                
                const tabGroup = btn.parentElement;
                const tabId = btn.dataset.tab;
                
                // Active button toggle
                tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Content toggle
                const tabContents = tabGroup.nextElementSibling;
                tabContents.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.toggle('active', content.id === tabId);
                });
            });
        });

        // Color categories selector
        document.querySelectorAll('.swatches-tabs')?.forEach(container => {
            container?.addEventListener('click', (e) => {
                const btn = e.target.closest('.swatch-tab-btn');
                if (!btn) return;
                
                const group = btn.parentElement;
                group.querySelectorAll('.swatch-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const cat = btn.dataset.swatchCat;
                document.getElementById('swatches-solid')?.classList.toggle('active', cat === 'solid');
                document.getElementById('swatches-gradient')?.classList.toggle('active', cat === 'gradient');
            });
        });
    }

    // Sync input controls with selected element styles
    syncInspector(el) {
        this.activeElement = el;
        
        const noSelMsg = document.getElementById('editor-no-selection');
        const controls = document.getElementById('editor-controls');
        
        if (!el) {
            noSelMsg.classList.remove('hidden');
            controls.classList.add('hidden');
            return;
        }
        
        noSelMsg.classList.add('hidden');
        controls.classList.remove('hidden');
        
        // 1. Dimensions
        if (document.getElementById('prop-width')) document.getElementById('prop-width').value = parseInt(el.style.width) || 100;
        if (document.getElementById('prop-height')) document.getElementById('prop-height').value = parseInt(el.style.height) || 100;
        
        // 2. Typography display (Only toggle visible for Text element)
        const typoSection = document.getElementById('section-typography');
        const isText = el.classList.contains('text-element');
        typoSection.classList.toggle('hidden', !isText);
        
        if (isText) {
            // Typography values
            const family = el.style.fontFamily || "'Outfit', sans-serif";
            if (document.getElementById('prop-font-family')) document.getElementById('prop-font-family').value = family.replace(/"/g, "'");
            if (document.getElementById('prop-font-size')) document.getElementById('prop-font-size').value = parseInt(el.style.fontSize) || 16;
            if (document.getElementById('prop-font-weight')) document.getElementById('prop-font-weight').value = el.style.fontWeight || "400";
            
            const textColor = el.style.color || "#ffffff";
            const hexColor = this.rgbToHex(textColor) || "#ffffff";
            if (document.getElementById('prop-text-color')) document.getElementById('prop-text-color').value = hexColor;
            if (document.getElementById('prop-text-color-hex')) document.getElementById('prop-text-color-hex').value = hexColor;
            
            if (document.getElementById('prop-text-align')) document.getElementById('prop-text-align').value = el.style.textAlign || "left";
        }
        
        // 3. Background type
        const bg = el.style.background || el.style.backgroundColor || "";
        const bgTypeInput = document.getElementById('prop-bg-type');
        
        if (bg.includes('gradient')) {
            bgTypeInput.value = 'gradient';
            document.getElementById('bg-color-control')?.classList.add('hidden');
            document.getElementById('bg-gradient-control')?.classList.remove('hidden');
            
            // Parse linear-gradient details
            const angleMatch = bg.match(/(\d+)deg/);
            if (angleMatch) if (document.getElementById('prop-grad-angle')) document.getElementById('prop-grad-angle').value = angleMatch[1];
            
            const colorsMatch = bg.match(/#[0-9a-fA-F]{6}|rgba?\([^)]+\)/g);
            if (colorsMatch && colorsMatch.length >= 2) {
                if (document.getElementById('prop-grad-color1')) document.getElementById('prop-grad-color1').value = this.rgbToHex(colorsMatch[0]);
                if (document.getElementById('prop-grad-color2')) document.getElementById('prop-grad-color2').value = this.rgbToHex(colorsMatch[1]);
            }
        } else if (bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
            bgTypeInput.value = 'transparent';
            document.getElementById('bg-color-control')?.classList.add('hidden');
            document.getElementById('bg-gradient-control')?.classList.add('hidden');
        } else {
            bgTypeInput.value = 'color';
            document.getElementById('bg-color-control')?.classList.remove('hidden');
            document.getElementById('bg-gradient-control')?.classList.add('hidden');
            
            const baseColor = el.style.backgroundColor || "#6366f1";
            const hex = this.rgbToHex(baseColor) || "#6366f1";
            if (document.getElementById('prop-bg-color')) document.getElementById('prop-bg-color').value = hex;
            if (document.getElementById('prop-bg-color-hex')) document.getElementById('prop-bg-color-hex').value = hex;
            
            // Opacity slider
            const rgba = baseColor.match(/rgba?\(.*?,\s*.*?,.*?,\s*(.*?)\)/);
            if (document.getElementById('prop-bg-opacity')) document.getElementById('prop-bg-opacity').value = rgba ? parseFloat(rgba[1]) : 1.0;
        }
        
        // 4. Corners & Borders
        const radius = parseInt(el.style.borderRadius) || 0;
        if (document.getElementById('prop-border-radius')) document.getElementById('prop-border-radius').value = radius;
        document.getElementById('radius-val').innerText = radius;
        
        const borderWidth = parseInt(el.style.borderWidth) || 0;
        if (document.getElementById('prop-border-width')) document.getElementById('prop-border-width').value = borderWidth;
        if (document.getElementById('prop-border-style')) document.getElementById('prop-border-style').value = el.style.borderStyle || "none";
        
        const bColor = el.style.borderColor || "#000000";
        const bColorHex = this.rgbToHex(bColor) || "#000000";
        if (document.getElementById('prop-border-color')) document.getElementById('prop-border-color').value = bColorHex;
        if (document.getElementById('prop-border-color-hex')) document.getElementById('prop-border-color-hex').value = bColorHex;
        
        // 5. Shadows
        const shadow = el.style.boxShadow || "none";
        const shadowEnable = document.getElementById('prop-shadow-enable');
        const shadowGroup = document.getElementById('shadow-properties-container');
        
        if (shadow !== "none" && shadow !== "") {
            shadowEnable.checked = true;
            shadowGroup.classList.remove('disabled-group');
            
            // Parse shadow details (very simple parser)
            const inset = shadow.includes('inset');
            if (document.getElementById('prop-shadow-inset')) document.getElementById('prop-shadow-inset').checked = inset;
            
            const cleanShadow = shadow.replace('inset', '').trim();
            // Match digits
            const digits = cleanShadow.match(/-?\d+px/g);
            if (digits && digits.length >= 3) {
                if (document.getElementById('prop-shadow-x')) document.getElementById('prop-shadow-x').value = parseInt(digits[0]);
                if (document.getElementById('prop-shadow-y')) document.getElementById('prop-shadow-y').value = parseInt(digits[1]);
                if (document.getElementById('prop-shadow-blur')) document.getElementById('prop-shadow-blur').value = parseInt(digits[2]);
                if (digits[3]) if (document.getElementById('prop-shadow-spread')) document.getElementById('prop-shadow-spread').value = parseInt(digits[3]);
            }
            
            // Match color
            const colorMatch = cleanShadow.match(/#[0-9a-fA-F]{6}|rgba?\([^)]+\)/);
            if (colorMatch) {
                if (document.getElementById('prop-shadow-color')) document.getElementById('prop-shadow-color').value = this.rgbToHex(colorMatch[0]);
            }
        } else {
            shadowEnable.checked = false;
            shadowGroup.classList.add('disabled-group');
        }
        
        // 6. Transforms
        const transform = el.style.transform || "";
        let rotateVal = 0;
        let scaleVal = 1;
        let skewVal = 0;
        
        const rMatch = transform.match(/rotate\((\d+)deg\)/);
        if (rMatch) rotateVal = parseInt(rMatch[1]);
        
        const sMatch = transform.match(/scale\((.*?)\)/);
        if (sMatch) scaleVal = parseFloat(sMatch[1]);
        
        const skMatch = transform.match(/skewX\((\d+)deg\)/);
        if (skMatch) skewVal = parseInt(skMatch[1]);
        
        if (document.getElementById('prop-rotate')) document.getElementById('prop-rotate').value = rotateVal;
        document.getElementById('rotate-val').innerText = rotateVal;
        if (document.getElementById('prop-scale')) document.getElementById('prop-scale').value = scaleVal;
        if (document.getElementById('prop-skew-x')) document.getElementById('prop-skew-x').value = skewVal;
        
        // 7. Filters & Effects
        const filter = el.style.filter || "";
        let blurVal = 0;
        let brightVal = 100;
        
        const bMatch = filter.match(/blur\((\d+)px\)/);
        if (bMatch) blurVal = parseInt(bMatch[1]);
        
        const brMatch = filter.match(/brightness\((\d+)%\)/);
        if (brMatch) brightVal = parseInt(brMatch[1]);
        
        if (document.getElementById('prop-filter-blur')) document.getElementById('prop-filter-blur').value = blurVal;
        if (document.getElementById('prop-filter-brightness')) document.getElementById('prop-filter-brightness').value = brightVal;
        
        // Backdrop filter
        const backdrop = el.style.backdropFilter || el.style.webkitBackdropFilter || "";
        let backdropBlur = 0;
        const bdMatch = backdrop.match(/blur\((\d+)px\)/);
        if (bdMatch) backdropBlur = parseInt(bdMatch[1]);
        if (document.getElementById('prop-backdrop-blur')) document.getElementById('prop-backdrop-blur').value = backdropBlur;
        
        // 8. Animation values sync
        let currentAnimType = 'none';
        let animDuration = 2;
        let animInfinite = true;
        
        // Check animation classes
        el.classList.forEach(className => {
            if (className.startsWith('anim-')) {
                currentAnimType = className.replace('anim-', '');
            }
        });
        
        if (el.style.animationDuration) {
            animDuration = parseFloat(el.style.animationDuration) || 2;
        }
        if (el.style.animationIterationCount === '1') {
            animInfinite = false;
        }
        
        if (document.getElementById('prop-animation-type')) document.getElementById('prop-animation-type').value = currentAnimType;
        if (document.getElementById('prop-anim-duration')) document.getElementById('prop-anim-duration').value = animDuration;
        if (document.getElementById('prop-anim-infinite')) document.getElementById('prop-anim-infinite').checked = animInfinite;
        
        // --- NEW 50+ PROPERTIES SYNC ---
        // Spacing
        ['mt', 'mb', 'ml', 'mr', 'pt', 'pb', 'pl', 'pr'].forEach(prop => {
            const map = { mt:'marginTop', mb:'marginBottom', ml:'marginLeft', mr:'marginRight', pt:'paddingTop', pb:'paddingBottom', pl:'paddingLeft', pr:'paddingRight' };
            const val = parseInt(el.style[map[prop]]) || 0;
            const input = document.getElementById(`prop-${prop}`);
            if(input) input.value = val;
        });
        
        // Layout & Flexbox
        const display = el.style.display || 'block';
        const displayInput = document.getElementById('prop-display');
        if (displayInput) displayInput.value = display;
        const flexControls = document.getElementById('flexbox-controls');
        if (flexControls) flexControls.classList.toggle('hidden', display !== 'flex' && display !== 'inline-flex');
        
        ['flex-direction', 'flex-wrap', 'justify-content', 'align-items'].forEach(prop => {
            const camel = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
            const val = el.style[camel] || '';
            const input = document.getElementById(`prop-${prop}`);
            if(input && val) input.value = val;
        });
        const gapInput = document.getElementById('prop-gap');
        if (gapInput) gapInput.value = parseInt(el.style.gap) || 0;

        // Position
        const posInput = document.getElementById('prop-position');
        if (posInput) posInput.value = el.style.position || 'static';
        ['top', 'bottom', 'left', 'right'].forEach(prop => {
            const val = el.style[prop] || '';
            const input = document.getElementById(`prop-${prop}`);
            if (input) input.value = val.replace('px', '');
        });
        const zIndexInput = document.getElementById('prop-z-index');
        if (zIndexInput) zIndexInput.value = el.style.zIndex || '';

        // Advanced CSS
        const opacityInput = document.getElementById('prop-opacity');
        if (opacityInput) opacityInput.value = el.style.opacity !== '' ? el.style.opacity : '1';
        
        ['mix-blend-mode', 'cursor', 'pointer-events', 'overflow'].forEach(prop => {
            const camel = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
            const val = el.style[camel] || (prop==='pointer-events'||prop==='cursor'?'auto':(prop==='mix-blend-mode'?'normal':'visible'));
            const input = document.getElementById(`prop-${prop}`);
            if(input) input.value = val;
        });

        // Text Effects
        if (isText) {
            document.getElementById('section-text-effects')?.classList.remove('hidden');
            const ls = el.style.letterSpacing || 'normal';
            const lh = el.style.lineHeight || 'normal';
            const tt = el.style.textTransform || 'none';
            const td = el.style.textDecoration || 'none';
            if (document.getElementById('prop-letter-spacing')) if (document.getElementById('prop-letter-spacing')) document.getElementById('prop-letter-spacing').value = ls;
            if (document.getElementById('prop-line-height')) if (document.getElementById('prop-line-height')) document.getElementById('prop-line-height').value = lh;
            if (document.getElementById('prop-text-transform')) if (document.getElementById('prop-text-transform')) document.getElementById('prop-text-transform').value = tt;
            if (document.getElementById('prop-text-decoration')) if (document.getElementById('prop-text-decoration')) document.getElementById('prop-text-decoration').value = td;
        } else {
            document.getElementById('section-text-effects')?.classList.add('hidden');
        }

        // Filters extra
        let contrastVal = 100, saturateVal = 100, grayscaleVal = 0, hueRotateVal = 0;
        const contMatch = filter.match(/contrast\((\d+)%\)/); if (contMatch) contrastVal = parseInt(contMatch[1]);
        const satMatch = filter.match(/saturate\((\d+)%\)/); if (satMatch) saturateVal = parseInt(satMatch[1]);
        const grayMatch = filter.match(/grayscale\((\d+)%\)/); if (grayMatch) grayscaleVal = parseInt(grayMatch[1]);
        const hueMatch = filter.match(/hue-rotate\((\d+)deg\)/); if (hueMatch) hueRotateVal = parseInt(hueMatch[1]);
        
        if (document.getElementById('prop-filter-contrast')) if (document.getElementById('prop-filter-contrast')) document.getElementById('prop-filter-contrast').value = contrastVal;
        if (document.getElementById('prop-filter-saturate')) if (document.getElementById('prop-filter-saturate')) document.getElementById('prop-filter-saturate').value = saturateVal;
        if (document.getElementById('prop-filter-grayscale')) if (document.getElementById('prop-filter-grayscale')) document.getElementById('prop-filter-grayscale').value = grayscaleVal;
        if (document.getElementById('prop-filter-hue-rotate')) if (document.getElementById('prop-filter-hue-rotate')) document.getElementById('prop-filter-hue-rotate').value = hueRotateVal;
        
        // Backdrop Brightness
        let bdBright = 100;
        const bdBrMatch = backdrop.match(/brightness\((\d+)%\)/);
        if (bdBrMatch) bdBright = parseInt(bdBrMatch[1]);
        if (document.getElementById('prop-backdrop-brightness')) if (document.getElementById('prop-backdrop-brightness')) document.getElementById('prop-backdrop-brightness').value = bdBright;

        // Transitions
        const transProp = el.style.transitionProperty || 'all';
        const transDur = parseFloat(el.style.transitionDuration) || 0.3;
        const transTime = el.style.transitionTimingFunction || 'ease';
        
        if (document.getElementById('prop-transition-property')) if (document.getElementById('prop-transition-property')) document.getElementById('prop-transition-property').value = transProp;
        if (document.getElementById('prop-transition-duration')) if (document.getElementById('prop-transition-duration')) document.getElementById('prop-transition-duration').value = transDur;
        if (document.getElementById('prop-transition-timing')) if (document.getElementById('prop-transition-timing')) document.getElementById('prop-transition-timing').value = transTime;
    }

    // Set up inspector input handlers
    initInspectorListeners() {
        const updateStyle = (styleProp, value, historySave = false) => {
            if (!this.activeElement) return;
            this.activeElement.style[styleProp] = value;
            window.canvasEditor.updateSelectionBox();
            
            if (historySave) {
                window.canvasEditor.triggerHistorySave();
            }
        };

        // Dimensions
        document.getElementById('prop-width')?.addEventListener('input', (e) => {
            updateStyle('width', `${e.target.value}px`);
        });
        document.getElementById('prop-width')?.addEventListener('change', () => {
            window.canvasEditor.triggerHistorySave();
        });
        
        document.getElementById('prop-height')?.addEventListener('input', (e) => {
            updateStyle('height', `${e.target.value}px`);
        });
        document.getElementById('prop-height')?.addEventListener('change', () => {
            window.canvasEditor.triggerHistorySave();
        });

        // Typography
        document.getElementById('prop-font-family')?.addEventListener('change', (e) => {
            updateStyle('fontFamily', e.target.value, true);
        });
        document.getElementById('prop-font-size')?.addEventListener('input', (e) => {
            updateStyle('fontSize', `${e.target.value}px`);
        });
        document.getElementById('prop-font-size')?.addEventListener('change', () => {
            window.canvasEditor.triggerHistorySave();
        });
        document.getElementById('prop-font-weight')?.addEventListener('change', (e) => {
            updateStyle('fontWeight', e.target.value, true);
        });
        document.getElementById('prop-text-align')?.addEventListener('change', (e) => {
            updateStyle('textAlign', e.target.value, true);
        });

        // Text Colors sync
        const textColor = document.getElementById('prop-text-color');
        const textColorHex = document.getElementById('prop-text-color-hex');
        
        textColor?.addEventListener('input', (e) => {
            textColorHex.value = e.target.value;
            updateStyle('color', e.target.value);
        });
        textColor?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        textColorHex?.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                textColor.value = e.target.value;
                updateStyle('color', e.target.value, true);
            }
        });

        // Background type changes
        const bgType = document.getElementById('prop-bg-type');
        bgType?.addEventListener('change', (e) => {
            const type = e.target.value;
            document.getElementById('bg-color-control')?.classList.toggle('hidden', type !== 'color');
            document.getElementById('bg-gradient-control')?.classList.toggle('hidden', type !== 'gradient');
            
            if (type === 'transparent') {
                updateStyle('background', 'transparent', true);
            } else if (type === 'color') {
                const color = document.getElementById('prop-bg-color')?.value;
                const opacity = document.getElementById('prop-bg-opacity')?.value;
                updateStyle('background', this.hexToRgba(color, opacity), true);
            } else if (type === 'gradient') {
                this.applyGradientStyle();
            }
        });

        // Solid background color changes
        const bgColor = document.getElementById('prop-bg-color');
        const bgColorHex = document.getElementById('prop-bg-color-hex');
        const bgOpacity = document.getElementById('prop-bg-opacity');
        
        const updateSolidBg = () => {
            const rgba = this.hexToRgba(bgColor.value, bgOpacity.value);
            updateStyle('background', rgba);
            updateStyle('backgroundColor', rgba); // fallback
        };
        
        bgColor?.addEventListener('input', (e) => {
            bgColorHex.value = e.target.value;
            updateSolidBg();
        });
        bgColor?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        bgOpacity?.addEventListener('input', updateSolidBg);
        bgOpacity?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        
        bgColorHex?.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                bgColor.value = e.target.value;
                updateSolidBg();
                window.canvasEditor.triggerHistorySave();
            }
        });

        // Gradient Background Color changes
        const gradColor1 = document.getElementById('prop-grad-color1');
        const gradColor2 = document.getElementById('prop-grad-color2');
        const gradAngle = document.getElementById('prop-grad-angle');
        const gradType = document.getElementById('prop-grad-type');

        gradColor1?.addEventListener('input', () => this.applyGradientStyle());
        gradColor2?.addEventListener('input', () => this.applyGradientStyle());
        gradAngle?.addEventListener('input', () => this.applyGradientStyle());
        gradType?.addEventListener('change', () => this.applyGradientStyle());

        gradColor1?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        gradColor2?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        gradAngle?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());

        // Corners & Borders
        const radiusInput = document.getElementById('prop-border-radius');
        radiusInput?.addEventListener('input', (e) => {
            document.getElementById('radius-val').innerText = e.target.value;
            updateStyle('borderRadius', `${e.target.value}px`);
        });
        radiusInput?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());

        const borderWidth = document.getElementById('prop-border-width');
        const borderStyle = document.getElementById('prop-border-style');
        const borderColor = document.getElementById('prop-border-color');
        const borderColorHex = document.getElementById('prop-border-color-hex');

        borderWidth?.addEventListener('input', (e) => {
            updateStyle('borderWidth', `${e.target.value}px`);
        });
        borderWidth?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        borderStyle?.addEventListener('change', (e) => {
            updateStyle('borderStyle', e.target.value, true);
        });

        const updateBorderColor = () => {
            updateStyle('borderColor', borderColor.value);
        };
        borderColor?.addEventListener('input', (e) => {
            borderColorHex.value = e.target.value;
            updateBorderColor();
        });
        borderColor?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        borderColorHex?.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                borderColor.value = e.target.value;
                updateBorderColor();
                window.canvasEditor.triggerHistorySave();
            }
        });

        // Box Shadows
        const shadowEnable = document.getElementById('prop-shadow-enable');
        const shadowGroup = document.getElementById('shadow-properties-container');
        
        shadowEnable?.addEventListener('change', (e) => {
            shadowGroup.classList.toggle('disabled-group', !e.target.checked);
            this.applyShadowStyle();
        });

        const shadowX = document.getElementById('prop-shadow-x');
        const shadowY = document.getElementById('prop-shadow-y');
        const shadowBlur = document.getElementById('prop-shadow-blur');
        const shadowSpread = document.getElementById('prop-shadow-spread');
        const shadowColor = document.getElementById('prop-shadow-color');
        const shadowInset = document.getElementById('prop-shadow-inset');

        const shadowInputs = [shadowX, shadowY, shadowBlur, shadowSpread, shadowColor, shadowInset];
        shadowInputs.forEach(input => {
            input?.addEventListener('input', () => this.applyShadowStyle());
            input?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        });

        // Transforms
        const rotateInput = document.getElementById('prop-rotate');
        const scaleInput = document.getElementById('prop-scale');
        const skewInput = document.getElementById('prop-skew-x');

        const updateTransform = () => {
            document.getElementById('rotate-val').innerText = rotateInput.value;
            const t = `rotate(${rotateInput.value}deg) scale(${scaleInput.value}) skewX(${skewInput.value}deg)`;
            updateStyle('transform', t);
        };

        rotateInput?.addEventListener('input', updateTransform);
        rotateInput?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        scaleInput?.addEventListener('input', updateTransform);
        scaleInput?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        skewInput?.addEventListener('input', updateTransform);
        skewInput?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());

        // Filters
        const filterBlur = document.getElementById('prop-filter-blur');
        const filterBright = document.getElementById('prop-filter-brightness');
        
        const updateFilters = () => {
            const f = `blur(${filterBlur.value}px) brightness(${filterBright.value}%)`;
            updateStyle('filter', f);
        };
        
        filterBlur?.addEventListener('input', updateFilters);
        filterBlur?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        filterBright?.addEventListener('input', updateFilters);
        filterBright?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());

        // Backdrop Filter blur
        const bdBlur = document.getElementById('prop-backdrop-blur');
        bdBlur?.addEventListener('input', (e) => {
            const b = e.target.value > 0 ? `blur(${e.target.value}px)` : 'none';
            updateStyle('backdropFilter', b);
            updateStyle('webkitBackdropFilter', b);
        });
        bdBlur?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());

        // Artboard Background color
        const artboardBg = document.getElementById('prop-canvas-bg');
        const artboardBgHex = document.getElementById('prop-canvas-bg-hex');
        
        artboardBg?.addEventListener('input', (e) => {
            artboardBgHex.value = e.target.value;
            if (document.getElementById('paint-artboard')) document.getElementById('paint-artboard').style.backgroundColor = e.target.value;
        });
        artboardBg?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        artboardBgHex?.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                artboardBg.value = e.target.value;
                if (document.getElementById('paint-artboard')) document.getElementById('paint-artboard').style.backgroundColor = e.target.value;
                window.canvasEditor.triggerHistorySave();
            }
        });

        // --- NEW 50+ PROPERTIES LISTENERS ---
        // Spacing
        ['mt', 'mb', 'ml', 'mr', 'pt', 'pb', 'pl', 'pr'].forEach(prop => {
            const map = { mt:'marginTop', mb:'marginBottom', ml:'marginLeft', mr:'marginRight', pt:'paddingTop', pb:'paddingBottom', pl:'paddingLeft', pr:'paddingRight' };
            const input = document.getElementById(`prop-${prop}`);
            if(input) {
                input?.addEventListener('input', (e) => updateStyle(map[prop], `${e.target.value}px`));
                input?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
            }
        });

        // Layout & Flexbox
        const displayInput = document.getElementById('prop-display');
        if (displayInput) {
            displayInput?.addEventListener('change', (e) => {
                updateStyle('display', e.target.value, true);
                const flexControls = document.getElementById('flexbox-controls');
                if (flexControls) flexControls.classList.toggle('hidden', e.target.value !== 'flex' && e.target.value !== 'inline-flex');
            });
        }
        
        ['flex-direction', 'flex-wrap', 'justify-content', 'align-items'].forEach(prop => {
            const camel = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
            const input = document.getElementById(`prop-${prop}`);
            if (input) input?.addEventListener('change', (e) => updateStyle(camel, e.target.value, true));
        });
        
        const gapInput = document.getElementById('prop-gap');
        if (gapInput) {
            gapInput?.addEventListener('input', (e) => updateStyle('gap', `${e.target.value}px`));
            gapInput?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        }

        // Position
        const posInput = document.getElementById('prop-position');
        if(posInput) posInput?.addEventListener('change', (e) => updateStyle('position', e.target.value, true));

        ['top', 'bottom', 'left', 'right'].forEach(prop => {
            const input = document.getElementById(`prop-${prop}`);
            if(input) {
                input?.addEventListener('input', (e) => {
                    const val = e.target.value;
                    updateStyle(prop, val ? (isNaN(val) ? val : `${val}px`) : 'auto');
                });
                input?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
            }
        });
        
        const zIndexInput = document.getElementById('prop-z-index');
        if(zIndexInput) {
            zIndexInput?.addEventListener('input', (e) => updateStyle('zIndex', e.target.value));
            zIndexInput?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        }

        // Advanced CSS
        const opacityInput = document.getElementById('prop-opacity');
        if(opacityInput) {
            opacityInput?.addEventListener('input', (e) => updateStyle('opacity', e.target.value));
            opacityInput?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        }

        ['mix-blend-mode', 'cursor', 'pointer-events', 'overflow'].forEach(prop => {
            const camel = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
            const input = document.getElementById(`prop-${prop}`);
            if(input) input?.addEventListener('change', (e) => updateStyle(camel, e.target.value, true));
        });

        // Text Effects
        ['letter-spacing', 'line-height'].forEach(prop => {
            const camel = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
            const input = document.getElementById(`prop-${prop}`);
            if(input) {
                input?.addEventListener('input', (e) => updateStyle(camel, e.target.value));
                input?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
            }
        });

        ['text-transform', 'text-decoration'].forEach(prop => {
            const camel = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
            const input = document.getElementById(`prop-${prop}`);
            if(input) input?.addEventListener('change', (e) => updateStyle(camel, e.target.value, true));
        });

        // Filters extended
        const filterContrast = document.getElementById('prop-filter-contrast');
        const filterSaturate = document.getElementById('prop-filter-saturate');
        const filterGrayscale = document.getElementById('prop-filter-grayscale');
        const filterHueRotate = document.getElementById('prop-filter-hue-rotate');
        
        const updateFiltersExtended = () => {
            const b = document.getElementById('prop-filter-blur')?.value || 0;
            const br = document.getElementById('prop-filter-brightness')?.value || 100;
            const c = filterContrast?.value || 100;
            const s = filterSaturate?.value || 100;
            const g = filterGrayscale?.value || 0;
            const h = filterHueRotate?.value || 0;
            
            const f = `blur(${b}px) brightness(${br}%) contrast(${c}%) saturate(${s}%) grayscale(${g}%) hue-rotate(${h}deg)`;
            updateStyle('filter', f);
        };

        if(filterContrast) { filterContrast?.addEventListener('input', updateFiltersExtended); filterContrast?.addEventListener('change', () => window.canvasEditor.triggerHistorySave()); }
        if(filterSaturate) { filterSaturate?.addEventListener('input', updateFiltersExtended); filterSaturate?.addEventListener('change', () => window.canvasEditor.triggerHistorySave()); }
        if(filterGrayscale) { filterGrayscale?.addEventListener('input', updateFiltersExtended); filterGrayscale?.addEventListener('change', () => window.canvasEditor.triggerHistorySave()); }
        if(filterHueRotate) { filterHueRotate?.addEventListener('input', updateFiltersExtended); filterHueRotate?.addEventListener('change', () => window.canvasEditor.triggerHistorySave()); }
        
        // Backdrop filter extended
        const bdBrightInput = document.getElementById('prop-backdrop-brightness');
        const updateBackdropExtended = () => {
            const bl = document.getElementById('prop-backdrop-blur')?.value || 0;
            const br = bdBrightInput?.value || 100;
            const b = (bl > 0 || br !== 100) ? `blur(${bl}px) brightness(${br}%)` : 'none';
            updateStyle('backdropFilter', b);
            updateStyle('webkitBackdropFilter', b);
        };
        if(bdBrightInput) {
            bdBrightInput?.addEventListener('input', updateBackdropExtended);
            bdBrightInput?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        }

        // Transitions
        ['transition-property', 'transition-timing'].forEach(prop => {
            const camel = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
            const input = document.getElementById(`prop-${prop}`);
            if(input) {
                if(prop==='transition-timing') input?.addEventListener('change', (e) => updateStyle('transitionTimingFunction', e.target.value, true));
                else input?.addEventListener('input', (e) => updateStyle('transitionProperty', e.target.value));
            }
        });
        const transDur = document.getElementById('prop-transition-duration');
        if(transDur) {
            transDur?.addEventListener('input', (e) => updateStyle('transitionDuration', `${e.target.value}s`));
            transDur?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        }

    }

    // Set up color swatch controls
    initSwatchListeners() {
        // Solid swatches click
        document.getElementById('swatches-solid')?.addEventListener('click', (e) => {
            const swatch = e.target.closest('.swatch-color');
            if (!swatch || !this.activeElement) return;
            
            const color = swatch.dataset.color;
            
            if (this.activeElement.classList.contains('text-element')) {
                // If text element selected, color controls the font color
                this.activeElement.style.color = color;
                if (document.getElementById('prop-text-color')) document.getElementById('prop-text-color').value = color;
                if (document.getElementById('prop-text-color-hex')) document.getElementById('prop-text-color-hex').value = color;
            } else {
                // Otherwise updates background color
                this.activeElement.style.background = color;
                this.activeElement.style.backgroundColor = color;
                if (document.getElementById('prop-bg-type')) document.getElementById('prop-bg-type').value = 'color';
                if (document.getElementById('prop-bg-color')) document.getElementById('prop-bg-color').value = color;
                if (document.getElementById('prop-bg-color-hex')) document.getElementById('prop-bg-color-hex').value = color;
                document.getElementById('bg-color-control')?.classList.remove('hidden');
                document.getElementById('bg-gradient-control')?.classList.add('hidden');
            }
            
            window.canvasEditor.updateSelectionBox();
            window.canvasEditor.triggerHistorySave();
        });

        // Gradient swatches click
        document.getElementById('swatches-gradient')?.addEventListener('click', (e) => {
            const swatch = e.target.closest('.swatch-gradient');
            if (!swatch || !this.activeElement) return;
            
            const grad = swatch.dataset.gradient;
            this.activeElement.style.background = grad;
            
            // Sync gradient inputs
            if (document.getElementById('prop-bg-type')) document.getElementById('prop-bg-type').value = 'gradient';
            document.getElementById('bg-color-control')?.classList.add('hidden');
            document.getElementById('bg-gradient-control')?.classList.remove('hidden');
            
            // Parse details if matches
            const colorsMatch = grad.match(/#[0-9a-fA-F]{6}/g);
            if (colorsMatch && colorsMatch.length >= 2) {
                if (document.getElementById('prop-grad-color1')) document.getElementById('prop-grad-color1').value = colorsMatch[0];
                if (document.getElementById('prop-grad-color2')) document.getElementById('prop-grad-color2').value = colorsMatch[1];
            }
            
            window.canvasEditor.updateSelectionBox();
            window.canvasEditor.triggerHistorySave();
        });
    }

    // Set up Built-in Presets and Animation selectors
    initPresetListeners() {
        // Preset cards (Instant styles)
        document.getElementById('presets-panel')?.addEventListener('click', (e) => {
            const presetBtn = e.target.closest('.preset-card');
            if (!presetBtn || !this.activeElement) return;
            
            const preset = presetBtn.dataset.preset;
            
            // Clear existing presets
            this.activeElement.classList.forEach(className => {
                if (className.startsWith('preset-')) {
                    this.activeElement.classList.remove(className);
                }
            });
            
            // Reset base styles to not overlap preset importance
            this.activeElement.style.background = '';
            this.activeElement.style.boxShadow = '';
            this.activeElement.style.border = '';
            this.activeElement.style.backdropFilter = '';
            this.activeElement.style.webkitBackdropFilter = '';
            
            // Add class
            this.activeElement.classList.add(`preset-${preset}`);
            
            this.syncInspector(this.activeElement);
            window.canvasEditor.updateSelectionBox();
            window.canvasEditor.triggerHistorySave();
        });

        // Animation changes
        const animSelect = document.getElementById('prop-animation-type');
        const animDuration = document.getElementById('prop-anim-duration');
        const animInfinite = document.getElementById('prop-anim-infinite');

        const applyAnimation = () => {
            if (!this.activeElement) return;
            
            // 1. Remove existing anim- classes
            this.activeElement.classList.forEach(className => {
                if (className.startsWith('anim-')) {
                    this.activeElement.classList.remove(className);
                }
            });
            
            // 2. Set new animation
            const selected = animSelect.value;
            if (selected !== 'none') {
                this.activeElement.classList.add(`anim-${selected}`);
                
                // Add inline configuration variables
                this.activeElement.style.animationDuration = `${animDuration.value}s`;
                this.activeElement.style.animationIterationCount = animInfinite.checked ? 'infinite' : '1';
                
                // Reset styling properties that would conflict with text-rainbow
                if (selected === 'rainbow-text') {
                    this.activeElement.style.webkitTextFillColor = 'transparent';
                }
            } else {
                // Clear inline anim rules
                this.activeElement.style.animationName = '';
                this.activeElement.style.animationDuration = '';
                this.activeElement.style.animationIterationCount = '';
                
                // Clear visual effects & shadows for Flat Option
                this.activeElement.style.boxShadow = 'none';
                this.activeElement.style.backdropFilter = 'none';
                this.activeElement.style.webkitBackdropFilter = 'none';
                this.activeElement.style.textShadow = 'none';
                this.activeElement.style.filter = 'none';
            }
            
            window.canvasEditor.triggerHistorySave();
        };

        animSelect?.addEventListener('change', applyAnimation);
        animDuration?.addEventListener('input', applyAnimation);
        animDuration?.addEventListener('change', () => window.canvasEditor.triggerHistorySave());
        animInfinite?.addEventListener('change', applyAnimation);
    }

    // Helper functions for style updates
    applyGradientStyle() {
        if (!this.activeElement) return;
        const angle = document.getElementById('prop-grad-angle')?.value;
        const color1 = document.getElementById('prop-grad-color1')?.value;
        const color2 = document.getElementById('prop-grad-color2')?.value;
        const type = document.getElementById('prop-grad-type')?.value;
        
        let gradVal = '';
        if (type === 'linear') {
            gradVal = `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
        } else {
            gradVal = `radial-gradient(circle, ${color1} 0%, ${color2} 100%)`;
        }
        
        this.activeElement.style.background = gradVal;
        window.canvasEditor.updateSelectionBox();
    }

    applyShadowStyle() {
        if (!this.activeElement) return;
        const enable = document.getElementById('prop-shadow-enable')?.checked;
        
        if (!enable) {
            this.activeElement.style.boxShadow = 'none';
            return;
        }
        
        const x = document.getElementById('prop-shadow-x')?.value;
        const y = document.getElementById('prop-shadow-y')?.value;
        const blur = document.getElementById('prop-shadow-blur')?.value;
        const spread = document.getElementById('prop-shadow-spread')?.value;
        const color = document.getElementById('prop-shadow-color')?.value;
        const inset = document.getElementById('prop-shadow-inset')?.checked ? 'inset' : '';
        
        const shadowVal = `${inset} ${x}px ${y}px ${blur}px ${spread}px ${color}`.trim();
        this.activeElement.style.boxShadow = shadowVal;
    }

    // Generate Layers Panel List dynamically
    updateLayersList() {
        const container = document.getElementById('layers-container');
        container.innerHTML = '';
        
        const elements = Array.from(document.getElementById('paint-artboard').querySelectorAll('.canvas-element'));
        
        if (elements.length === 0) {
            container.innerHTML = '<li class="empty-layers">No layers added yet</li>';
            return;
        }
        
        // Reverse elements array to display top-most elements first (z-index natural order)
        elements.reverse().forEach(el => {
            const isText = el.classList.contains('text-element');
            const icon = isText ? 'type' : 'shapes';
            const name = el.dataset.name || 'Element';
            const isActive = this.activeElement === el;
            
            const isLocked = el.style.pointerEvents === 'none';
            const isHidden = el.style.display === 'none';
            
            const li = document.createElement('li');
            li.className = `layer-item ${isActive ? 'active' : ''}`;
            li.innerHTML = `
                <div class="layer-info">
                    <i data-lucide="${icon}"></i>
                    <span>${name}</span>
                </div>
                <div class="layer-actions">
                    <button class="layer-action-btn toggle-lock" title="Lock element editing">
                        <i data-lucide="${isLocked ? 'lock' : 'unlock'}"></i>
                    </button>
                    <button class="layer-action-btn toggle-vis" title="Toggle visibility">
                        <i data-lucide="${isHidden ? 'eye-off' : 'eye'}"></i>
                    </button>
                    <button class="layer-action-btn delete" title="Delete element">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;
            
            // Layer Item Click Selection
            li?.addEventListener('mousedown', (e) => {
                if (e.target.closest('.layer-action-btn')) return; // ignore action buttons
                window.canvasEditor.selectElement(el);
            });
            
            // Lock Toggling
            li.querySelector('.toggle-lock').addEventListener('click', (e) => {
                e.stopPropagation();
                const locked = el.style.pointerEvents === 'none';
                el.style.pointerEvents = locked ? 'auto' : 'none';
                
                // Clear selection if locking selected element
                if (!locked && this.activeElement === el) {
                    window.canvasEditor.deselectAll();
                }
                this.updateLayersList();
            });
            
            // Visibility Toggling
            li.querySelector('.toggle-vis').addEventListener('click', (e) => {
                e.stopPropagation();
                const hidden = el.style.display === 'none';
                el.style.display = hidden ? '' : 'none';
                
                // Clear selection if hiding selected element
                if (!hidden && this.activeElement === el) {
                    window.canvasEditor.deselectAll();
                }
                this.updateLayersList();
            });
            
            // Deleting Layer
            li.querySelector('.delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.activeElement === el) {
                    window.canvasEditor.deselectAll();
                }
                el.remove();
                window.canvasEditor.triggerHistorySave();
                window.canvasEditor.updateElementsCount();
                this.updateLayersList();
            });
            
            container.appendChild(li);
        });
        
        lucide.createIcons(); // Render layer action icons
    }

    // Color conversion utility helper functions
    rgbToHex(rgbStr) {
        if (!rgbStr) return "#ffffff";
        if (rgbStr.startsWith('#')) return rgbStr;
        
        const match = rgbStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
        if (!match) return "#ffffff";
        
        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');
        
        return `#${r}${g}${b}`;
    }

    hexToRgba(hex, alpha = 1) {
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length === 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${alpha})`;
        }
        return hex;
    }
}

// Export singleton instance
window.controlsManager = new ControlsManager();
