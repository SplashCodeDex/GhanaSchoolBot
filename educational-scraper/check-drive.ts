import fs from 'fs';
import path from 'path';
import { GoogleDriveService } from './src/utils/drive-uploader';

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const keyPath = path.resolve(config.googleDrive.credentialsPath);
const tokenPath = path.resolve(config.googleDrive.tokenPath);
const drive = new GoogleDriveService(keyPath, tokenPath, config.googleDrive.folderId);

async function check() {
    console.log('--- Google Drive Folders ---');
    const items = await drive.listAllInRoot();
    items.forEach(item => {
        console.log(`[${item.mimeType === 'application/vnd.google-apps.folder' ? 'FOLDER' : 'FILE'}] ${item.name}`);
    });
}

check().catch(console.error);
