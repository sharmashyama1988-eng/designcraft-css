import ToolManager from './toolManager.js';

// The 100+ Tool Registry
const toolsRegistry = [
    // 1. Selection & Isolation Tools
    { id: 'tool_move', name: 'Move Tool', icon: 'mouse-pointer-2', path: 'selection/moveTool.js', shortcut: 'V', group: 'selection' },
    { id: 'tool_direct_select', name: 'Direct Selection', icon: 'mouse-pointer', path: 'selection/directSelectTool.js', shortcut: 'A', group: 'selection' },
    { id: 'tool_marquee_rect', name: 'Marquee (Rect)', icon: 'square-dashed', path: 'selection/marqueeRectTool.js', shortcut: 'M', group: 'selection' },
    { id: 'tool_marquee_ellipse', name: 'Marquee (Ellipse)', icon: 'circle-dashed', path: 'selection/marqueeEllipseTool.js', shortcut: 'Shift+M', group: 'selection' },
    { id: 'tool_lasso', name: 'Lasso Tool', icon: 'lasso', path: 'selection/lassoTool.js', shortcut: 'L', group: 'selection' },
    { id: 'tool_lasso_poly', name: 'Polygonal Lasso', icon: 'lasso-select', path: 'selection/lassoPolyTool.js', group: 'selection' },
    { id: 'tool_lasso_magnetic', name: 'Magnetic Lasso', icon: 'magnet', path: 'selection/lassoMagneticTool.js', group: 'selection' },
    { id: 'tool_magic_wand', name: 'Magic Wand', icon: 'wand-2', path: 'selection/magicWandTool.js', shortcut: 'W', group: 'selection' },
    { id: 'tool_quick_select', name: 'Quick Selection', icon: 'brush', path: 'selection/quickSelectTool.js', group: 'selection' },
    { id: 'tool_object_select', name: 'Object Selection (AI)', icon: 'scan-line', path: 'selection/objectSelectTool.js', group: 'selection' },
    { id: 'tool_color_range', name: 'Color Range', icon: 'pipette', path: 'selection/colorRangeTool.js', group: 'selection' },

    // 2. Drawing & Painting
    { id: 'tool_brush', name: 'Brush Tool', icon: 'paintbrush', path: 'drawing/brushTool.js', shortcut: 'B', group: 'drawing' },
    { id: 'tool_pencil', name: 'Pencil Tool', icon: 'pencil', path: 'drawing/pencilTool.js', shortcut: 'N', group: 'drawing' },
    { id: 'tool_mixer_brush', name: 'Mixer Brush', icon: 'paint-bucket', path: 'drawing/mixerBrushTool.js', group: 'drawing' },
    { id: 'tool_airbrush', name: 'Airbrush', icon: 'spray-can', path: 'drawing/airbrushTool.js', group: 'drawing' },
    { id: 'tool_pixel_art', name: 'Pixel Art Brush', icon: 'grid', path: 'drawing/pixelArtTool.js', group: 'drawing' },
    { id: 'tool_calligraphy', name: 'Calligraphy Pen', icon: 'pen-tool', path: 'drawing/calligraphyTool.js', group: 'drawing' },
    { id: 'tool_marker', name: 'Marker Tool', icon: 'highlighter', path: 'drawing/markerTool.js', group: 'drawing' },
    { id: 'tool_spray', name: 'Spray Paint', icon: 'spray-can', path: 'drawing/sprayTool.js', group: 'drawing' },
    { id: 'tool_eraser', name: 'Eraser', icon: 'eraser', path: 'drawing/eraserTool.js', shortcut: 'E', group: 'drawing' },
    { id: 'tool_bg_eraser', name: 'Background Eraser', icon: 'image-minus', path: 'drawing/bgEraserTool.js', group: 'drawing' },
    { id: 'tool_magic_eraser', name: 'Magic Eraser', icon: 'sparkles', path: 'drawing/magicEraserTool.js', group: 'drawing' },
    { id: 'tool_paint_bucket', name: 'Paint Bucket', icon: 'paint-bucket', path: 'drawing/paintBucketTool.js', shortcut: 'G', group: 'drawing' },
    { id: 'tool_gradient', name: 'Gradient Tool', icon: 'palette', path: 'drawing/gradientTool.js', shortcut: 'Shift+G', group: 'drawing' },
    { id: 'tool_clone_stamp', name: 'Clone Stamp', icon: 'stamp', path: 'retouching/cloneStampTool.js', shortcut: 'S', group: 'drawing' },

    // 3. Shape & Geometry
    { id: 'tool_rectangle', name: 'Rectangle', icon: 'square', path: 'shapes/rectangleTool.js', shortcut: 'U', group: 'shape' },
    { id: 'tool_rounded_rect', name: 'Rounded Rectangle', icon: 'layout-template', path: 'shapes/roundedRectTool.js', group: 'shape' },
    { id: 'tool_ellipse', name: 'Ellipse', icon: 'circle', path: 'shapes/ellipseTool.js', shortcut: 'O', group: 'shape' },
    { id: 'tool_polygon', name: 'Polygon', icon: 'hexagon', path: 'shapes/polygonTool.js', group: 'shape' },
    { id: 'tool_star', name: 'Star', icon: 'star', path: 'shapes/starTool.js', group: 'shape' },
    { id: 'tool_line', name: 'Line', icon: 'minus', path: 'shapes/lineTool.js', shortcut: 'L', group: 'shape' },
    { id: 'tool_custom_shape', name: 'Custom Shape', icon: 'shapes', path: 'shapes/customShapeTool.js', group: 'shape' },
    { id: 'tool_grid_gen', name: 'Grid Generator', icon: 'grid-3x3', path: 'shapes/gridGenTool.js', group: 'shape' },
    { id: 'tool_spiral', name: 'Spiral', icon: 'hurricane', path: 'shapes/spiralTool.js', group: 'shape' },
    { id: 'tool_heart', name: 'Heart Tool', icon: 'heart', path: 'shapes/heartTool.js', group: 'shape' },
    { id: 'tool_arrow', name: 'Arrow Tool', icon: 'arrow-up-right', path: 'shapes/arrowTool.js', group: 'shape' },
    { id: 'tool_blob', name: 'Blob Maker', icon: 'cloud', path: 'shapes/blobTool.js', group: 'shape' },
    { id: 'tool_wave', name: 'Wave Generator', icon: 'waves', path: 'shapes/waveTool.js', group: 'shape' },

    // 4. Path & Vector
    { id: 'tool_pen', name: 'Pen Tool', icon: 'pen', path: 'path/penTool.js', shortcut: 'P', group: 'path' },
    { id: 'tool_curve_pen', name: 'Curvature Pen', icon: 'spline', path: 'path/curvePenTool.js', group: 'path' },
    { id: 'tool_free_pen', name: 'Freeform Pen', icon: 'edit-3', path: 'path/freePenTool.js', group: 'path' },
    { id: 'tool_add_anchor', name: 'Add Anchor Point', icon: 'plus', path: 'path/addAnchorTool.js', group: 'path' },
    { id: 'tool_del_anchor', name: 'Delete Anchor Point', icon: 'minus', path: 'path/delAnchorTool.js', group: 'path' },
    { id: 'tool_convert_point', name: 'Convert Point', icon: 'corner-up-right', path: 'path/convertPointTool.js', group: 'path' },
    { id: 'tool_path_select', name: 'Path Selection', icon: 'mouse-pointer-click', path: 'path/pathSelectTool.js', group: 'path' },
    { id: 'tool_scissors', name: 'Scissors', icon: 'scissors', path: 'path/scissorsTool.js', group: 'path' },
    { id: 'tool_knife', name: 'Knife', icon: 'sword', path: 'path/knifeTool.js', group: 'path' },
    { id: 'tool_shape_builder', name: 'Shape Builder', icon: 'combine', path: 'path/shapeBuilderTool.js', group: 'path' },
    { id: 'tool_vector_warp', name: 'Vector Warp', icon: 'wrap-text', path: 'path/vectorWarpTool.js', group: 'path' },

    // 5. Text & Typography
    { id: 'tool_text', name: 'Horizontal Type', icon: 'type', path: 'text/textTool.js', shortcut: 'T', group: 'text' },
    { id: 'tool_text_vert', name: 'Vertical Type', icon: 'align-vertical-justify-start', path: 'text/textVertTool.js', group: 'text' },
    { id: 'tool_area_type', name: 'Area Type', icon: 'type', path: 'text/areaTypeTool.js', group: 'text' },
    { id: 'tool_path_type', name: 'Type on a Path', icon: 'baseline', path: 'text/pathTypeTool.js', group: 'text' },
    { id: 'tool_text_warp', name: 'Text Warp', icon: 'wrap-text', path: 'text/textWarpTool.js', group: 'text' },
    { id: 'tool_var_font', name: 'Variable Font', icon: 'sliders-horizontal', path: 'text/varFontTool.js', group: 'text' },
    { id: 'tool_drop_cap', name: 'Drop Cap', icon: 'heading', path: 'text/dropCapTool.js', group: 'text' },
    { id: 'tool_glyph', name: 'Glyph Insert', icon: 'pilcrow', path: 'text/glyphTool.js', group: 'text' },
    { id: 'tool_touch_type', name: 'Touch Type', icon: 'letter-text', path: 'text/touchTypeTool.js', group: 'text' },
    { id: 'tool_kerning', name: 'Kerning Tool', icon: 'move-horizontal', path: 'text/kerningTool.js', group: 'text' },

    // 6. Retouching & Healing
    { id: 'tool_spot_heal', name: 'Spot Healing Brush', icon: 'band-aid', path: 'retouching/spotHealTool.js', shortcut: 'J', group: 'retouch' },
    { id: 'tool_heal', name: 'Healing Brush', icon: 'cross', path: 'retouching/healTool.js', group: 'retouch' },
    { id: 'tool_patch', name: 'Patch Tool', icon: 'scan-face', path: 'retouching/patchTool.js', group: 'retouch' },
    { id: 'tool_ca_move', name: 'Content-Aware Move', icon: 'move', path: 'retouching/contentAwareTool.js', group: 'retouch' },
    { id: 'tool_red_eye', name: 'Red Eye Tool', icon: 'eye-off', path: 'retouching/redEyeTool.js', group: 'retouch' },
    { id: 'tool_dodge', name: 'Dodge Tool', icon: 'sun', path: 'retouching/dodgeTool.js', shortcut: 'O', group: 'retouch' },
    { id: 'tool_burn', name: 'Burn Tool', icon: 'moon', path: 'retouching/burnTool.js', group: 'retouch' },
    { id: 'tool_sponge', name: 'Sponge Tool', icon: 'droplet', path: 'retouching/spongeTool.js', group: 'retouch' },
    { id: 'tool_blur', name: 'Blur Tool', icon: 'droplets', path: 'retouching/blurTool.js', group: 'retouch' },
    { id: 'tool_sharpen', name: 'Sharpen Tool', icon: 'zap', path: 'retouching/sharpenTool.js', group: 'retouch' },
    { id: 'tool_smudge', name: 'Smudge Tool', icon: 'pointer', path: 'retouching/smudgeTool.js', group: 'retouch' },

    // 7. CSS & UI Effect
    { id: 'tool_drop_shadow', name: 'Drop Shadow Gizmo', icon: 'box-select', path: 'css/dropShadowTool.js', group: 'css' },
    { id: 'tool_glow', name: 'Inner/Outer Glow', icon: 'sun-snow', path: 'css/glowTool.js', group: 'css' },
    { id: 'tool_filter_brush', name: 'CSS Filter Brush', icon: 'filter', path: 'css/filterBrushTool.js', group: 'css' },
    { id: 'tool_radius_drag', name: 'Border Radius Dragger', icon: 'corner-down-right', path: 'css/radiusDragTool.js', group: 'css' },
    { id: 'tool_glass', name: 'Glassmorphism', icon: 'component', path: 'css/glassTool.js', group: 'css' },
    { id: 'tool_neumorph', name: 'Neumorphism', icon: 'layers', path: 'css/neumorphTool.js', group: 'css' },
    { id: 'tool_grad_mesh', name: 'Gradient Mesh', icon: 'grid', path: 'css/gradMeshTool.js', group: 'css' },
    { id: 'tool_box_model', name: 'Box Model Inspector', icon: 'box', path: 'css/boxModelTool.js', group: 'css' },
    { id: 'tool_grid_build', name: 'CSS Grid Builder', icon: 'layout-grid', path: 'css/gridBuildTool.js', group: 'css' },
    { id: 'tool_flex_align', name: 'Flexbox Aligner', icon: 'align-center', path: 'css/flexAlignTool.js', group: 'css' },
    { id: 'tool_z_index', name: 'Z-Index Picker', icon: 'layers', path: 'css/zIndexTool.js', group: 'css' },
    { id: 'tool_transform_gizmo', name: 'Transform Gizmo', icon: 'rotate-3d', path: 'css/transformGizmoTool.js', group: 'css' },

    // 8. Layout, Canvas & Utility
    { id: 'tool_artboard', name: 'Artboard Tool', icon: 'layout-panel-left', path: 'layout/artboardTool.js', group: 'layout' },
    { id: 'tool_slice', name: 'Slice Tool', icon: 'slice', path: 'layout/sliceTool.js', shortcut: 'C', group: 'layout' },
    { id: 'tool_slice_sel', name: 'Slice Select', icon: 'pointer', path: 'layout/sliceSelectTool.js', group: 'layout' },
    { id: 'tool_frame', name: 'Frame Tool', icon: 'frame', path: 'layout/frameTool.js', group: 'layout' },
    { id: 'tool_ruler', name: 'Ruler Tool', icon: 'ruler', path: 'layout/rulerTool.js', group: 'layout' },
    { id: 'tool_guides', name: 'Guides Manager', icon: 'align-vertical-space-around', path: 'layout/guidesTool.js', group: 'layout' },
    { id: 'tool_hand', name: 'Hand Tool', icon: 'hand', path: 'layout/handTool.js', shortcut: 'H', group: 'layout' },
    { id: 'tool_zoom', name: 'Zoom Tool', icon: 'zoom-in', path: 'layout/zoomTool.js', shortcut: 'Z', group: 'layout' },
    { id: 'tool_rotate_view', name: 'Rotate View', icon: 'rotate-cw', path: 'layout/rotateViewTool.js', shortcut: 'R', group: 'layout' },
    { id: 'tool_eyedropper', name: 'Eyedropper', icon: 'pipette', path: 'layout/eyedropperTool.js', shortcut: 'I', group: 'layout' },
    { id: 'tool_note', name: 'Note/Comment', icon: 'message-square', path: 'layout/noteTool.js', group: 'layout' },
    { id: 'tool_count', name: 'Count Tool', icon: 'hash', path: 'layout/countTool.js', group: 'layout' },

    // 9. AI & Generative
    { id: 'tool_gen_fill', name: 'Generative Fill', icon: 'wand-2', path: 'ai/genFillTool.js', group: 'ai' },
    { id: 'tool_gen_expand', name: 'Generative Expand', icon: 'expand', path: 'ai/genExpandTool.js', group: 'ai' },
    { id: 'tool_bg_remove', name: 'Background Remover', icon: 'image-minus', path: 'ai/bgRemoveTool.js', group: 'ai' },
    { id: 'tool_colorize', name: 'Auto-Colorize', icon: 'palette', path: 'ai/colorizeTool.js', group: 'ai' },
    { id: 'tool_upscale', name: 'AI Upscaler', icon: 'maximize', path: 'ai/upscaleTool.js', group: 'ai' },
    { id: 'tool_style_transfer', name: 'Style Transfer', icon: 'brush', path: 'ai/styleTransferTool.js', group: 'ai' },
    { id: 'tool_wire_ui', name: 'Wireframe-to-UI', icon: 'layout', path: 'ai/wireUiTool.js', group: 'ai' },
    { id: 'tool_img_css', name: 'Image-to-CSS', icon: 'code', path: 'ai/imgCssTool.js', group: 'ai' },

    // 10. 3D & Advanced Transforms
    { id: 'tool_free_trans', name: 'Free Transform', icon: 'scaling', path: '3d/freeTransTool.js', shortcut: 'Ctrl+T', group: '3d' },
    { id: 'tool_persp_warp', name: 'Perspective Warp', icon: 'box', path: '3d/perspWarpTool.js', group: '3d' },
    { id: 'tool_puppet_warp', name: 'Puppet Warp', icon: 'git-commit', path: '3d/puppetWarpTool.js', group: '3d' },
    { id: 'tool_3d_extrude', name: '3D Extrude (CSS)', icon: 'box-select', path: '3d/extrudeTool.js', group: '3d' },
    { id: 'tool_distort', name: 'Distort Tool', icon: 'move-diagonal', path: '3d/distortTool.js', group: '3d' },
    { id: 'tool_skew', name: 'Skew Tool', icon: 'move-horizontal', path: '3d/skewTool.js', group: '3d' },
    { id: 'tool_3d_material', name: '3D Material Picker', icon: 'layers', path: '3d/materialTool.js', group: '3d' }
];

document.addEventListener('DOMContentLoaded', () => {
    // Render the 100+ tools grouped to UI
    const container = document.getElementById('dynamic-tools-container');
    if (container) {
        let currentGroup = '';
        let groupDiv = null;

        toolsRegistry.forEach((tool, index) => {
            if (tool.group !== currentGroup) {
                // Add divider between groups (except first)
                if (currentGroup !== '') {
                    const divider = document.createElement('div');
                    divider.className = 'toolbox-divider';
                    container.appendChild(divider);
                }
                
                groupDiv = document.createElement('div');
                groupDiv.className = 'toolbox-group';
                container.appendChild(groupDiv);
                
                currentGroup = tool.group;
            }

            const btn = document.createElement('button');
            btn.className = 'toolbox-btn';
            btn.dataset.tool = tool.id;
            btn.title = tool.name + (tool.shortcut ? ` (${tool.shortcut})` : '');
            btn.innerHTML = `<i data-lucide="${tool.icon}"></i>`;
            
            groupDiv.appendChild(btn);
        });

        // Initialize icons after adding to DOM
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Wait slightly so that window.canvasEditor is initialized by app.js
    setTimeout(() => {
        window.toolManager = new ToolManager(window.canvasEditor);

        // Register all tools
        toolsRegistry.forEach(tool => window.toolManager.registerTool(tool));
        
        // Listen to UI buttons
        document.querySelectorAll('.toolbox-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const toolId = e.currentTarget.dataset.tool;
                if (toolId) {
                    window.toolManager.activateTool(toolId);
                }
            });
        });
        
        // Activate default tool
        window.toolManager.activateTool('tool_move');
    }, 100);
});
