
import fs from 'fs';
import path from 'path';

export const logError = (context: string, error: any) => {
    const logPath = path.resolve(__dirname, '../../debug_errors.log');
    const timestamp = new Date().toISOString();
    const msg = `[${timestamp}] [${context}] ${error.message || error}\nStack: ${error.stack || ''}\n\n`;
    fs.appendFileSync(logPath, msg);
};
