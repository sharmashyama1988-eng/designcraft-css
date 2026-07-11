const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'js', 'tools');

// Extract paths from initTools.js
const initToolsPath = path.join(__dirname, 'js', 'core', 'initTools.js');
const initToolsCode = fs.readFileSync(initToolsPath, 'utf8');

// Regex to find { id: '...', name: '...', icon: '...', path: '...', ... }
const regex = /path:\s*'([^']+)'/g;
let match;
const toolPaths = new Set();

while ((match = regex.exec(initToolsCode)) !== null) {
    toolPaths.add(match[1]);
}

toolPaths.forEach(relPath => {
    // Skip if it's the already implemented moveTool.js
    if (relPath === 'selection/moveTool.js') return;

    const fullPath = path.join(baseDir, relPath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    // Extract a Class Name from path (e.g. selection/lassoTool.js -> LassoTool)
    const baseName = path.basename(relPath, '.js');
    const className = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    
    // Check depth for relative import
    const depth = relPath.split('/').length;
    const importPath = '../'.repeat(depth - 1) + 'baseTool.js';
    
    const content = `import BaseTool from '${importPath}';

export default class ${className} extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = '${baseName}';
        this.name = '${className.replace('Tool', ' Tool')}';
        this.cursor = 'crosshair';
    }

    onPointerDown(e) {
        if (!this.editor) return;
        // console.log(\`${className} - Pointer Down\`);
        
        // Example stub implementation: Create a placeholder element
        // const el = document.createElement('div');
        // el.className = 'canvas-element ${baseName}-preview';
        // ...
    }

    onPointerMove(e) {
        if (!this.editor) return;
    }

    onPointerUp(e) {
        if (!this.editor) return;
    }
}
`;
    if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log("Created: " + relPath);
    }
});
console.log("All tools generated successfully!");
