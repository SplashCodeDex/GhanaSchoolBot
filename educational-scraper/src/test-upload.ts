import { GoogleDriveService } from './utils/drive-uploader';
import path from 'path';
import fs from 'fs';

async function testUpload() {
    const configPath = path.resolve(__dirname, '../config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const driveConfig = config.googleDrive;

    if (!driveConfig || !driveConfig.enabled) {
        console.error('Google Drive is not enabled in config.json');
        return;
    }

    console.log('--- Google Drive OAuth Upload Test ---');
    console.log('Folder ID:', driveConfig.folderId);

    try {
        const keyPath = path.resolve(driveConfig.credentialsPath);
        const tokenPath = path.resolve(driveConfig.tokenPath);

        const driveService = new GoogleDriveService(keyPath, tokenPath, driveConfig.folderId);

        // Create a dummy file for testing
        const testFilePath = path.resolve(__dirname, '../test-upload-oauth.txt');
        fs.writeFileSync(testFilePath, `Test OAuth upload from GhanaSchoolBot at ${new Date().toISOString()}`);

        console.log('Uploading test file...');
        const fileId = await driveService.uploadFile(testFilePath);

        if (fileId) {
            console.log('SUCCESS! File uploaded with ID:', fileId);
        } else {
            console.log('FAILED! Check logs above.');
        }

        // Cleanup test file
        if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
    } catch (error: any) {
        console.error('ERROR during test:', error.message);
    }
}

testUpload();
