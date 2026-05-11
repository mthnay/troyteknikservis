const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'server/models');
const files = fs.readdirSync(modelsDir);

files.forEach(file => {
    if (file.endsWith('.js')) {
        const filePath = path.join(modelsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        const match = content.match(/mongoose\.model\(['"]([^'"]+)['"]/);
        if (match) {
            const modelName = match[1];
            const newContent = `import { createModel } from '../localDb.js';\n\nexport default createModel('${modelName}');\n`;
            fs.writeFileSync(filePath, newContent);
            console.log(`Rewrote ${file} for localDb.`);
        }
    }
});
