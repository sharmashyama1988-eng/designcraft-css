import BaseTool from '../baseTool.js';
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
}