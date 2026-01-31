import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as mime from 'mime-types';

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

export async function downloadFile(url: string, folder: string) {
    try {
        // 1. Determine Filename
        // We do a HEAD request first or just parse URL to get name?
        // Let's just parse URL first to save bandwidth, if it looks generic we head.
        let filename = path.basename(new URL(url).pathname);
        if (!filename || filename.length < 3) filename = `download_${Date.now()}`;

        // Clean filename
        filename = filename.replace(/[^a-z0-9._-]/gi, '_');

        // 2. Check overlap with ANY existing file in the downloads/ folder (recursive)
        // The user said: "make sure it doesn't save already existing files" and they sort them manually.
        const rootDownloads = path.resolve('downloads');
        if (fileExistsRecursively(rootDownloads, filename)) {
            console.log(`[SKIP] Already exists: ${filename}`);
            return;
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
                        return;
                    }
                }
            }
        }

        // Ensure extension
        if (!path.extname(filename)) {
            const ext = mime.extension(response.headers['content-type']);
            if (ext) filename = `${filename}.${ext}`;
        }

        const filePath = path.resolve(folder, filename);

        // Ensure folder exists
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`[DOWNLOADED] ${filename}`);
                resolve(filePath);
            });
            writer.on('error', reject);
        });
    } catch (error) {
        // console.error(`Failed to download ${url}:`, error.message);
    }
}
