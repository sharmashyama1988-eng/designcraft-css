/* DesignCraft AI Assistant
   Governs the dynamic AI Design System. Runs a dual pipeline:
   1. OpenRouter (Llama 3.3) for prompt refinement & token extraction.
   2. Google Gemini API for HTML/CSS generation under strict HSL, 
      Typography, and Design Trend constraints.
   Features a mathematical WCAG Contrast Guard. */

class AIService {
    constructor() {
        this.btnGenerate = document.getElementById('btn-generate-ai');
        this.promptTextarea = document.getElementById('ai-prompt');
        this.openRouterKeyInput = document.getElementById('api-key');
        this.geminiKeyInput = document.getElementById('gemini-key');
        this.modelSelect = document.getElementById('ai-model');
        this.statusBox = document.getElementById('ai-status');
        this.statusText = document.getElementById('ai-status-text');
        this.codePreview = document.getElementById('generated-css-code');
        this.btnCopyCode = document.getElementById('btn-copy-generated');
        
        this.dynamicStylesheet = document.getElementById('dynamic-ai-styles');
        if (!this.dynamicStylesheet) {
            this.dynamicStylesheet = document.createElement('style');
            this.dynamicStylesheet.id = 'dynamic-ai-styles';
            document.head.appendChild(this.dynamicStylesheet);
        }

        this.initEvents();
    }

    initEvents() {
        this.btnGenerate.addEventListener('click', () => this.runDualAIPipeline());
        this.btnCopyCode.addEventListener('click', () => this.copyGeneratedCode());

        // Sidebar Code Preview Tab Selectors
        const tabCss = document.getElementById('tab-selector-css');
        const tabHtml = document.getElementById('tab-selector-html');
        const preCss = document.getElementById('pre-generated-css');
        const preHtml = document.getElementById('pre-generated-html');

        if (tabCss && tabHtml && preCss && preHtml) {
            tabCss.addEventListener('click', () => {
                tabCss.classList.add('active');
                tabCss.style.borderBottomColor = 'var(--accent-color)';
                tabCss.style.color = 'var(--text-primary)';
                
                tabHtml.classList.remove('active');
                tabHtml.style.borderBottomColor = 'transparent';
                tabHtml.style.color = 'var(--text-muted)';
                
                preCss.classList.remove('hidden');
                preHtml.classList.add('hidden');
                this.activeCodeTab = 'css';
            });

            tabHtml.addEventListener('click', () => {
                tabHtml.classList.add('active');
                tabHtml.style.borderBottomColor = 'var(--accent-color)';
                tabHtml.style.color = 'var(--text-primary)';
                
                tabCss.classList.remove('active');
                tabCss.style.borderBottomColor = 'transparent';
                tabCss.style.color = 'var(--text-muted)';
                
                preHtml.classList.remove('hidden');
                preCss.classList.add('hidden');
                this.activeCodeTab = 'html';
            });
        }

        // Creation Mode Buttons click toggler
        document.querySelectorAll('.creation-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.creation-mode-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');

                const artboard = document.getElementById('paint-artboard');
                if (artboard) {
                    if (btn.dataset.mode === 'landing') {
                        artboard.classList.add('mode-landing-active');
                    } else {
                        artboard.classList.remove('mode-landing-active');
                    }
                }
            });
        });

        this.activeCodeTab = 'css';
    }

    // DUAL AI PIPELINE COORDINATOR
    async runDualAIPipeline() {
        // Enforce Authentication check before AI generation
        const firebaseService = window.firebaseService;
        if (firebaseService) {
            // If Firebase is connected (not localMode), user must be signed in
            if (!firebaseService.localMode) {
                // If auth hasn't resolved yet, wait briefly
                if (!firebaseService.authReady) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
                // Now check if user is signed in
                if (!firebaseService.user) {
                    if (firebaseService.modalAuth) {
                        firebaseService.modalAuth.classList.remove('hidden');
                        if (typeof firebaseService.resetAuthForm === 'function') {
                            firebaseService.resetAuthForm();
                        }
                    }
                    this.showStatus("Please Sign In to use the AI Designer.", false);
                    return;
                }
            }
            // If localMode = true, allow free use without sign-in
        }

        const prompt = this.promptTextarea.value.trim();
        const orKey = this.openRouterKeyInput.value.trim();
        const geminiKey = this.geminiKeyInput.value.trim();
        const orModel = this.modelSelect.value;

        if (!prompt) { this.showStatus('Please type a design command first!', false); return; }
        if (!geminiKey) { this.showStatus('Please enter your Gemini API Key!', false); return; }

        // ── Security Checks ──
        const sec = window.securityEngine;
        if (sec) {
            const isAuth = !!(window.firebaseService?.user);
            const check = sec.runFullCheck(prompt, isAuth);
            if (!check.ok) {
                this.showStatus(`🛡️ ${check.reason}`, false);
                return;
            }
            // Show usage counter in status
            const { used, limit } = check.quotaCheck;
            this.showStatus(`Security OK · ${used + 1}/${limit} uses today`, true);
        }

        // Silent routing check: use Gemini if OpenRouter key is empty
        let refinerMode = 'gemini';
        if (orKey && orModel && !orModel.includes("gemini")) {
            refinerMode = 'openrouter';
        }

        const modeBtn = document.querySelector('.creation-mode-btn.active');
        const generationMode = modeBtn ? modeBtn.dataset.mode : 'landing';
        
        const animationsCheckbox = document.getElementById('ai-enable-animations');
        const animationsEnabled = animationsCheckbox ? animationsCheckbox.checked : true;

        // 1. Create and show skeleton shimmer card loader
        this.removeShimmer();
        this.shimmerEl = document.createElement('div');
        this.shimmerEl.className = 'skeleton-shimmer';
        this.shimmerEl.style.left = '150px';
        this.shimmerEl.style.top = '100px';
        this.shimmerEl.innerHTML = `
            <div class="shimmer-line header"></div>
            <div class="shimmer-line"></div>
            <div class="shimmer-line short"></div>
            <div class="shimmer-btn"></div>
        `;
        document.getElementById('paint-artboard').appendChild(this.shimmerEl);

        try {
            // Check for Lock Style state
            let styleLockContext = null;
            const activeEl = window.canvasEditor?.selectedElement;
            const lockCheckbox = document.getElementById('ai-lock-style');
            if (lockCheckbox && lockCheckbox.checked && activeEl) {
                const hueVal = activeEl.style.getPropertyValue('--hue') || 240;
                const bgLVal = activeEl.style.getPropertyValue('--bg-l') ? parseFloat(activeEl.style.getPropertyValue('--bg-l')) : 8;
                const textLVal = activeEl.style.getPropertyValue('--text-l') ? parseFloat(activeEl.style.getPropertyValue('--text-l')) : 95;
                
                let trendVal = 'minimal-dark';
                if (activeEl.classList.contains('preset-glassmorphism')) trendVal = 'glassmorphism';
                else if (activeEl.classList.contains('preset-cyberpunk')) trendVal = 'cyberpunk';
                else if (activeEl.classList.contains('preset-neo-brutalism')) trendVal = 'neo-brutalism';
                
                let animVal = 'none';
                activeEl.classList.forEach(cls => {
                    if (cls.startsWith('anim-')) animVal = cls.substring(5);
                });
                
                styleLockContext = {
                    designTrend: trendVal,
                    hue: parseInt(hueVal),
                    bgL: bgLVal,
                    textL: textLVal,
                    animation: animVal
                };
            }

            // STEP 1: Prompt Refinement (Gemini / OpenRouter fallback)
            let designTokens = null;
            if (refinerMode === 'openrouter') {
                this.showStatus("Refining design tokens (OpenRouter)...", true);
                designTokens = await this.refinePromptWithOpenRouter(prompt, orKey, orModel, styleLockContext, generationMode, animationsEnabled);
            } else {
                this.showStatus("Refining design tokens (Gemini)...", true);
                designTokens = await this.refinePromptWithGemini(prompt, geminiKey, styleLockContext, generationMode, animationsEnabled);
            }
            console.log("Extracted Design Tokens:", designTokens);

            // Update shimmer accent outline based on computed tokens
            if (this.shimmerEl) {
                this.shimmerEl.style.setProperty('--accent-color', `hsl(${designTokens.hue}, 90%, 60%)`);
                this.shimmerEl.style.boxShadow = `0 0 20px hsl(${designTokens.hue}, 90%, 60%, 0.35)`;
            }

            // STEP 2: UI Generation via Gemini 2.5
            this.showStatus(`Synthesizing ${designTokens.designTrend} layout...`, true);
            const component = await this.generateComponentWithGemini(designTokens, geminiKey, generationMode, animationsEnabled);
            
            // STEP 3: Apply Constraints, WCAG Contrast Guard, and Paint
            if (component.mode === 'full-site') {
                this.removeShimmer();
                this.showFullSitePreview(component.html);
            } else {
                this.showStatus("Running Contrast Guard...", true);
                this.injectAndVerifyComponent(component, designTokens);
            }

        } catch (err) {
            console.error("Pipeline failure:", err);
            this.removeShimmer();

            // Offline templates fallback when API limits are hit!
            const promptLower = prompt.toLowerCase();
            let matchedTrend = 'minimalDark';
            let matchedType = 'card';
            
            if (promptLower.includes('glass')) matchedTrend = 'glassmorphism';
            else if (promptLower.includes('cyber') || promptLower.includes('neon')) matchedTrend = 'cyberpunk';
            else if (promptLower.includes('brutal') || promptLower.includes('comic')) matchedTrend = 'neoBrutalism';
            
            if (generationMode === 'landing' || promptLower.includes('page') || promptLower.includes('landing') || promptLower.includes('site') || promptLower.includes('dashboard')) {
                matchedType = 'landing';
            }

            const dbTrend = window.FIGMA_DESIGN_DATABASE?.trends?.[matchedTrend];
            const blueprint = dbTrend?.blueprints?.[matchedType];

            if (blueprint) {
                this.showStatus("Quota Limit Hit. Loaded offline template fallback!", false);
                const mockTokens = {
                    designTrend: matchedTrend === 'neoBrutalism' ? 'neo-brutalism' : (matchedTrend === 'minimalDark' ? 'minimal-dark' : matchedTrend),
                    hue: matchedTrend === 'cyberpunk' ? 180 : (matchedTrend === 'neoBrutalism' ? 45 : 220),
                    bgL: matchedTrend === 'cyberpunk' ? 0 : (matchedTrend === 'minimalDark' ? 6 : (matchedTrend === 'glassmorphism' ? 10 : 94)),
                    textL: matchedTrend === 'minimalDark' || matchedTrend === 'cyberpunk' ? 95 : 12,
                    animation: 'none'
                };
                
                // Inject the local fallback
                this.injectAndVerifyComponent({ html: blueprint.html, css: blueprint.css }, mockTokens);
            } else {
                this.showStatus(`API Limit Hit: ${err.message}`, false);
            }
        }
    }

    removeShimmer() {
        if (this.shimmerEl && this.shimmerEl.parentNode) {
            this.shimmerEl.remove();
        }
        this.shimmerEl = null;
    }

    // Step 1: OpenRouter Prompt Refiner
    async refinePromptWithOpenRouter(userPrompt, apiKey, model, styleLockContext = null, generationMode = 'landing', animationsEnabled = true) {
        const designDbString = JSON.stringify(window.FIGMA_DESIGN_DATABASE || {}, null, 2);
        
        let lockInstruction = "";
        if (styleLockContext) {
            lockInstruction = `
CRITICAL DIRECTIVE: The user has LOCKED the design style. You MUST copy the following parameters EXACTLY as they are into your JSON output:
- "designTrend": "${styleLockContext.designTrend}"
- "hue": ${styleLockContext.hue}
- "bgL": ${styleLockContext.bgL}
- "textL": ${styleLockContext.textL}
- "animation": "${styleLockContext.animation}"
Do NOT change these parameters. Only write a new refinedBlueprint describing the layout structure and texts matching the new prompt.`;
        }

        let modeInstruction = "";
        if (generationMode === 'asset') {
            modeInstruction = `\nFORCE ASSET CREATION: The user wants to build a single standalone UI element/component (Asset). You MUST outline a compact blueprint describing a single self-contained card, badge, shape, list, or panel. Do NOT outline a landing page navigation header, footer, or multiple sections!`;
        } else {
            modeInstruction = `\nFORCE LANDING PAGE CREATION: The user wants to build a full multi-section landing page. You MUST outline a multi-section layout containing header, hero body, features bento, stats row, and footer.`;
        }

        const systemPrompt = `You are a prompt engineer and design token extractor.
Your job is to decode a user's description into structural design parameters (tokens).
Select one of these 4 design trends based on the prompt's mood:
- glassmorphism (frosted, translucent, blurred background)
- minimal-dark (clean, charcoal background, high space, thin border)
- cyberpunk (black, neon glowing borders, monospace elements)
- neo-brutalism (flat bright colors, thick borders, hard offset black shadows)
${modeInstruction}

Landing Page Scaling Directive:
- If the user prompt asks for a "landing page", "dashboard", "full site", "homepage", or "multi-section page", you MUST generate a "refinedBlueprint" that structures a complete multi-section layout containing:
  1. A navigation header (Logo, nav links, CTA button).
  2. A Hero Section (large headline, description, primary/secondary buttons).
  3. A Features Bento Grid (2x2 or 3-column grid showing card details).
  4. A Stats/Statistics bar (large numbers, light labels).
  5. A Footer (copyright, social links).

Tone & Emotional Theming Adaptation Rules:
- Study, notes, reading, cozy, warm -> Choose "minimal-dark", but force light pastel colors: hue (20-60 or 200-220), bgL (92 to 96), textL (10 to 15) for comfortable reading.
- Hacking, gaming, crypto, terminal -> Choose "cyberpunk", force bgL to 0 (pure black), high-contrast glow, monospace typography.
- Business, finance, portfolio -> Choose "minimal-dark" or "glassmorphism", choose professional blue/indigo hues (220-250), bgL (6 to 12).

Reference the Figma Design System Rules:
${designDbString}
${lockInstruction}

Output ONLY a raw JSON string in this schema:
{
  "designTrend": "glassmorphism" | "minimal-dark" | "cyberpunk" | "neo-brutalism",
  "hue": 240, // Accent hue selection (0 to 360)
  "bgL": 8, // Background lightness (0 to 100)
  "textL": 95, // Text lightness (0 to 100)
  "animation": "glow" | "pulse" | "float" | "jelly" | "bounce" | "slide",
  "refinedBlueprint": "a detailed architectural layout outline based on the prompt."
}
No Markdown wrappers (no \`\`\`json). No explanation.`;

        const fetchUrl = apiKey ? "https://openrouter.ai/api/v1/chat/completions" : "/api/openrouter";
        const fetchHeaders = {
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "DesignCraft CSS Maker"
        };
        if (apiKey) {
            fetchHeaders["Authorization"] = `Bearer ${apiKey}`;
        }

        const response = await fetch(fetchUrl, {
            method: "POST",
            headers: fetchHeaders,
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Decode: ${userPrompt}` }
                ],
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(`OpenRouter Error: ${data?.error?.message || response.status}`);
        }

        const data = await response.json();
        let reply = data.choices[0].message.content.trim();
        
        // Clean JSON strings if model wrapped in markdown
        if (reply.startsWith("```")) {
            reply = reply.replace(/```json|```/g, "").trim();
        }

        return JSON.parse(reply);
    }

    // Step 1b: Gemini-based Prompt Refiner (Fallback/Direct)
    async refinePromptWithGemini(userPrompt, apiKey, styleLockContext = null, generationMode = 'landing', animationsEnabled = true) {
        const designDbString = JSON.stringify(window.FIGMA_DESIGN_DATABASE || {}, null, 2);
        
        let lockInstruction = "";
        if (styleLockContext) {
            lockInstruction = `
CRITICAL DIRECTIVE: The user has LOCKED the design style. You MUST copy the following parameters EXACTLY as they are into your JSON output:
- "designTrend": "${styleLockContext.designTrend}"
- "hue": ${styleLockContext.hue}
- "bgL": ${styleLockContext.bgL}
- "textL": ${styleLockContext.textL}
- "animation": "${styleLockContext.animation}"
Do NOT change these parameters. Only write a new refinedBlueprint describing the layout structure and texts matching the new prompt.`;
        }

        let modeInstruction = "";
        if (generationMode === 'asset') {
            modeInstruction = `\nFORCE ASSET CREATION: The user wants to build a single standalone UI element/component (Asset). You MUST outline a compact blueprint describing a single self-contained card, badge, shape, list, or panel. Do NOT outline a landing page navigation header, footer, or multiple sections!`;
        } else {
            modeInstruction = `\nFORCE LANDING PAGE CREATION: The user wants to build a full multi-section landing page. You MUST outline a multi-section layout containing header, hero body, features bento, stats row, and footer.`;
        }

        const systemPrompt = `You are a prompt engineer and design token extractor.
Your job is to decode a user's description into structural design parameters (tokens).
Select one of these 4 design trends based on the prompt's mood:
- glassmorphism (frosted, translucent, blurred background)
- minimal-dark (clean, charcoal background, high space, thin border)
- cyberpunk (black, neon glowing borders, monospace elements)
- neo-brutalism (flat bright colors, thick borders, hard offset black shadows)
${modeInstruction}

Landing Page Scaling Directive:
- If the user prompt asks for a "landing page", "dashboard", "full site", "homepage", or "multi-section page", you MUST generate a "refinedBlueprint" that structures a complete multi-section layout containing:
  1. A navigation header (Logo, nav links, CTA button).
  2. A Hero Section (large headline, description, primary/secondary buttons).
  3. A Features Bento Grid (2x2 or 3-column grid showing card details).
  4. A Stats/Statistics bar (large numbers, light labels).
  5. A Footer (copyright, social links).

Tone & Emotional Theming Adaptation Rules:
- Study, notes, reading, cozy, warm -> Choose "minimal-dark", but force light pastel colors: hue (20-60 or 200-220), bgL (92 to 96), textL (10 to 15) for comfortable reading.
- Hacking, gaming, crypto, terminal -> Choose "cyberpunk", force bgL to 0 (pure black), high-contrast glow, monospace typography.
- Business, finance, portfolio -> Choose "minimal-dark" or "glassmorphism", choose professional blue/indigo hues (220-250), bgL (6 to 12).

Reference the Figma Design System Rules:
${designDbString}
${lockInstruction}

Output ONLY a raw JSON string in this schema:
{
  "designTrend": "glassmorphism" | "minimal-dark" | "cyberpunk" | "neo-brutalism",
  "hue": 240, // Accent hue selection (0 to 360)
  "bgL": 8, // Background lightness (0 to 100)
  "textL": 95, // Text lightness (0 to 100)
  "animation": "glow" | "pulse" | "float" | "jelly" | "bounce" | "slide",
  "refinedBlueprint": "a detailed architectural layout outline based on the prompt."
}
No Explanation. Output ONLY valid JSON.`;

        const fetchUrl = apiKey 
            ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
            : `/api/gemini`;
            
        const response = await fetch(fetchUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\nDecode: ${userPrompt}`
                    }]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(`Gemini Refiner Error: ${data?.error?.message || response.status}`);
        }

        const data = await response.json();
        let reply = data.candidates[0].content.parts[0].text.trim();
        
        if (reply.startsWith("```")) {
            reply = reply.replace(/```json|```/g, "").trim();
        }

        return JSON.parse(reply);
    }

    // Step 2: Gemini Code Generator
    async generateComponentWithGemini(tokens, apiKey, generationMode = 'landing', animationsEnabled = true) {
        const figmaRules = window.FIGMA_DESIGN_DATABASE?.trends?.[tokens.designTrend] || {};

        let animationDirective = "";
        if (!animationsEnabled) {
            animationDirective = `CRITICAL: NO hover states (:hover), NO transitions, NO @keyframes, NO animations. Strictly static flat CSS only.`;
        } else {
            animationDirective = `Interactive animations, hover states, transitions, and micro-animations are all PERMITTED and encouraged.`;
        }

        // ── LANDING PAGE MODE: full standalone HTML file ──
        if (generationMode === 'landing') {
            const systemPrompt = `You are a world-class senior frontend engineer and UI/UX designer.
Your task: Generate a COMPLETE, standalone, production-ready HTML webpage — NOT a component, NOT a div — a full website.

RULES:
1. Output a single COMPLETE HTML document starting with <!DOCTYPE html> and ending with </html>.
2. Include <head> with: charset, viewport, title, Google Fonts import, and ALL CSS inside a <style> tag.
3. Include a <body> with full multi-section page: Navbar, Hero, Features/Bento Grid, Stats, Testimonials (optional), CTA, Footer.
4. Use ONLY inline <style> and vanilla JavaScript. No external CDN dependencies except Google Fonts.
5. NO placeholder images — use CSS shapes, SVG icons, gradient blocks, and HTML art instead.
6. ${animationDirective}
7. Design System:
   - Design Trend: ${tokens.designTrend}
   - Primary Hue: ${tokens.hue}deg (use hsl())
   - Background Lightness: ${tokens.bgL}%
   - Text Lightness: ${tokens.textL}%
   - Use CSS variables: --hue, --accent, --bg, --text on :root
8. Use modern CSS: grid, flexbox, clamp(), CSS variables, backdrop-filter.
9. Make it look like a $10,000 premium agency website — stunning, editorial, award-winning.
10. The HTML must be complete and render perfectly when opened in any browser.

Layout blueprint to implement:
${tokens.refinedBlueprint}

Output ONLY the raw complete HTML. No markdown, no explanation, no code fences.`;

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }], generationConfig: { maxOutputTokens: 8192 } }) });
            if (!response.ok) { const d = await response.json(); throw new Error(`Gemini Error: ${d?.error?.message || response.status}`); }
            const data = await response.json();
            let html = data.candidates[0].content.parts[0].text.trim();
            if (html.startsWith('```')) html = html.replace(/```html|```/g, '').trim();
            if (window.securityEngine) html = window.securityEngine.sanitizeOutput(html);
            if (window.securityEngine) window.securityEngine.incrementDailyUsage();
            return { mode: 'full-site', html };
        }

        const systemPrompt = `You are a master UI/UX software architect.
Generate HTML and CSS for a component using the design system configuration provided.

${modeDimensionPrompt}
${animationDirective}

105 DESIGN UTILITY TOOLS AND CLASSES (YOUR AI TOOLBOX):
You MUST use these pre-defined variables, utility classes, and custom rules inside your HTML and CSS:

A. HSL Color Space & Variables (15 Tools):
   Use these CSS variables on the root/parent element. Do NOT use hex (#fff) or rgb.
   - --hue: ${tokens.hue};
   - --bg-h: ${tokens.hue};
   - --bg-s: 15%;
   - --bg-l: ${tokens.bgL}%;
   - --bg-color: hsl(var(--bg-h), var(--bg-s), var(--bg-l));
   - --text-h: ${tokens.hue};
   - --text-s: 10%;
   - --text-l: ${tokens.textL}%;
   - --text-color: hsl(var(--text-h), var(--text-s), var(--text-l));
   - --accent-h: ${tokens.hue};
   - --accent-s: 90%;
   - --accent-l: 60%;
   - --accent-color: hsl(var(--accent-h), var(--accent-s), var(--accent-l));
   - --secondary-h: ${tokens.hue}; --secondary-s: 70%; --secondary-l: 50%; --secondary-color: hsl(var(--secondary-h), var(--secondary-s), var(--secondary-l));

B. Typography & Weights (14 Tools):
   - Font family options: 'Outfit', 'Satoshi', 'Inter', sans-serif (or monospace for cyberpunk).
   - FontSize Utility Classes: .text-xs (11px), .text-sm (13px), .text-md (15px), .text-lg (18px), .text-xl (22px), .text-2xl (28px), .text-3xl (36px), .text-4xl (48px), .text-5xl (64px).
   - FontWeight Classes: .font-light (300), .font-normal (400), .font-semibold (600), .font-bold (700), .font-black (900).

C. Visual Shadows, Speculars & Corners (18 Tools):
   - Brutalist offsets: .shadow-brutal-1 (2px), .shadow-brutal-2 (4px), .shadow-brutal-3 (6px), .shadow-brutal-4 (8px), .shadow-brutal-5 (10px) - all offset-x/y with solid black (#000) and 0 blur.
   - Neumorphic curves: .shadow-neu-embossed (soft highlights/lowlights), .shadow-neu-debossed (sunken).
   - Glow overlays: .shadow-glow-cyan (0 0 12px rgba(0,240,255,0.4)), .shadow-glow-magenta, .shadow-glow-purple, .shadow-glow-green.
   - Corners: .rounded-none (0px), .rounded-sm (4px), .rounded-md (8px), .rounded-lg (12px), .rounded-xl (16px), .rounded-xxl (24px), .rounded-full (999px).
   - Border styles: .border-thick-black (3px solid #000), .border-thin-glass (1px solid rgba(255,255,255,0.1)).

D. Backdrop Filters (8 Tools):
   - Blurs: .blur-none (0), .blur-sm (4px), .blur-md (8px), .blur-lg (12px), .blur-xl (18px), .blur-xxl (28px).
   - Saturate multipliers: .saturate-100, .saturate-150, .saturate-200.

E. Interactive States & Animations (22 Tools):
   - Interactive shifts: .hover-scale (scales 1.03 on hover), .hover-up (translateY(-3px)).
   - Active focus: .focus-glow-indigo, .focus-glow-neon.
   - Custom styled narrow dark scrollbars.
   - Hardware accelerated animations: .anim-pulse (scale heartbeat), .anim-float (vertical hover float), .anim-spin (infinite rotate), .anim-jelly (scale squash/bounce on hover), .anim-slide (reveal sliding transition), .anim-neon-flicker (cyber neon flicker effect), .anim-rainbow-text, .anim-scanline (sliding scanlines overlay), .anim-waterfall.

F. Procedural Patterns & Layout Grids (28 Tools):
   - Patterns: .bg-pattern-grid, .bg-pattern-dots, .bg-pattern-stripes, .bg-pattern-aurora, .bg-pattern-hex, .bg-pattern-waves, .bg-pattern-starfield.
   - Layout templates: .grid-bento-3x3, .grid-bento-2x2, .flex-split-hero, .grid-split-2col, .navbar-glass-sticky, .navbar-minimal, .card-widget-small, .card-widget-wide, .pricing-tier-container, .features-comparison-list, .testimonials-masonry.

Output ONLY a raw JSON string in this exact format:
{
  "html": "<div class=\\"canvas-element custom-component\\"> ... </div>",
  "css": ".custom-component { ... } \\n .custom-component h1 { ... }"
}
Do not write anything else.
Asset dimensions: width 320-400px, height auto. Compact, self-contained.`;

        const fetchUrl = apiKey 
            ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
            : `/api/gemini`;
        
        const response = await fetch(fetchUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\nBuild this layout component: ${tokens.refinedBlueprint}`
                    }]
                }]
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(`Gemini Error: ${data?.error?.message || response.status}`);
        }

        const data = await response.json();
        let reply = data.candidates[0].content.parts[0].text.trim();
        
        if (reply.startsWith("```")) {
            reply = reply.replace(/```json|```/g, "").trim();
        }

        return JSON.parse(reply);
    }

    // Step 3: Inject, calculate Contrast Guards, and display
    injectAndVerifyComponent(component, tokens) {
        // Remove shimmer placeholder
        this.removeShimmer();

        // Parse component
        const parser = new DOMParser();
        const doc = parser.parseFromString(component.html, 'text/html');
        const newEl = doc.body.firstChild;

        if (!newEl || !newEl.classList.contains('canvas-element')) {
            throw new Error("Returned HTML must root in a canvas-element div.");
        }

        // Apply Design System HSL overrides
        newEl.style.setProperty('--hue', tokens.hue);
        newEl.style.setProperty('--bg-h', tokens.hue);
        newEl.style.setProperty('--bg-s', '15%');
        newEl.style.setProperty('--bg-l', `${tokens.bgL}%`);
        
        newEl.style.setProperty('--text-h', tokens.hue);
        newEl.style.setProperty('--text-s', '10%');
        newEl.style.setProperty('--text-l', `${tokens.textL}%`);

        // CONTRAST GUARD SYSTEM
        const contrastRatio = this.calculateContrast(tokens.hue, 15, tokens.bgL, tokens.hue, 10, tokens.textL);
        console.log(`Computed Contrast Ratio: ${contrastRatio.toFixed(2)}:1`);

        if (contrastRatio < 4.5) {
            console.warn(`Contrast ratio ${contrastRatio.toFixed(2)} is too low (WCAG standard is 4.5+). Auto-adjusting Text Lightness...`);
            // Adjust text lightness depending on background lightness
            const adjustedTextL = tokens.bgL < 50 ? 95 : 8; // Light text for dark bg, dark text for light bg
            newEl.style.setProperty('--text-l', `${adjustedTextL}%`);
            console.log(`Contrast Guard override: --text-l adjusted to ${adjustedTextL}%`);
        }

        // Apply Position coordinates (dynamically centered on the artboard)
        newEl.id = `ai-${Date.now()}`;
        const artboardEl = document.getElementById('paint-artboard');
        const abW = artboardEl ? artboardEl.clientWidth : 1000;
        const abH = artboardEl ? artboardEl.clientHeight : 650;
        newEl.style.left = `${Math.max(40, (abW - 350) / 2)}px`;
        newEl.style.top = `${Math.max(40, (abH - 300) / 2)}px`;
        newEl.style.zIndex = window.canvasEditor.getMaxZIndex() + 1;
        
        // Add layout trend classes if needed
        newEl.classList.add(`preset-${tokens.designTrend}`);
        if (tokens.animation !== 'none') {
            newEl.classList.add(`anim-${tokens.animation}`);
        }

        let className = '';
        newEl.classList.forEach(cls => {
            if (cls !== 'canvas-element' && cls !== 'text-element' && !cls.startsWith('preset-') && !cls.startsWith('anim-')) {
                className = cls;
            }
        });
        newEl.dataset.name = `AI ${className ? (className.charAt(0).toUpperCase() + className.slice(1)) : 'Card'}`;

        // Inject styles
        this.dynamicStylesheet.appendChild(document.createTextNode("\n" + component.css));
        this.codePreview.innerText = component.css;
        const htmlCodeContainer = document.getElementById('generated-html-code');
        if (htmlCodeContainer) {
            htmlCodeContainer.innerText = component.html;
        }

        // Add to canvas
        const artboard = document.getElementById('paint-artboard');
        artboard.appendChild(newEl);

        lucide.createIcons();
        window.canvasEditor.selectElement(newEl);
        window.canvasEditor.triggerHistorySave();
        window.canvasEditor.updateElementsCount();
        
        if (window.controlsManager) {
            window.controlsManager.updateLayersList();
        }

        // Play high-end UI success pop chime
        if (window.playUISound) {
            window.playUISound('success');
        }

        this.showStatus("✅ Element generated & validated!", false);
        setTimeout(() => this.statusBox.classList.add('hidden'), 3000);
    }

    // Full Site Preview — renders complete HTML in a fullscreen iframe overlay
    showFullSitePreview(fullHtml) {
        // Remove existing preview if any
        const existing = document.getElementById('full-site-preview-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'full-site-preview-overlay';
        overlay.innerHTML = `
            <div class="fsp-toolbar">
                <div class="fsp-toolbar-left">
                    <span class="fsp-badge">🌐 Live Site Preview</span>
                    <span class="fsp-info">Full HTML • AI Generated</span>
                </div>
                <div class="fsp-toolbar-right">
                    <button class="fsp-btn" id="fsp-download">⬇ Download HTML</button>
                    <button class="fsp-btn" id="fsp-copy">📋 Copy Code</button>
                    <button class="fsp-btn fsp-close" id="fsp-close">✕ Close Preview</button>
                </div>
            </div>
            <iframe id="fsp-iframe" sandbox="allow-scripts allow-same-origin allow-forms" frameborder="0"></iframe>
        `;
        document.body.appendChild(overlay);

        // Write full HTML into iframe (blob URL — safe, no XSS)
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        document.getElementById('fsp-iframe').src = blobUrl;

        // Store code for copy/download
        overlay._fullHtml = fullHtml;

        // Close
        document.getElementById('fsp-close').onclick = () => {
            URL.revokeObjectURL(blobUrl);
            overlay.remove();
        };

        // Download
        document.getElementById('fsp-download').onclick = () => {
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `designcraft-site-${Date.now()}.html`;
            a.click();
        };

        // Copy
        document.getElementById('fsp-copy').onclick = () => {
            navigator.clipboard.writeText(fullHtml).then(() => {
                document.getElementById('fsp-copy').textContent = '✅ Copied!';
                setTimeout(() => document.getElementById('fsp-copy').textContent = '📋 Copy Code', 2000);
            });
        };

        // Also store in code panel
        const htmlContainer = document.getElementById('generated-html-code');
        if (htmlContainer) htmlContainer.innerText = fullHtml;

        this.showStatus('✅ Full site generated!', false);
        setTimeout(() => this.statusBox.classList.add('hidden'), 3000);
    }

    // WCAG CONTRAST RATIO MATH
    calculateContrast(h1, s1, l1, h2, s2, l2) {
        const rgb1 = this.hslToRgb(h1, s1, l1);
        const rgb2 = this.hslToRgb(h2, s2, l2);

        const lum1 = this.getRelativeLuminance(rgb1[0], rgb1[1], rgb1[2]);
        const lum2 = this.getRelativeLuminance(rgb2[0], rgb2[1], rgb2[2]);

        const brighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);

        return (brighter + 0.05) / (darker + 0.05);
    }

    getRelativeLuminance(r, g, b) {
        const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    showStatus(msg, isSpinner = true) {
        this.statusText.innerText = msg;
        this.statusBox.querySelector('.spinner').style.display = isSpinner ? 'block' : 'none';
        this.statusBox.classList.remove('hidden');
    }

    copyGeneratedCode() {
        const isCss = this.activeCodeTab === 'css';
        const codeElement = isCss ? this.codePreview : document.getElementById('generated-html-code');
        const code = codeElement ? codeElement.innerText : '';
        
        if (!code || code.startsWith('/*') || code.startsWith('<!--')) return;
        
        navigator.clipboard.writeText(code).then(() => {
            alert(`AI-generated ${isCss ? 'CSS' : 'HTML'} copied to clipboard!`);
        });
    }
}

// Export singleton instance
window.aiService = new AIService();
