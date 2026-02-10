import fs from 'fs';
import path from 'path';
import { GoogleDriveService } from './utils/drive-uploader';
import { AISorter } from './utils/ai-sorter';

/**
 * INTELLIGENT SYNC
 * 1. Categorizes local files using Gemini.
 * 2. Moves them into structured local folders.
 * 3. Syncs that structure exactly to Google Drive.
 */

const configPath = path.resolve('config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

if (!config.geminiApiKey || config.geminiApiKey === "YOUR_API_KEY_HERE") {
    console.error('Please set your geminiApiKey in config.json');
    process.exit(1);
}

const keyPath = path.resolve(config.googleDrive.credentialsPath);
const tokenPath = path.resolve(config.googleDrive.tokenPath);
const driveService = new GoogleDriveService(keyPath, tokenPath, config.googleDrive.folderId);
const aiSorter = new AISorter(config.geminiApiKey);

const CATEGORIES = ["Grade7_JHS1", "Grade8_JHS2", "Grade9_JHS3", "SHS1", "SHS2", "SHS3"];
const CONFIDENCE_THRESHOLD = 0.8;

async function processFiles() {
    const rootDownloads = path.resolve('downloads');
    if (!fs.existsSync(rootDownloads)) return;

    // 1. READ ALL FILES (Excluding incoming)
    console.log('--- Phase 1: AI Sorting & Strict Validation ---');
    const allFiles: string[] = [];

    function getAllFiles(dir: string) {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                // Skip incoming and existing category structure, and Review_Needed
                if (item.name !== 'incoming' && !CATEGORIES.includes(item.name) && item.name !== 'Review_Needed') {
                    getAllFiles(fullPath);
                }
            } else {
                if (!item.name.startsWith('.') && item.name !== 'test-upload-oauth.txt') {
                    allFiles.push(fullPath);
                }
            }
        }
    }

    getAllFiles(rootDownloads);
    console.log(`Found ${allFiles.length} files to classify.`);

    for (const file of allFiles) {
        const filename = path.basename(file);

        // Skip if already inside a category folder (check relative path)
        const relativePath = path.relative(rootDownloads, file);
        if (CATEGORIES.some(cat => relativePath.includes(cat)) || relativePath.includes('Review_Needed')) {
            continue;
        }

        console.log(`[AI] Categorizing: ${filename}...`);
        const { grade, subject, confidence } = await aiSorter.getClassification(filename);

        let targetGrade = grade;
        let targetSubject = subject;

        // Scenario 7 & AI Uncertainty
        if (confidence < CONFIDENCE_THRESHOLD || grade === "Uncategorized" || subject === "Uncategorized") {
            console.warn(`[AI] Low confidence (${Math.round(confidence * 100)}%) or Uncategorized. Moving to Review!`);
            targetGrade = "Review_Needed";
            targetSubject = ""; // Direct child of Review_Needed
        } else {
            console.log(`[AI] Result: ${grade} > ${subject} (${Math.round(confidence * 100)}%)`);
        }

        const targetDir = path.join(rootDownloads, targetGrade, targetSubject);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

        const targetPath = path.join(targetDir, filename);
        try {
            // Collision handling for generic names
            if (fs.existsSync(targetPath)) {
                const ext = path.extname(filename);
                const base = path.basename(filename, ext);
                const uniquePath = path.join(targetDir, `${base}_${Date.now()}${ext}`);
                fs.renameSync(file, uniquePath);
            } else {
                fs.renameSync(file, targetPath);
            }
            console.log(`[LOCAL] Organized: ${targetGrade}${targetSubject ? '/' + targetSubject : ''}`);
        } catch (err: any) {
            console.error(`[LOCAL] Move failed for ${filename}:`, err.message);
        }

        // Extra throttle to stay under RPM limits
        await new Promise(r => setTimeout(r, 2000));
    }

    // 2. SYNC STRUCTURE TO DRIVE
    console.log('\n--- Phase 2: Structured Sync to Drive (Idempotent) ---');

    async function syncRecursive(localDir: string, driveParentId: string) {
        // Never sync incoming files
        if (path.basename(localDir) === 'incoming') return;

        const items = fs.readdirSync(localDir, { withFileTypes: true });
        for (const item of items) {
            const fullLocalPath = path.join(localDir, item.name);
            if (item.isDirectory()) {
                console.log(`[DRIVE] Mirroring folder: ${item.name}`);
                const driveFolderId = await driveService.getOrCreateFolder(item.name, driveParentId);
                if (driveFolderId) {
                    await syncRecursive(fullLocalPath, driveFolderId);
                }
            } else {
                // uploadFile now handles Scenario 3 (Idempotency) internally
                await driveService.uploadFile(fullLocalPath, driveParentId);

                if (config.googleDrive.autoCleanup) {
                    try {
                        fs.unlinkSync(fullLocalPath);
                        console.log(`[CLEANUP] Deleted local: ${item.name}`);
                    } catch (e: any) {
                        console.error(`[CLEANUP] Failed cleanup: ${e.message}`);
                    }
                }
            }
        }
    }

    await syncRecursive(rootDownloads, config.googleDrive.folderId);
}

console.log('--- Intelligence Sync Initialized ---');
processFiles()
    .then(() => console.log('\n--- EVERYTHING IS SYNCED & ORGANIZED ---'))
    .catch(console.error);
