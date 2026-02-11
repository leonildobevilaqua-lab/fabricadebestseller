const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const backupDir = path.join(__dirname, 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const destDir = path.join(backupDir, `backup_${timestamp}`);

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

// Function to copy directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'backups') {
                continue; // Skip huge folders
            }
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

console.log(`Creating backup at ${destDir}...`);
try {
    copyDir(path.join(__dirname, 'frontend'), path.join(destDir, 'frontend'));
    copyDir(path.join(__dirname, 'backend'), path.join(destDir, 'backend'));
    console.log('Backup successful!');
} catch (err) {
    console.error('Backup failed:', err);
}
