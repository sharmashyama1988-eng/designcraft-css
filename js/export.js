/* DesignCraft Export Utility
   Compiles elements on the canvas into clean, class-based, standard-compliant 
   HTML and CSS. Creates separated and combined components, copy functions, 
   and handles ZIP archive generations. */

class ExportService {
    constructor() {
        this.btnExport = document.getElementById('btn-export');
        this.modalExport = document.getElementById('modal-export');
        this.modalExportClose = document.getElementById('modal-export-close');
        
        this.codeCombined = document.getElementById('code-combined-out');
        this.codeHtml = document.getElementById('code-html-out');
        this.codeCss = document.getElementById('code-css-out');
        
        this.initEvents();
    }

    initEvents() {
        this.btnExport?.addEventListener('click', () => this.openExportModal());
        this.modalExportClose?.addEventListener('click', () => this.modalExport.classList.add('hidden'));
        
        // Tab navigators in Modal
        this.modalExport.querySelectorAll('.modal-tab').forEach(btn => {
            btn?.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.modalTab;
                
                this.modalExport.querySelectorAll('.modal-tab').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                this.modalExport.querySelectorAll('.modal-tab-content').forEach(content => {
                    content.classList.toggle('active', content.id === targetTab);
                });
            });
        });

        // Copy buttons
        document.getElementById('btn-copy-combined')?.addEventListener('click', () => this.copyToClipboard(this.codeCombined, "Combined code"));
        document.getElementById('btn-copy-html')?.addEventListener('click', () => this.copyToClipboard(this.codeHtml, "HTML structure"));
        document.getElementById('btn-copy-css')?.addEventListener('click', () => this.copyToClipboard(this.codeCss, "CSS stylesheet"));
        
        // Downloads
        document.getElementById('btn-download-html')?.addEventListener('click', () => this.downloadSingleHtml());
        document.getElementById('btn-download-project')?.addEventListener('click', () => this.downloadZipArchive());
    }

    openExportModal() {
        this.modalExport.classList.remove('hidden');
        this.compileProject();
    }

    compileProject() {
        const artboard = document.getElementById('paint-artboard');
        const elements = artboard.querySelectorAll('.canvas-element');
        
        if (elements.length === 0) {
            this.codeCombined.innerText = "<!-- Artboard is empty. Add elements to export code. -->";
            this.codeHtml.innerText = "<!-- Artboard is empty -->";
            this.codeCss.innerText = "/* Artboard is empty */";
            return;
        }

        let cssRules = [];
        let htmlElements = [];

        // Add base container style
        const artboardBg = artboard.style.backgroundColor || "#121216";
        cssRules.push(`.artboard-container {\n  position: relative;\n  width: ${artboard.style.width};\n  height: ${artboard.style.height};\n  background-color: ${artboardBg};\n  overflow: hidden;\n  border-radius: 8px;\n  box-shadow: 0 10px 30px rgba(0,0,0,0.3);\n}`);

        // Add pre-built animations styling from canvas.css if elements use them
        let includedAnimations = new Set();
        
        elements.forEach((el, index) => {
            const elId = el.id || `el-${index}`;
            const className = `dc-${elId}`;
            
            // Clone node to clean up structural metadata attributes
            const clone = el.cloneNode(true);
            clone.removeAttribute('id');
            clone.removeAttribute('data-selected');
            
            // Handle element class conversions
            clone.className = clone.className.replace('canvas-element', '').trim();
            clone.classList.add(className);
            
            // Clean up custom variables and fetch animations used
            clone.classList.forEach(cls => {
                if (cls.startsWith('anim-')) {
                    includedAnimations.add(cls.replace('anim-', ''));
                }
            });

            // Extract inline styles to class rule
            const inlineStyles = el.style.cssText;
            if (inlineStyles) {
                // Remove pointer-events from export so elements are clickable/normal
                let cleanStyles = inlineStyles.replace(/pointer-events:\s*[^;]+;?/g, '').trim();
                cssRules.push(`.${className} {\n  ${cleanStyles.split(';').map(s => s.trim()).filter(Boolean).join(';\n  ')};\n}`);
            }

            // Remove inline style from HTML
            clone.removeAttribute('style');
            
            // Format HTML representation
            htmlElements.push(clone.outerHTML);
        });

        // Pull dynamic AI generated stylesheet declarations
        const dynamicStyleEl = document.getElementById('dynamic-ai-styles');
        let dynamicCss = dynamicStyleEl ? dynamicStyleEl.innerText.trim() : '';

        // Load keyframes for animations used
        let keyframesCss = '';
        if (includedAnimations.size > 0) {
            keyframesCss = `/* ANIMATION KEYFRAMES & UTILITIES */\n`;
            if (includedAnimations.has('pulse')) {
                keyframesCss += `@keyframes animation-pulse {\n  0%, 100% { transform: scale(1); }\n  50% { transform: scale(1.05); }\n}\n.anim-pulse {\n  animation: animation-pulse 2s ease-in-out infinite;\n}\n\n`;
            }
            if (includedAnimations.has('float')) {
                keyframesCss += `@keyframes animation-float {\n  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-15px); }\n}\n.anim-float {\n  animation: animation-float 3s ease-in-out infinite;\n}\n\n`;
            }
            if (includedAnimations.has('spin')) {
                keyframesCss += `@keyframes animation-spin {\n  from { transform: rotate(0deg); }\n  to { transform: rotate(360deg); }\n}\n.anim-spin {\n  animation: animation-spin 6s linear infinite;\n}\n\n`;
            }
            if (includedAnimations.has('neon-glow')) {
                keyframesCss += `@keyframes animation-neon-glow {\n  0%, 100% { box-shadow: 0 0 5px rgba(99,102,241,0.4); }\n  50% { box-shadow: 0 0 20px rgba(99,102,241,0.8), 0 0 35px rgba(99,102,241,0.5); }\n}\n.anim-neon-glow {\n  animation: animation-neon-glow 2.5s ease-in-out infinite;\n}\n\n`;
            }
            if (includedAnimations.has('jelly')) {
                keyframesCss += `@keyframes animation-jelly {\n  0%, 100% { transform: scale(1, 1); }\n  25% { transform: scale(0.9, 1.1); }\n  50% { transform: scale(1.1, 0.9); }\n}\n.anim-jelly {\n  animation: animation-jelly 1.5s ease-in-out infinite;\n}\n\n`;
            }
            if (includedAnimations.has('bounce')) {
                keyframesCss += `@keyframes animation-bounce {\n  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-25%); }\n}\n.anim-bounce {\n  animation: animation-bounce 1s infinite;\n}\n\n`;
            }
            if (includedAnimations.has('rainbow-text')) {
                keyframesCss += `@keyframes animation-rainbow-bg {\n  0% { background-position: 0% 50%; }\n  50% { background-position: 100% 50%; }\n  100% { background-position: 0% 50%; }\n}\n.anim-rainbow-text {\n  background: linear-gradient(to right, #ff007f, #7f00ff, #00f0ff, #7f00ff, #ff007f);\n  background-size: 200% auto;\n  color: transparent !important;\n  -webkit-background-clip: text !important;\n  background-clip: text !important;\n  animation: animation-rainbow-bg 4s linear infinite;\n}\n\n`;
            }
        }

        // Add CSS preset rules if used (e.g. preset-glass-light)
        let presetCss = '';
        const htmlStr = htmlElements.join('\n');
        if (htmlStr.includes('preset-glass-light')) {
            presetCss += `.preset-glass-light {\n  background: rgba(255, 255, 255, 0.4) !important;\n  backdrop-filter: blur(12px) saturate(180%) !important;\n  border: 1px solid rgba(255, 255, 255, 0.45) !important;\n  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08) !important;\n}\n`;
        }
        if (htmlStr.includes('preset-glass-dark')) {
            presetCss += `.preset-glass-dark {\n  background: rgba(15, 15, 20, 0.6) !important;\n  backdrop-filter: blur(16px) saturate(160%) !important;\n  border: 1px solid rgba(255, 255, 255, 0.08) !important;\n  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37) !important;\n}\n`;
        }
        if (htmlStr.includes('preset-neumorphic-light')) {
            presetCss += `.preset-neumorphic-light {\n  background: #e0e0e0 !important;\n  box-shadow: 9px 9px 16px #bebebe, -9px -9px 16px #ffffff !important;\n  border-radius: 20px;\n}\n`;
        }
        if (htmlStr.includes('preset-neumorphic-dark')) {
            presetCss += `.preset-neumorphic-dark {\n  background: #1e1e24 !important;\n  box-shadow: 6px 6px 12px #0f0f12, -6px -6px 12px #2d2d36 !important;\n  border-radius: 20px;\n}\n`;
        }
        if (htmlStr.includes('preset-cyberpunk')) {
            presetCss += `.preset-cyberpunk {\n  background: #000000 !important;\n  border: 2px solid #00f0ff !important;\n  box-shadow: 0 0 10px #00f0ff, inset 0 0 10px #00f0ff, 0 0 20px #ff007f !important;\n  color: #00f0ff !important;\n  font-family: 'Courier New', monospace !important;\n  text-shadow: 0 0 5px #00f0ff !important;\n}\n`;
        }
        if (htmlStr.includes('preset-aurora')) {
            presetCss += `.preset-aurora {\n  background: linear-gradient(135deg, #ff007f 0%, #7f00ff 50%, #00f0ff 100%) !important;\n  box-shadow: 0 0 30px rgba(127, 0, 255, 0.5) !important;\n  color: #ffffff !important;\n}\n`;
        }
        if (htmlStr.includes('preset-retro')) {
            presetCss += `.preset-retro {\n  background: #f8f9fa !important;\n  border: 4px solid #212529 !important;\n  box-shadow: 4px 4px 0px #212529 !important;\n  border-radius: 0px !important;\n}\n`;
        }

        // Format Complete CSS
        const fullCss = `/* DesignCraft Generated Stylesheet */\n\n${cssRules.join('\n\n')}\n\n${presetCss}${dynamicCss ? '\n/* AI Injected Styles */\n' + dynamicCss + '\n' : ''}\n${keyframesCss}`.trim();
        this.codeCss.innerText = fullCss;

        // Format HTML structure
        const indentHtml = htmlElements.map(el => `  ${el}`).join('\n');
        const fullHtml = `<div class="artboard-container">\n${indentHtml}\n</div>`;
        this.codeHtml.innerText = fullHtml;

        // Combined Template Output
        const combined = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DesignCraft CSS Component</title>
  <!-- Outfit & Inter Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #0b0b0d;
      font-family: 'Inter', sans-serif;
    }
    
    ${fullCss.replace(/\n/g, '\n    ')}
  </style>
</head>
<body>

  ${fullHtml.replace(/\n/g, '\n  ')}

</body>
</html>`;
        this.codeCombined.innerText = combined;
    }

    copyToClipboard(element, label) {
        const text = element.innerText;
        navigator.clipboard.writeText(text).then(() => {
            alert(`${label} successfully copied to clipboard!`);
        });
    }

    downloadSingleHtml() {
        const blob = new Blob([this.codeCombined.innerText], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${window.firebaseService.activeProjectName || 'designcraft-component'}.html`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async downloadZipArchive() {
        const zipName = window.firebaseService.activeProjectName || 'designcraft-project';
        const zip = new JSZip();
        
        // 1. Create clean index.html template linked to style.css
        const cleanHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${zipName} - DesignCraft</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
  <!-- Lucide Icons CDN -->
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body style="margin: 0; padding: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #0b0b0d; font-family: 'Inter', sans-serif;">

  ${this.codeHtml.innerText.replace(/\n/g, '\n  ')}

  <script>
    // Initialize icons if any
    lucide.createIcons();
  </script>
</body>
</html>`;

        // 2. Generate zip contents
        zip.file("index.html", cleanHtml);
        zip.file("style.css", this.codeCss.innerText);
        
        // 3. Compress and download
        this.showSpinnerOnZipButton(true);
        try {
            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${zipName}.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("ZIP Generation failed", err);
            alert("Failed to build ZIP file. Please copy the code blocks instead.");
        } finally {
            this.showSpinnerOnZipButton(false);
        }
    }

    showSpinnerOnZipButton(isLoading) {
        const btn = document.getElementById('btn-download-project');
        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = '<div class="spinner" style="width:14px; height:14px; border-width:1.5px; margin:0 auto;"></div> Compressing...';
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="archive"></i> Download Complete Project (.zip)';
            lucide.createIcons();
        }
    }
}

// Export singleton instance
window.exportService = new ExportService();
