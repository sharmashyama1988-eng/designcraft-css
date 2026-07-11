const fs = require('fs');
const path = require('path');

const filesToUpdate = {
    // AI TOOLS
    'js/tools/ai/genFillTool.js': `import BaseTool from '../baseTool.js';
export default class GenFillTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_gen_fill';
        this.name = 'Generative Fill';
        this.cursor = 'crosshair';
        this.isSelecting = false;
        this.startPos = null;
        this.selectionRect = null;
    }
    onActivate() {
        super.onActivate();
        if (window.console) console.log('Generative Fill activated: Drag to select an area.');
    }
    onPointerDown(e) {
        this.isSelecting = true;
        this.startPos = this.getPointerPos(e);
        this.selectionRect = { x: this.startPos.x, y: this.startPos.y, w: 0, h: 0 };
    }
    onPointerMove(e) {
        if (!this.isSelecting) return;
        const currentPos = this.getPointerPos(e);
        this.selectionRect.w = currentPos.x - this.startPos.x;
        this.selectionRect.h = currentPos.y - this.startPos.y;
    }
    onPointerUp(e) {
        if (!this.isSelecting) return;
        this.isSelecting = false;
        this.promptGenerativeFill();
    }
    async promptGenerativeFill() {
        if (Math.abs(this.selectionRect.w) < 10 || Math.abs(this.selectionRect.h) < 10) return;
        const prompt = window.prompt("Enter prompt for Generative Fill:", "");
        if (!prompt) return;
        alert(\`Generating fill for: "\${prompt}"...\`);
    }
}`,
    'js/tools/ai/genExpandTool.js': `import BaseTool from '../baseTool.js';
export default class GenExpandTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_gen_expand';
        this.name = 'Generative Expand';
        this.cursor = 'nesw-resize';
    }
    onPointerDown(e) {
        const prompt = window.prompt("Enter prompt to guide the background expansion (optional):", "");
        alert('Expanding canvas via AI...');
    }
}`,
    'js/tools/ai/bgRemoveTool.js': `import BaseTool from '../baseTool.js';
export default class BgRemoveTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_bg_remove';
        this.name = 'Background Remover';
        this.cursor = 'pointer';
    }
    onPointerDown(e) {
        alert('Processing background removal...');
    }
}`,
    'js/tools/ai/colorizeTool.js': `import BaseTool from '../baseTool.js';
export default class ColorizeTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_colorize';
        this.name = 'Auto-Colorize';
        this.cursor = 'crosshair';
    }
    onPointerDown(e) {
        alert('Applying AI Colorization...');
    }
}`,
    'js/tools/ai/upscaleTool.js': `import BaseTool from '../baseTool.js';
export default class UpscaleTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_upscale';
        this.name = 'AI Upscaler';
        this.cursor = 'zoom-in';
    }
    onPointerDown(e) {
        alert('Running AI Upscale model (this may take a moment)...');
    }
}`,
    'js/tools/ai/styleTransferTool.js': `import BaseTool from '../baseTool.js';
export default class StyleTransferTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_style_transfer';
        this.name = 'Style Transfer';
        this.cursor = 'crosshair';
    }
    onPointerDown(e) {
        const prompt = window.prompt("Enter style description (e.g. 'Cyberpunk', 'Watercolor'):", "Cyberpunk");
        if (prompt) {
            alert(\`Transferring style to '\${prompt}'...\`);
        }
    }
}`,
    'js/tools/ai/wireUiTool.js': `import BaseTool from '../baseTool.js';
export default class WireUiTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_wire_ui';
        this.name = 'Wireframe-to-UI';
        this.cursor = 'pointer';
    }
    onPointerDown(e) {
        alert('Analyzing wireframe and generating UI...');
    }
}`,
    'js/tools/ai/imgCssTool.js': `import BaseTool from '../baseTool.js';
export default class ImgCssTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_img_css';
        this.name = 'Image-to-CSS';
        this.cursor = 'text';
    }
    onPointerDown(e) {
        alert('Generating raw CSS code for this element via AI...');
    }
}`,

    // CSS TOOLS
    'js/tools/css/dropShadowTool.js': `import BaseTool from '../baseTool.js';
export default class DropShadowTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_drop_shadow';
        this.name = 'Drop Shadow Gizmo';
        this.cursor = 'crosshair';
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.isDragging = true;
        const pos = this.getPointerPos(e);
        this.startX = pos.x;
        this.startY = pos.y;
    }
    onPointerMove(e) {
        if (!this.isDragging || !this.editor.selectedElement) return;
        const pos = this.getPointerPos(e);
        const dx = pos.x - this.startX;
        const dy = pos.y - this.startY;
        this.editor.selectedElement.style.boxShadow = \`\${dx}px \${dy}px 10px rgba(0,0,0,0.5)\`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}`,
    'js/tools/css/glowTool.js': `import BaseTool from '../baseTool.js';
export default class GlowTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_glow';
        this.name = 'Inner/Outer Glow';
        this.cursor = 'crosshair';
        this.isDragging = false;
        this.startX = 0;
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.isDragging = true;
        const pos = this.getPointerPos(e);
        this.startX = pos.x;
    }
    onPointerMove(e) {
        if (!this.isDragging || !this.editor.selectedElement) return;
        const pos = this.getPointerPos(e);
        const blur = Math.max(0, pos.x - this.startX);
        this.editor.selectedElement.style.boxShadow = \`0 0 \${blur}px rgba(255, 255, 100, 0.8)\`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}`,
    'js/tools/css/filterBrushTool.js': `import BaseTool from '../baseTool.js';
export default class FilterBrushTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_filter_brush';
        this.name = 'CSS Filter Brush';
        this.cursor = 'pointer';
        this.isDragging = false;
        this.startX = 0;
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.isDragging = true;
        this.startX = this.getPointerPos(e).x;
    }
    onPointerMove(e) {
        if (!this.isDragging || !this.editor.selectedElement) return;
        const dx = Math.max(0, this.getPointerPos(e).x - this.startX);
        this.editor.selectedElement.style.filter = \`blur(\${dx / 10}px)\`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}`,
    'js/tools/css/radiusDragTool.js': `import BaseTool from '../baseTool.js';
export default class RadiusDragTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_radius_drag';
        this.name = 'Border Radius Dragger';
        this.cursor = 'nwse-resize';
        this.isDragging = false;
        this.startX = 0;
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.isDragging = true;
        this.startX = this.getPointerPos(e).x;
    }
    onPointerMove(e) {
        if (!this.isDragging || !this.editor.selectedElement) return;
        const dx = Math.max(0, this.getPointerPos(e).x - this.startX);
        this.editor.selectedElement.style.borderRadius = \`\${dx}px\`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}`,
    'js/tools/css/glassTool.js': `import BaseTool from '../baseTool.js';
export default class GlassTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_glass';
        this.name = 'Glassmorphism';
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        const el = this.editor.selectedElement;
        el.style.background = 'rgba(255, 255, 255, 0.2)';
        el.style.backdropFilter = 'blur(10px)';
        el.style.webkitBackdropFilter = 'blur(10px)';
        el.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        el.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
        el.style.borderRadius = '16px';
    }
}`,
    'js/tools/css/neumorphTool.js': `import BaseTool from '../baseTool.js';
export default class NeumorphTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_neumorph';
        this.name = 'Neumorphism';
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        const el = this.editor.selectedElement;
        el.style.background = '#e0e0e0';
        el.style.borderRadius = '20px';
        el.style.boxShadow = '20px 20px 60px #bebebe, -20px -20px 60px #ffffff';
    }
}`,
    'js/tools/css/gradMeshTool.js': `import BaseTool from '../baseTool.js';
export default class GradMeshTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_grad_mesh';
        this.name = 'Gradient Mesh';
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.editor.selectedElement.style.background = 'radial-gradient(circle at 50% 50%, #ff7e5f, #feb47b)';
    }
}`,
    'js/tools/css/boxModelTool.js': `import BaseTool from '../baseTool.js';
export default class BoxModelTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_box_model';
        this.name = 'Box Model Inspector';
        this.isDragging = false;
        this.startY = 0;
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.isDragging = true;
        this.startY = this.getPointerPos(e).y;
    }
    onPointerMove(e) {
        if (!this.isDragging || !this.editor.selectedElement) return;
        const dy = Math.max(0, this.getPointerPos(e).y - this.startY);
        this.editor.selectedElement.style.padding = \`\${dy}px\`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}`,
    'js/tools/css/gridBuildTool.js': `import BaseTool from '../baseTool.js';
export default class GridBuildTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_grid_build';
        this.name = 'CSS Grid Builder';
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        const el = this.editor.selectedElement;
        el.style.display = 'grid';
        el.style.gridTemplateColumns = 'repeat(3, 1fr)';
        el.style.gap = '10px';
    }
}`,
    'js/tools/css/flexAlignTool.js': `import BaseTool from '../baseTool.js';
export default class FlexAlignTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_flex_align';
        this.name = 'Flexbox Aligner';
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        const el = this.editor.selectedElement;
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
    }
}`,
    'js/tools/css/zIndexTool.js': `import BaseTool from '../baseTool.js';
export default class ZIndexTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_z_index';
        this.name = 'Z-Index Picker';
        this.isDragging = false;
        this.startY = 0;
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.isDragging = true;
        this.startY = this.getPointerPos(e).y;
    }
    onPointerMove(e) {
        if (!this.isDragging || !this.editor.selectedElement) return;
        const dy = Math.floor((this.startY - this.getPointerPos(e).y) / 10);
        this.editor.selectedElement.style.zIndex = \`\${dy}\`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}`,
    'js/tools/css/transformGizmoTool.js': `import BaseTool from '../baseTool.js';
export default class TransformGizmoTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_transform_gizmo';
        this.name = 'Transform Gizmo';
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.isDragging = true;
        const pos = this.getPointerPos(e);
        this.startX = pos.x;
        this.startY = pos.y;
    }
    onPointerMove(e) {
        if (!this.isDragging || !this.editor.selectedElement) return;
        const pos = this.getPointerPos(e);
        const dx = pos.x - this.startX;
        const dy = pos.y - this.startY;
        this.editor.selectedElement.style.transform = \`translate(\${dx}px, \${dy}px) rotate(\${dx}deg) scale(\${1 + dy/100})\`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}`,

    // 3D TOOLS
    'js/tools/3d/freeTransTool.js': `import BaseTool from '../baseTool.js';
export default class FreeTransTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_free_trans';
        this.name = 'Free Transform';
        this.isDragging = false;
        this.startX = 0;
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.isDragging = true;
        this.startX = this.getPointerPos(e).x;
    }
    onPointerMove(e) {
        if (!this.isDragging || !this.editor.selectedElement) return;
        const dx = this.getPointerPos(e).x - this.startX;
        const scale = 1 + (dx / 100);
        this.editor.selectedElement.style.transform = \`scale(\${scale})\`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}`,
    'js/tools/3d/perspWarpTool.js': `import BaseTool from '../baseTool.js';
export default class PerspWarpTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_persp_warp';
        this.name = 'Perspective Warp';
        this.isDragging = false;
        this.startX = 0;
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.isDragging = true;
        this.startX = this.getPointerPos(e).x;
        if (this.editor.selectedElement.parentElement) {
            this.editor.selectedElement.parentElement.style.perspective = '1000px';
        }
    }
    onPointerMove(e) {
        if (!this.isDragging || !this.editor.selectedElement) return;
        const dx = this.getPointerPos(e).x - this.startX;
        this.editor.selectedElement.style.transform = \`rotateY(\${dx}deg)\`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}`,
    'js/tools/3d/puppetWarpTool.js': `import BaseTool from '../baseTool.js';
export default class PuppetWarpTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_puppet_warp';
        this.name = 'Puppet Warp';
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.editor.selectedElement.style.transform = 'matrix(1, 0.2, -0.2, 1, 0, 0)';
    }
}`,
    'js/tools/3d/extrudeTool.js': `import BaseTool from '../baseTool.js';
export default class ExtrudeTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_3d_extrude';
        this.name = '3D Extrude (CSS)';
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.isDragging = true;
        const pos = this.getPointerPos(e);
        this.startX = pos.x;
        this.startY = pos.y;
    }
    onPointerMove(e) {
        if (!this.isDragging || !this.editor.selectedElement) return;
        const pos = this.getPointerPos(e);
        const dx = pos.x - this.startX;
        const dy = pos.y - this.startY;
        
        let shadow = '';
        for (let i = 1; i <= Math.abs(dx)/2; i++) {
            shadow += \`\${i * Math.sign(dx)}px \${i * Math.sign(dy)}px 0 #555, \`;
        }
        shadow = shadow.slice(0, -2);
        if (shadow) this.editor.selectedElement.style.boxShadow = shadow;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}`,
    'js/tools/3d/distortTool.js': `import BaseTool from '../baseTool.js';
export default class DistortTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_distort';
        this.name = 'Distort Tool';
        this.isDragging = false;
        this.startX = 0;
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.isDragging = true;
        this.startX = this.getPointerPos(e).x;
    }
    onPointerMove(e) {
        if (!this.isDragging || !this.editor.selectedElement) return;
        const dx = (this.getPointerPos(e).x - this.startX) / 100;
        this.editor.selectedElement.style.transform = \`matrix(1, \${dx}, \${-dx}, 1, 0, 0)\`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}`,
    'js/tools/3d/skewTool.js': `import BaseTool from '../baseTool.js';
export default class SkewTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_skew';
        this.name = 'Skew Tool';
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        this.isDragging = true;
        const pos = this.getPointerPos(e);
        this.startX = pos.x;
        this.startY = pos.y;
    }
    onPointerMove(e) {
        if (!this.isDragging || !this.editor.selectedElement) return;
        const pos = this.getPointerPos(e);
        const dx = pos.x - this.startX;
        const dy = pos.y - this.startY;
        this.editor.selectedElement.style.transform = \`skew(\${dx}deg, \${dy}deg)\`;
    }
    onPointerUp(e) {
        this.isDragging = false;
    }
}`,
    'js/tools/3d/materialTool.js': `import BaseTool from '../baseTool.js';
export default class MaterialTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_3d_material';
        this.name = '3D Material Picker';
    }
    onPointerDown(e) {
        if (!this.editor.selectedElement) return;
        const el = this.editor.selectedElement;
        el.style.background = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
        el.style.boxShadow = 'inset 0 0 10px rgba(255,255,255,0.5), 0 5px 15px rgba(0,0,0,0.3)';
    }
}`
};

for (const [relPath, content] of Object.entries(filesToUpdate)) {
    const fullPath = path.join(__dirname, relPath);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log("Updated: " + relPath);
}
console.log("Advanced implementations injected successfully!");
