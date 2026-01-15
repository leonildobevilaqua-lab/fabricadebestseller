"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
function copyFolderSync(from, to) {
    if (!fs.existsSync(to))
        fs.mkdirSync(to, { recursive: true });
    const entries = fs.readdirSync(from, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(from, entry.name);
        const destPath = path.join(to, entry.name);
        if (entry.isDirectory()) {
            copyFolderSync(srcPath, destPath);
        }
        else {
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
        if (!fs.existsSync(destDir))
            fs.mkdirSync(destDir, { recursive: true });
        const stat = fs.statSync(source);
        if (stat.isDirectory()) {
            copyFolderSync(source, dest);
        }
        else {
            fs.copyFileSync(source, dest);
        }
        console.log(`Backed up: ${item.from}`);
    }
    console.log(`\n✅ Restore Point ${RESTORE_ID} Created Successfully!`);
    console.log(`Location: ${BACKUP_DIR}`);
}
createRestorePoint();
