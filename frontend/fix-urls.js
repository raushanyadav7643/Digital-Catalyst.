const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            replaceInDir(fullPath);
        } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js'))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            content = content.replace(/['"]http:\/\/127\.0\.0\.1:5000(.*?)['"]/g, '`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}$1`');
            content = content.replace(/['"]http:\/\/localhost:5000(.*?)['"]/g, '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}$1`');
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated', fullPath);
            }
        }
    }
}
replaceInDir(path.join(__dirname, 'src'));
