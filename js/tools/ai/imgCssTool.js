import BaseTool from '../baseTool.js';
export default class ImgCssTool extends BaseTool {
    constructor(manager) {
        super(manager);
        this.id = 'tool_img_css';
        this.name = 'Image-to-CSS';
        this.cursor = 'text';
    }
    onPointerDown(e) {
        
        fetch('/api/tools', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({action: 'imgCss'})
        }).then(res => res.json()).then(data => alert(data.message)).catch(err => console.error(err));
    
    }
}