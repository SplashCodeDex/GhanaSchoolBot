import fs from 'fs';
import path from 'path';
import { GoogleDriveService } from './utils/drive-uploader';

/**
 * SYNC SCRIPT
 * This script scans your existing 'downloads' folder (and all subdirectories)
 * and uploads any files found to Google Drive if they aren't already there.
 */

const configPath = path.resolve('config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

if (!config.googleDrive || !config.googleDrive.enabled) {
    console.error('Google Drive is not enabled in config.json');
    process.exit(1);
}

const keyPath = path.resolve(config.googleDrive.credentialsPath);
const tokenPath = path.resolve(config.googleDrive.tokenPath);
const driveService = new GoogleDriveService(keyPath, tokenPath, config.googleDrive.folderId);

async function syncDir(localPath: string, driveParentId: string) {
    if (!fs.existsSync(localPath)) return;

    const items = fs.readdirSync(localPath, { withFileTypes: true });

    for (const item of items) {
        const fullLocalPath = path.join(localPath, item.name);

        if (item.isDirectory()) {
            console.log(`[SYNC] Syncing directory: ${item.name}`);
            // Get or create this folder on Drive
            const newDriveFolderId = await driveService.getOrCreateFolder(item.name, driveParentId);

            if (newDriveFolderId) {
                await syncDir(fullLocalPath, newDriveFolderId);
            } else {
                console.error(`[SYNC] Skipping directory ${item.name} due to folder creation failure.`);
            }
        } else {
            // It's a file - check if it's a resource (not a hidden file)
            if (!item.name.startsWith('.') && item.name !== 'test-upload-oauth.txt') {
                console.log(`[SYNC] Found existing file: ${item.name}`);
                await driveService.uploadFile(fullLocalPath, driveParentId);

                // Optional: Auto-cleanup if enabled
                if (config.googleDrive.autoCleanup) {
                    try {
                        fs.unlinkSync(fullLocalPath);
                        console.log(`[CLEANUP] Deleted local file after sync: ${item.name}`);
                    } catch (e: any) {
                        console.error(`[CLEANUP] Failed: ${e.message}`);
                    }
                }
            }
        }
    }
}

async function main() {
    const rootDownloads = path.resolve('downloads');
    console.log('--- Starting Recursive Sync of Existing Files ---');
    console.log(`Scanning: ${rootDownloads}`);

    // Start syncing with the root folder configured in config.json
    await syncDir(rootDownloads, config.googleDrive.folderId);

    console.log('--- Sync Completed ---');
}

main().catch(console.error);
