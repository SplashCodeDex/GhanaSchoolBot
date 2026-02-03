import fs from 'fs';
import path from 'path';
import { GoogleDriveService } from './utils/drive-uploader';

/**
 * CLEANUP SCRIPT
 * This script deletes ALL files and folders in your target Google Drive folder.
 * Use with caution!
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

async function main() {
    console.log('--- WARNING: Starting Google Drive Cleanup ---');
    console.log(`Targeting folder: ${config.googleDrive.folderId}`);

    const items = await driveService.listAllInRoot();
    console.log(`Found ${items.length} items to delete.`);

    for (const item of items) {
        process.stdout.write(`Deleting ${item.name} (${item.id})... `);
        const success = await driveService.deleteItem(item.id);
        if (success) {
            console.log('Done.');
        } else {
            console.log('FAILED.');
        }
    }

    console.log('--- Cleanup Completed ---');
}

main().catch(console.error);
