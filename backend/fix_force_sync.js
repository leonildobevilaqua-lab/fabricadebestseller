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
        // Regex to match ', { forceSync: true }' or ', {forceSync: true}'
        content = content.replace(/,\s*\{\s*forceSync\s*:\s*true\s*\}/g, '');
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${file}`);
    }
}
