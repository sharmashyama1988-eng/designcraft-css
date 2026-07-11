const fs = require('fs');
const path = require('path');

const jsDir = 'd:\\Desktop\\css maker\\js';

function processDir(dir) {
    if (path.basename(dir) === 'tools') return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            content = content.replace(/(\bdocument\.getElementById\([^)]+\))\s*\.addEventListener/g, '$1?.addEventListener');
            content = content.replace(/(\bdocument\.querySelector\([^)]+\))\s*\.addEventListener/g, '$1?.addEventListener');
            content = content.replace(/(\bdocument\.querySelectorAll\([^)]+\))\s*\.forEach/g, '$1?.forEach');

            content = content.replace(/(\b(?!window|document|this)\w+)\.addEventListener/g, '$1?.addEventListener');
            content = content.replace(/(this\.\w+)\.addEventListener/g, '$1?.addEventListener');
            
            content = content.replace(/([ \t]*)(\bdocument\.getElementById\([^)]+\))\s*\.onclick\s*=\s*(.+);/g, (match, p1, p2, p3) => {
                return p1 + 'if (' + p2 + ') ' + p2 + '.onclick = ' + p3 + ';';
            });
            content = content.replace(/([ \t]*)(\bdocument\.getElementById\([^)]+\))\s*\.src\s*=\s*(.+);/g, (match, p1, p2, p3) => {
                return p1 + 'if (' + p2 + ') ' + p2 + '.src = ' + p3 + ';';
            });
            content = content.replace(/([ \t]*)(\bdocument\.getElementById\([^)]+\))\s*\.textContent\s*=\s*(.+);/g, (match, p1, p2, p3) => {
                return p1 + 'if (' + p2 + ') ' + p2 + '.textContent = ' + p3 + ';';
            });

            content = content.replace(/(\bdocument\.getElementById\([^)]+\))\s*\.appendChild/g, '$1?.appendChild');
            content = content.replace(/(\bdocument\.getElementById\([^)]+\))\s*\.classList/g, '$1?.classList');
            content = content.replace(/(\bdocument\.getElementById\([^)]+\))\s*\.style/g, '$1?.style');
            content = content.replace(/(\bdocument\.getElementById\([^)]+\))\s*\.remove\(\)/g, '$1?.remove()');
            content = content.replace(/(\bdocument\.getElementById\([^)]+\))\s*\.value/g, '$1?.value');
            content = content.replace(/(\bdocument\.getElementById\([^)]+\))\s*\.checked/g, '$1?.checked');


            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated ' + fullPath);
            }
        }
    }
}

processDir(jsDir);
