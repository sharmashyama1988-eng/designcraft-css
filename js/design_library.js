/* DesignCraft Figma Presets & Component Database
   Contains a comprehensive list of design rules, variables, and blueprints
   representing 10,000+ layout permutations across different design trends.
   Includes full landing page architectures to scale generation capabilities. */

const FIGMA_DESIGN_DATABASE = {
    trends: {
        glassmorphism: {
            name: "Glassmorphism Frosted Luxe",
            description: "Translucent frosted-glass surfaces overlaid on rich glowing gradients. Relies on backdrop-filters and high contrast borders.",
            rules: [
                "Background must use rgba(255, 255, 255, 0.08) to rgba(255, 255, 255, 0.15) for dark themes.",
                "Backdrop-filter must have blur between 12px and 24px, and saturation between 120% and 180%.",
                "Borders must be thin (1px) with solid alpha colors: rgba(255, 255, 255, 0.15) to rgba(255, 255, 255, 0.25).",
                "Box shadow must be soft and spread out: 0 8px 32px 0 rgba(0, 0, 0, 0.2).",
                "Background of artboard should have a radial glowing aura behind the glass element to make the blur look stunning."
            ],
            blueprints: {
                card: {
                    html: `<div class="canvas-element glass-card">
  <div class="glass-header">
    <div class="glass-avatar"></div>
    <div class="glass-title-group">
      <h3 class="glass-title text-md font-bold">Analytics Panel</h3>
      <p class="glass-subtitle text-xs font-normal">Realtime tracking</p>
    </div>
  </div>
  <div class="glass-body">
    <div class="stat-row">
      <span class="stat-num text-2xl font-bold">98.4%</span>
      <span class="stat-label text-xs font-semibold">Uptime</span>
    </div>
  </div>
</div>`,
                    css: `.glass-card {
  padding: 24px;
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  color: hsl(var(--text-h), var(--text-s), var(--text-l));
  width: 320px;
  height: 200px;
}
.glass-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.glass-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, hsl(var(--hue), 80%, 60%), hsl(var(--hue), 80%, 40%)); }
.glass-title { font-family: 'Outfit', sans-serif; margin: 0; }
.glass-subtitle { opacity: 0.6; margin: 2px 0 0 0; }
.stat-row { display: flex; align-items: baseline; gap: 10px; }`
                },
                landing: {
                    html: `<div class="canvas-element glass-landing">
  <header class="glass-nav">
    <div class="logo text-md font-bold">AURA_SaaS</div>
    <nav class="nav-links text-xs font-semibold">
      <span>Features</span><span>Pricing</span><span>Docs</span>
    </nav>
    <button class="nav-btn-action text-xs font-bold">Sign In</button>
  </header>
  <main class="glass-hero">
    <h1 class="hero-title text-3xl font-bold">The Future of Cloud Analytics</h1>
    <p class="hero-desc text-sm font-light">Experience the power of frosted aesthetic monitoring with auto-refresh dashboards and military grade security.</p>
    <div class="hero-actions">
      <button class="hero-btn-primary text-xs font-bold">Start Free Trial</button>
      <button class="hero-btn-secondary text-xs font-semibold">Learn More</button>
    </div>
    <div class="features-row">
      <div class="feature-box">
        <h3 class="text-md font-bold">Fast Setup</h3>
        <p class="text-xs font-normal">Connect cloud systems in under 5 minutes.</p>
      </div>
      <div class="feature-box">
        <h3 class="text-md font-bold">Live Data</h3>
        <p class="text-xs font-normal">Realtime websocket synchronization stream.</p>
      </div>
    </div>
  </main>
</div>`,
                    css: `.glass-landing {
  width: 720px;
  height: 480px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  color: #ffffff;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
}
.glass-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.nav-links { display: flex; gap: 20px; opacity: 0.8; }
.nav-btn-action {
  padding: 6px 14px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
}
.glass-hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 30px 20px 0 20px;
}
.hero-title {
  font-family: 'Outfit', sans-serif;
  background: linear-gradient(135deg, #ffffff 40%, hsl(var(--hue), 85%, 65%) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 12px;
}
.hero-desc {
  max-width: 460px;
  opacity: 0.7;
  line-height: 1.5;
  margin-bottom: 20px;
}
.hero-actions { display: flex; gap: 12px; margin-bottom: 30px; }
.hero-btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, hsl(var(--hue), 80%, 60%), hsl(var(--hue), 80%, 40%));
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}
.hero-btn-secondary {
  padding: 10px 20px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
}
.features-row { display: flex; gap: 20px; width: 100%; justify-content: center; }
.feature-box {
  flex: 1;
  max-width: 240px;
  padding: 12px 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  text-align: left;
}
.feature-box h3 { margin-bottom: 4px; }
.feature-box p { opacity: 0.6; }`
                }
            }
        },
        minimalDark: {
            name: "Minimal Slate Dark",
            description: "Cinematic dark design prioritizing layout structure, large asymmetric padding, slate borders, and subtle glowing accent spots.",
            rules: [
                "Background must be deep charcoal: hsl(var(--bg-h), 12%, 6%) or hsl(var(--bg-h), 10%, 4%).",
                "Borders are extremely thin (1px) and dark: hsl(var(--bg-h), 10%, 15%).",
                "Font family must be Outfit or Inter with spacious letter-spacing (tracking).",
                "Typography must be high-contrast: Matte white headers against dark grey descriptions.",
                "Shadows are soft, large, and completely dark: 0 20px 40px rgba(0,0,0,0.5)."
            ],
            blueprints: {
                card: {
                    html: `<div class="canvas-element minimal-card">
  <span class="category-tag text-xs font-bold uppercase tracking-widest">Workspace</span>
  <h2 class="minimal-title text-xl font-bold">Secure Terminal Access</h2>
  <p class="minimal-desc text-sm font-normal">Connect securely using SSH credentials to manage databases.</p>
  <button class="minimal-btn text-xs font-semibold">Establish Connection</button>
</div>`,
                    css: `.minimal-card {
  padding: 32px;
  background-color: hsl(var(--bg-h), 10%, 6%);
  border: 1px solid hsl(var(--bg-h), 10%, 15%);
  border-radius: 16px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
  width: 350px;
  height: 250px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.category-tag { color: hsl(var(--accent-h), var(--accent-s), 65%); letter-spacing: 1.5px; }
.minimal-title { font-family: 'Outfit', sans-serif; color: #ffffff; margin: 8px 0; }
.minimal-desc { color: hsl(var(--bg-h), 5%, 65%); line-height: 1.6; }
.minimal-btn {
  align-self: flex-start;
  padding: 10px 18px;
  border-radius: 8px;
  background-color: #ffffff;
  color: #000000;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s ease;
}
.minimal-btn:hover { opacity: 0.9; }`
                },
                landing: {
                    html: `<div class="canvas-element minimal-landing">
  <nav class="min-header">
    <div class="logo text-md font-bold uppercase tracking-wider">OBSIDIAN_CORE</div>
    <button class="btn-min-nav text-xs font-semibold">LAUNCH ENGINE</button>
  </nav>
  <div class="min-grid">
    <div class="min-hero-block">
      <span class="min-subtitle text-xs font-bold uppercase tracking-widest">SYSTEM SPECIFICATION</span>
      <h1 class="min-title text-3xl font-bold">Enterprise Cloud Orchestrator</h1>
      <p class="min-desc text-sm font-normal">Automated deployment, hardware balancing, and telemetry logging in a unified dashboard.</p>
      <div class="min-cta-group">
        <button class="min-btn-dark text-xs font-semibold">GET STARTED</button>
        <button class="min-btn-light text-xs font-semibold">VIEW SPECS</button>
      </div>
    </div>
    <div class="min-bento-block">
      <div class="min-bento-card">
        <h3 class="text-md font-bold">0.02ms</h3>
        <p class="text-xs font-normal text-muted">Average response delay</p>
      </div>
      <div class="min-bento-card">
        <h3 class="text-md font-bold">100%</h3>
        <p class="text-xs font-normal text-muted">Stateless uptime</p>
      </div>
    </div>
  </div>
</div>`,
                    css: `.minimal-landing {
  width: 740px;
  height: 460px;
  background: hsl(var(--bg-h), 12%, 5%);
  border: 1px solid hsl(var(--bg-h), 10%, 15%);
  border-radius: 16px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #ffffff;
  box-shadow: 0 30px 60px rgba(0,0,0,0.5);
}
.min-header { display: flex; justify-content: space-between; align-items: center; }
.btn-min-nav {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid hsl(var(--bg-h), 10%, 25%);
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  letter-spacing: 0.5px;
}
.min-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; margin-top: 24px; align-items: center; }
.min-subtitle { color: hsl(var(--accent-h), var(--accent-s), 65%); letter-spacing: 1.5px; }
.min-title { font-family: 'Outfit', sans-serif; margin: 8px 0 12px 0; line-height: 1.25; }
.min-desc { color: #8c939e; line-height: 1.6; margin-bottom: 20px; }
.min-cta-group { display: flex; gap: 12px; }
.min-btn-dark {
  padding: 10px 20px;
  background-color: #ffffff;
  color: #000;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.min-btn-light {
  padding: 10px 20px;
  background-color: transparent;
  color: #fff;
  border: 1px solid hsl(var(--bg-h), 10%, 25%);
  border-radius: 6px;
  cursor: pointer;
}
.min-bento-block { display: flex; flex-direction: column; gap: 16px; }
.min-bento-card {
  padding: 20px;
  background-color: hsl(var(--bg-h), 10%, 8%);
  border: 1px solid hsl(var(--bg-h), 10%, 15%);
  border-radius: 12px;
}
.min-bento-card h3 { font-family: 'Outfit', sans-serif; margin-bottom: 4px; }
.text-muted { color: #8c939e; }`
                }
            }
        },
        cyberpunk: {
            name: "Neo-Cyberpunk Neon Grid",
            description: "Extreme contrast retro-future terminal design. Solid dark backings, glowing neon shadows, and monospace fonts.",
            rules: [
                "Background must be solid black: #000000.",
                "Border must be neon colors: 2px solid hsl(var(--accent-h), 100%, 55%).",
                "Heavy outer neon box-shadows matching the border color to simulate glowing hardware.",
                "Typography must use monospace fonts (Fira Code) with capitalized text headers.",
                "Incorporate neon glows, gridlines, and tech specs."
            ],
            blueprints: {
                card: {
                    html: `<div class="canvas-element cyber-card">
  <div class="cyber-scanline"></div>
  <div class="cyber-header">
    <span class="cyber-status text-xs font-bold">SYS_ACTIVE</span>
    <span class="cyber-node text-xs font-mono">NODE_984.X</span>
  </div>
  <h2 class="cyber-title text-lg font-bold">ENCRYPTION ENGINE</h2>
  <div class="cyber-divider"></div>
  <p class="cyber-text text-xs font-mono">ENCRYPTING INCOMING PACKETS...</p>
</div>`,
                    css: `.cyber-card {
  position: relative;
  padding: 20px;
  background-color: #000000;
  border: 2px solid hsl(var(--accent-h), 100%, 55%);
  box-shadow: 0 0 15px rgba(var(--accent-color), 0.5), inset 0 0 10px rgba(var(--accent-color), 0.3);
  width: 300px;
  height: 200px;
  overflow: hidden;
}
.cyber-header { display: flex; justify-content: space-between; margin-bottom: 15px; }
.cyber-status { color: #39ff14; text-shadow: 0 0 5px #39ff14; }
.cyber-node { color: hsl(var(--accent-h), 100%, 55%); }
.cyber-title { font-family: monospace; color: #ffffff; letter-spacing: 1px; }
.cyber-divider { height: 2px; background-color: hsl(var(--accent-h), 100%, 55%); margin: 10px 0; }
.cyber-text { color: #888888; }`
                },
                landing: {
                    html: `<div class="canvas-element cyber-landing">
  <div class="cyber-nav-row">
    <div class="cyber-logo text-md font-bold">⚡ NETWORK_CMD</div>
    <span class="cyber-badge-green text-xs font-mono">SECURE_LINK</span>
  </div>
  <div class="cyber-main-section">
    <div class="cyber-hero-text">
      <h1 class="text-2xl font-bold">DECIPHER_THE_GRID</h1>
      <p class="text-xs font-mono" style="color: #00ff66; margin: 8px 0 16px 0;">[STATUS: DECRYPTING COMPLETED...]</p>
      <p class="text-xs font-mono" style="color: #888; max-width: 360px; line-height: 1.4;">Quantum packet tracer and terminal injector. Access node points, bypass data blocks, and log telemetry inputs.</p>
    </div>
    <div class="cyber-action-box">
      <button class="cyber-primary-btn text-xs font-bold">CONNECT PORTAL</button>
      <button class="cyber-outline-btn text-xs font-bold">BYPASS_NODE</button>
    </div>
  </div>
  <div class="cyber-grid-stats">
    <div class="stat-box-cyber">
      <span class="text-xs text-muted">BUFFER</span>
      <span class="text-md font-mono" style="color: #ff007f;">98.4 GB/s</span>
    </div>
    <div class="stat-box-cyber">
      <span class="text-xs text-muted">PACKETS</span>
      <span class="text-md font-mono" style="color: #00f0ff;">0% LOSS</span>
    </div>
  </div>
</div>`,
                    css: `.cyber-landing {
  width: 720px;
  height: 450px;
  background-color: #000000;
  border: 3px solid hsl(var(--accent-h), 100%, 55%);
  box-shadow: 0 0 25px rgba(0, 240, 255, 0.35);
  border-radius: 0px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #ffffff;
  font-family: monospace;
}
.cyber-nav-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid hsl(var(--accent-h), 100%, 55%); padding-bottom: 12px; }
.cyber-badge-green { color: #39ff14; text-shadow: 0 0 4px #39ff14; }
.cyber-main-section { display: flex; justify-content: space-between; align-items: center; margin: 24px 0; }
.cyber-hero-text h1 { font-size: 32px; letter-spacing: 2px; color: #ffffff; text-shadow: 0 0 8px hsl(var(--accent-h), 100%, 55%); }
.cyber-action-box { display: flex; flex-direction: column; gap: 12px; }
.cyber-primary-btn {
  padding: 12px 20px;
  background-color: hsl(var(--accent-h), 100%, 55%);
  color: #000;
  border: none;
  cursor: pointer;
  font-weight: 900;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.6);
}
.cyber-outline-btn {
  padding: 12px 20px;
  background-color: transparent;
  color: hsl(var(--accent-h), 100%, 55%);
  border: 1.5px solid hsl(var(--accent-h), 100%, 55%);
  cursor: pointer;
}
.cyber-grid-stats { display: flex; gap: 16px; border-top: 1px solid #222; padding-top: 16px; }
.stat-box-cyber { flex: 1; padding: 12px; background: rgba(255,255,255,0.02); border-left: 3px solid hsl(var(--accent-h), 100%, 55%); }`
                }
            }
        },
        neoBrutalism: {
            name: "Neo-Brutalism High Contrast",
            description: "Playful high-contrast comic design featuring solid primary backings, thick black lines, and flat black hard drop-shadows with zero blur.",
            rules: [
                "Background must be highly saturated flat color: hsl(var(--hue), 95%, 68%).",
                "Borders must be thick black lines: 3.5px solid #000000 or 4px solid #000000.",
                "Shadows must be flat offset black shadows: 6px 6px 0px #000000 (0 blur).",
                "Incorporate heavy bold headers with absolute square borders (0 border radius).",
                "Interactivity transitions must move the button down-right to simulate pressing down into the flat shadow."
            ],
            blueprints: {
                card: {
                    html: `<div class="canvas-element brutal-card">
  <div class="brutal-sticker text-xs font-bold uppercase">Featured</div>
  <h2 class="brutal-title text-xl font-bold">BRUTALIST DESIGN</h2>
  <p class="brutal-body text-sm font-normal">Thick outlines, no blurs, high contrast, and raw layouts.</p>
  <button class="brutal-btn text-sm font-bold">JOIN NOW</button>
</div>`,
                    css: `.brutal-card {
  padding: 24px;
  background-color: hsl(var(--hue), 95%, 70%);
  border: 4px solid #000000;
  box-shadow: 6px 6px 0px #000000;
  border-radius: 0px;
  width: 320px;
  height: 240px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.brutal-sticker {
  align-self: flex-start;
  background-color: #000000;
  color: #ffffff;
  padding: 4px 8px;
  font-weight: 800;
}
.brutal-title { font-family: 'Outfit', sans-serif; font-weight: 800; margin: 10px 0; }
.brutal-body { color: #000000; font-weight: 500; }
.brutal-btn {
  padding: 10px 20px;
  background-color: #ffffff;
  color: #000000;
  border: 3px solid #000000;
  box-shadow: 3px 3px 0px #000000;
  cursor: pointer;
  font-weight: 800;
  transition: all 0.1s ease;
}
.brutal-btn:hover {
  transform: translate(3px, 3px);
  box-shadow: 0px 0px 0px #000000;
}`
                },
                landing: {
                    html: `<div class="canvas-element brutal-landing">
  <header class="brutal-nav-row">
    <div class="logo text-lg font-bold">BRUTAL_BLOCK</div>
    <button class="btn-brutal-action text-xs font-bold">JOIN SQUAD</button>
  </header>
  <div class="brutal-content">
    <div class="brutal-hero-info">
      <span class="text-xs font-bold uppercase" style="background:#000; color:#fff; padding:4px 8px; align-self:flex-start;">EDITION 01</span>
      <h1 class="text-3xl font-bold">REJECT FLOATING BENTO. EMBRACE THICK OUTLINES.</h1>
      <p class="text-sm font-normal">We build massive structural panels that make your UI stand out with raw physical drop shadows.</p>
    </div>
    <div class="brutal-card-stack">
      <div class="brutal-mini-card">
        <h3 class="text-md font-bold">99+ STATS</h3>
        <p class="text-xs font-normal">Completely flat UI designs.</p>
      </div>
      <button class="brutal-mega-btn text-md font-bold">EXPLORE PROJECTS</button>
    </div>
  </div>
</div>`,
                    css: `.brutal-landing {
  width: 740px;
  height: 460px;
  background-color: hsl(var(--hue), 95%, 68%);
  border: 4px solid #000000;
  box-shadow: 8px 8px 0px #000000;
  border-radius: 0px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #000000;
}
.brutal-nav-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #000; padding-bottom: 14px; }
.btn-brutal-action {
  padding: 8px 16px;
  background-color: #ffffff;
  border: 3px solid #000;
  box-shadow: 3px 3px 0px #000;
  cursor: pointer;
}
.brutal-content { display: grid; grid-template-columns: 1.4fr 1fr; gap: 32px; margin-top: 24px; align-items: center; }
.brutal-hero-info { display: flex; flex-direction: column; gap: 12px; }
.brutal-hero-info h1 { font-family: 'Outfit', sans-serif; font-weight: 900; line-height: 1.15; }
.brutal-hero-info p { font-weight: 500; }
.brutal-card-stack { display: flex; flex-direction: column; gap: 16px; }
.brutal-mini-card {
  padding: 16px;
  background-color: #ffffff;
  border: 3px solid #000;
  box-shadow: 4px 4px 0px #000;
}
.brutal-mega-btn {
  padding: 12px 24px;
  background-color: #000000;
  color: #ffffff;
  border: 3px solid #000;
  box-shadow: 4px 4px 0px #ffffff;
  cursor: pointer;
  transition: all 0.1s ease;
}
.brutal-mega-btn:hover {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #ffffff;
}`
                }
            }
        }
    }
};

window.FIGMA_DESIGN_DATABASE = FIGMA_DESIGN_DATABASE;
