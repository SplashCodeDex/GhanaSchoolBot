import fs from 'fs';
import path from 'path';
import { GoogleDriveService } from './utils/drive-uploader';
import { AISorter } from './utils/ai-sorter';

/**
 * SPEEDY REVIEW SORTER
 * 1. Finds Review_Needed folder on Drive.
 * 2. Lists all files inside.
 * 3. Classifies them based on filename (using AI).
 * 4. Moves them directly on Drive (addParents/removeParents).
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

async function speedyReview() {
    console.log('--- Phase 1: Locating Review_Needed Folder ---');
    const items = await driveService.listAllInRoot();
    const reviewFolder = items.find(i => i.name === 'Review_Needed' && i.mimeType === 'application/vnd.google-apps.folder');

    if (!reviewFolder) {
        console.log('[DRIVE] No Review_Needed folder found. Done!');
        return;
    }

    const reviewFolderId = reviewFolder.id;
    const filesInReview = await driveService.listFilesInFolder(reviewFolderId);
    console.log(`[DRIVE] Found ${filesInReview.length} files in Review queue.`);

    for (const file of filesInReview) {
        console.log(`\n[AI] Classifying: ${file.name}`);

        // Speedy logic: Classify by filename ONLY (no download)
        const { grade, subject, confidence } = await aiSorter.getClassification(file.name);

        if (grade === "Review_Needed" || grade === "Uncategorized") {
            console.log(`[DRIVE] AI still unsure. Keeping in review.`);
            continue;
        }

        console.log(`[DRIVE] Moving to: ${grade} > ${subject} (Confidence: ${Math.round(confidence * 100)}%)`);

        // 1. Get/Create target folders on Drive
        const gradeFolderId = await driveService.getOrCreateFolder(grade, config.googleDrive.folderId);
        if (gradeFolderId) {
            const subjectFolderId = await driveService.getOrCreateFolder(subject, gradeFolderId);
            if (subjectFolderId) {
                // 2. Instant Move on Drive
                const moved = await driveService.moveFile(file.id, reviewFolderId, subjectFolderId);
                if (moved) {
                    console.log(`[SUCCESS] File moved successfully.`);
                }
            }
        }

        // Throttle to stay under RPM limits
        await new Promise(r => setTimeout(r, 2000));
    }
}

console.log('--- STARTING SPEEDY DRIVE RE-SORT ---');
speedyReview()
    .then(() => console.log('\n--- SPEEDY RE-SORT COMPLETED ---'))
    .catch(console.error);
