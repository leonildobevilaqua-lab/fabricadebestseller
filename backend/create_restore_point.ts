
import * as fs from 'fs';
import * as path from 'path';

const RESTORE_ID = 'RESTAURAR-129520';
const ROOT_DIR = path.join(__dirname); // backend folder
const PROJECT_ROOT = path.join(ROOT_DIR, '..'); // bestseller-factory-ai root
const BACKUP_DIR = path.join(PROJECT_ROOT, 'RESTORE_POINTS', RESTORE_ID);

const PATHS_TO_BACKUP = [
    { from: 'backend/src', to: 'backend/src' },
    { from: 'backend/database.json', to: 'backend/database.json' },
    { from: 'frontend/src', to: 'frontend/src' },
    { from: 'frontend/components', to: 'frontend/components' },
    { from: 'frontend/index.html', to: 'frontend/index.html' },
    { from: 'frontend/types.ts', to: 'frontend/types.ts' },
];

function copyFolderSync(from: string, to: string) {
    if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });

    const entries = fs.readdirSync(from, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(from, entry.name);
        const destPath = path.join(to, entry.name);

        if (entry.isDirectory()) {
            copyFolderSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function createRestorePoint() {
    console.log(`Creating Restore Point: ${RESTORE_ID}...`);

    if (fs.existsSync(BACKUP_DIR)) {
        console.log("Restore point already exists. Overwriting...");
        fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(BACKUP_DIR, { recursive: true });

    for (const item of PATHS_TO_BACKUP) {
        const source = path.join(PROJECT_ROOT, item.from);
        const dest = path.join(BACKUP_DIR, item.to);
        const destDir = path.dirname(dest);

        if (!fs.existsSync(source)) {
            console.warn(`Skipping missing source: ${item.from}`);
            continue;
        }

        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

        const stat = fs.statSync(source);
        if (stat.isDirectory()) {
            copyFolderSync(source, dest);
        } else {
            fs.copyFileSync(source, dest);
        }
        console.log(`Backed up: ${item.from}`);
    }

    console.log(`\n✅ Restore Point ${RESTORE_ID} Created Successfully!`);
    console.log(`Location: ${BACKUP_DIR}`);
}

createRestorePoint();
