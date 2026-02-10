
import fs from 'fs';
import path from 'path';

export interface FileItem {
    name: string;
    path: string;
    size: number;
    date: Date;
    type: 'file' | 'directory';
    children?: FileItem[];
}

export const scanDirectory = (dirPath: string, relativePath: string = ''): FileItem[] => {
    if (!fs.existsSync(dirPath)) return [];

    const items = fs.readdirSync(dirPath);
    return items.map(item => {
        const fullPath = path.join(dirPath, item);
        const itemRelativePath = path.join(relativePath, item);
        let stats;
        try {
            stats = fs.statSync(fullPath);
        } catch (e) {
            return null;
        }

        if (!stats) return null;

        if (stats.isDirectory()) {
            return {
                name: item,
                path: itemRelativePath,
                size: 0,
                date: stats.mtime,
                type: 'directory',
                children: scanDirectory(fullPath, itemRelativePath)
            };
        } else {
            return {
                name: item,
                path: itemRelativePath,
                size: stats.size,
                date: stats.mtime,
                type: 'file'
            };
        }
    }).filter(Boolean) as FileItem[];
};
