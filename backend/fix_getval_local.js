const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'src', 'controllers');

const filesToFix = [
    'payment.controller.ts',
    'admin.controller.ts',
    'user.auth.controller.ts',
    'project.controller.ts'
];

for (const file of filesToFix) {
    const filePath = path.join(controllersDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Add getValLocal to imports if missing
        if (content.includes('getVal') && !content.includes('getValLocal')) {
            content = content.replace(/getVal\s*,/g, 'getVal, getValLocal,');
            content = content.replace(/,\s*getVal\s*}/g, ', getVal, getValLocal }');
            if (!content.includes('getValLocal')) {
                content = content.replace(/getVal }/, 'getVal, getValLocal }');
            }
        }

        // Replace getVal with getValLocal for specific prefixes that are known to be individual keys
        // like /credits/, /cipCredits/, /users/
        const regex = /await getVal\(\s*`(\/(?:credits|cipCredits|barcodeCredits|qrCredits|coverCredits|users)\/[^`]+)`\s*\)/g;
        content = content.replace(regex, 'getValLocal(`$1`)');

        const regex2 = /await getVal\(\s*'(\/(?:credits|cipCredits|barcodeCredits|qrCredits|coverCredits|users)\/[^']+)'\s*\)/g;
        content = content.replace(regex2, 'getValLocal(`$1`)');

        fs.writeFileSync(filePath, content);
        console.log(`Updated ${file}`);
    }
}
