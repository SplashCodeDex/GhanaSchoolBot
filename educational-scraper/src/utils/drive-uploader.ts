import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

/**
 * Service to handle Google Drive operations using OAuth 2.0
 *
 * To use this, you need:
 * 1. OAuth Client ID JSON (client_secrets.json)
 * 2. Tokens JSON (tokens.json) generated via authorization flow.
 */
export class GoogleDriveService {
    private drive;
    private folderId: string;

    constructor(clientSecretPath: string, tokenPath: string, folderId: string) {
        if (!fs.existsSync(clientSecretPath)) {
            throw new Error(`Google Drive client secrets not found at: ${clientSecretPath}`);
        }
        if (!fs.existsSync(tokenPath)) {
            throw new Error(`Google Drive tokens not found at: ${tokenPath}. Please run the auth script first.`);
        }

        const credentials = JSON.parse(fs.readFileSync(clientSecretPath, 'utf8'));
        const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

        const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        oAuth2Client.setCredentials(tokens);

        this.drive = google.drive({ version: 'v3', auth: oAuth2Client });
        this.folderId = folderId;
    }

    /**
     * Finds or creates a folder inside a parent folder
     */
    async getOrCreateFolder(folderName: string, parentId: string = this.folderId): Promise<string | null> {
        try {
            // Check if folder exists
            const response = await this.drive.files.list({
                q: `name = '${folderName}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
                fields: 'files(id, name)',
                spaces: 'drive',
            });

            if (response.data.files && response.data.files.length > 0) {
                return response.data.files[0].id!;
            }

            // Create it if not found
            const createResponse = await this.drive.files.create({
                requestBody: {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [parentId],
                },
                fields: 'id',
            });

            console.log(`[DRIVE] Created folder: ${folderName}`);
            return createResponse.data.id || null;
        } catch (error: any) {
            console.error(`[DRIVE] Folder creation/retrieval failed for ${folderName}:`, error.message);
            return null;
        }
    }

    /**
     * Checks if a file with the same name already exists in a folder
     */
    async fileExists(fileName: string, folderId: string = this.folderId): Promise<string | null> {
        try {
            const response = await this.drive.files.list({
                q: `name = '${fileName.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed = false`,
                fields: 'files(id, name)',
                spaces: 'drive',
            });
            return (response.data.files && response.data.files.length > 0) ? response.data.files[0].id! : null;
        } catch (error: any) {
            console.error(`[DRIVE] File existence check failed for ${fileName}:`, error.message);
            return null;
        }
    }

    /**
     * Uploads a file to a specific Google Drive folder (Resumable)
     */
    async uploadFile(filePath: string, targetFolderId: string = this.folderId): Promise<string | null> {
        try {
            const fileName = path.basename(filePath);

            // Scenario 3: Idempotency check
            const existingId = await this.fileExists(fileName, targetFolderId);
            if (existingId) {
                console.log(`[DRIVE] File already exists (Skipping): ${fileName} (${existingId})`);
                return existingId;
            }

            console.log(`[DRIVE] Starting upload: ${fileName}...`);

            // Scenario 5: Resumable upload for large files is handled by googleapis automatically
            // if we specify the media body as a stream and set the content type.
            const response = await this.drive.files.create({
                requestBody: {
                    name: fileName,
                    parents: [targetFolderId],
                },
                media: {
                    mimeType: this.getMimeType(fileName),
                    body: fs.createReadStream(filePath),
                },
            });

            const fileId = response.data.id;
            console.log(`[DRIVE] Uploaded successfully! File ID: ${fileId}`);
            return fileId || null;
        } catch (error: any) {
            console.error(`[DRIVE] Upload failed for ${filePath}:`, error.message);
            return null;
        }
    }

    /**
     * Lists all files in a specific folder
     */
    async listFilesInFolder(folderId: string): Promise<any[]> {
        try {
            const response = await this.drive.files.list({
                q: `'${folderId}' in parents and trashed = false`,
                fields: 'files(id, name, mimeType)',
            });
            return response.data.files || [];
        } catch (error: any) {
            console.error(`[DRIVE] Failed to list files in ${folderId}:`, error.message);
            return [];
        }
    }

    /**
     * Downloads a file from Drive to a local path
     */
    async downloadFile(fileId: string, destPath: string): Promise<boolean> {
        try {
            const dest = fs.createWriteStream(destPath);
            const response = await this.drive.files.get(
                { fileId, alt: 'media' },
                { responseType: 'stream' }
            );

            return new Promise((resolve, reject) => {
                response.data
                    .on('end', () => {
                        console.log(`[DRIVE] Downloaded file to: ${destPath}`);
                        resolve(true);
                    })
                    .on('error', (err: any) => {
                        console.error('[DRIVE] Download stream error:', err.message);
                        reject(false);
                    })
                    .pipe(dest);
            });
        } catch (error: any) {
            console.error(`[DRIVE] Download failed for ${fileId}:`, error.message);
            return false;
        }
    }

    /**
     * Lists all files and folders in the target root folder
     */
    async listAllInRoot(): Promise<any[]> {
        try {
            const response = await this.drive.files.list({
                q: `'${this.folderId}' in parents and trashed = false`,
                fields: 'files(id, name, mimeType)',
            });
            return response.data.files || [];
        } catch (error: any) {
            console.error('[DRIVE] Failed to list files:', error.message);
            return [];
        }
    }

    /**
     * Deletes a file or folder by ID
     */
    async deleteItem(fileId: string): Promise<boolean> {
        try {
            await this.drive.files.delete({ fileId });
            return true;
        } catch (error: any) {
            console.error(`[DRIVE] Failed to delete ${fileId}:`, error.message);
            return false;
        }
    }

    /**
     * Moves a file from one folder to another (Instant on Drive)
     */
    async moveFile(fileId: string, currentFolderId: string, newFolderId: string): Promise<boolean> {
        try {
            await this.drive.files.update({
                fileId,
                addParents: newFolderId,
                removeParents: currentFolderId,
                fields: 'id, parents',
            });
            return true;
        } catch (error: any) {
            console.error(`[DRIVE] Move failed for ${fileId}:`, error.message);
            return false;
        }
    }

    private getMimeType(fileName: string): string {
        const ext = path.extname(fileName).toLowerCase();
        const types: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.doc': 'application/msword',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.zip': 'application/zip',
            '.txt': 'text/plain',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
        };
        return types[ext] || 'application/octet-stream';
    }
}
