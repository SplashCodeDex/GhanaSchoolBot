import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as mime from 'mime-types';
import { GoogleDriveService } from './drive-uploader';

// Load config for drive settings
const configPath = path.resolve('config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

let driveService: GoogleDriveService | null = null;
if (config.googleDrive && config.googleDrive.enabled) {
    try {
        const keyPath = path.resolve(config.googleDrive.credentialsPath);
        const tokenPath = path.resolve(config.googleDrive.tokenPath);
        driveService = new GoogleDriveService(keyPath, tokenPath, config.googleDrive.folderId);
        console.log('[DRIVE] Service initialized.');
    } catch (err: any) {
        console.error('[DRIVE] Initialization failed:', err.message);
    }
}

/**
 * recursively searches for a filename in the base directory.
 * Returns true if found, false otherwise.
 */
function fileExistsRecursively(baseDir: string, filename: string): boolean {
    if (!fs.existsSync(baseDir)) return false;

    const files = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(baseDir, file.name);
        if (file.isDirectory()) {
            if (fileExistsRecursively(fullPath, filename)) return true;
        } else if (file.name.toLowerCase() === filename.toLowerCase()) {
            return true;
        }
    }
    return false;
}

export async function downloadFile(url: string, folder: string): Promise<boolean> {
    try {
        // 1. Determine Filename
        let filename = path.basename(new URL(url).pathname);
        if (!filename || filename.length < 3) filename = `download_${Date.now()}`;

        // Clean filename
        filename = filename.replace(/[^a-z0-9._-]/gi, '_');

        // 2. Check overlap with ANY existing file in the downloads/ folder (recursive)
        const rootDownloads = path.resolve('downloads');
        if (fileExistsRecursively(rootDownloads, filename)) {
            console.log(`[SKIP] Already exists: ${filename}`);
            return false; // File already exists, not an error but not a new download
        }

        // 3. Download
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
        });

        // Refine filename from headers if needed
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?(.+)"?/);
            if (match) {
                let headerName = match[1];
                headerName = headerName.replace(/[^a-z0-9._-]/gi, '_');
                // If header name is different/better, re-check existence?
                // For simplicity, we stick to tracking by the name we save as.
                if (headerName && headerName !== filename) {
                    filename = headerName;
                    if (fileExistsRecursively(rootDownloads, filename)) {
                        console.log(`[SKIP] Already exists (header-name): ${filename}`);
                        return false; // File already exists
                    }
                }
            }
        }

        // Ensure extension
        if (!path.extname(filename)) {
            const ext = mime.extension(response.headers['content-type']);
            if (ext) filename = `${filename}.${ext}`;
        }

        // Ensure directories exist
        const incomingDir = path.resolve('downloads', 'incoming');
        const finishedDir = path.resolve('downloads', 'finished');
        if (!fs.existsSync(incomingDir)) fs.mkdirSync(incomingDir, { recursive: true });
        if (!fs.existsSync(finishedDir)) fs.mkdirSync(finishedDir, { recursive: true });

        const filePath = path.join(incomingDir, filename);
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise<boolean>((resolve, reject) => {
            writer.on('finish', async () => {
                console.log(`[DOWNLOADED] ${filename}`);

                // Move from incoming to finished (Scenario 6: Race Condition Prevention)
                const finalPath = path.join(finishedDir, filename);
                try {
                    fs.renameSync(filePath, finalPath);
                } catch (err: any) {
                    console.error(`[MOVE] Failed to move ${filename} to finished:`, err.message);
                    return resolve(false); // Move failed
                }

                // --- Upload to Google Drive if enabled ---
                if (driveService) {
                    const fileId = await driveService.uploadFile(finalPath);

                    // --- Auto-cleanup if enabled and upload successful ---
                    if (fileId && config.googleDrive.autoCleanup) {
                        try {
                            fs.unlinkSync(finalPath);
                            console.log(`[CLEANUP] Deleted local file: ${filename}`);
                        } catch (err: any) {
                            console.error(`[CLEANUP] Failed to delete ${filename}:`, err.message);
                        }
                    }
                }

                resolve(true); // Success
            });
            writer.on('error', (err) => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                resolve(false); // Download failed
            });
        });
    } catch (error: any) {
        console.error(`Failed to download ${url}:`, error.message);
        return false; // Error occurred
    }
}
