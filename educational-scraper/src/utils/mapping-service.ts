import fs from 'fs';
import path from 'path';

export interface FileMapping {
    filePath: string;
    curriculumNodeId: string;
}

export class MappingService {
    private mappingPath: string;
    private mappings: FileMapping[];

    constructor(mappingPath?: string) {
        this.mappingPath = mappingPath || path.resolve(__dirname, '../../data/file_mappings.json');
        this.mappings = this.loadMappings();
    }

    private loadMappings(): FileMapping[] {
        try {
            if (fs.existsSync(this.mappingPath)) {
                const data = fs.readFileSync(this.mappingPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Failed to load file mappings:', error);
        }
        return [];
    }

    private saveMappings(): void {
        try {
            const data = JSON.stringify(this.mappings, null, 2);
            fs.writeFileSync(this.mappingPath, data, 'utf8');
        } catch (error) {
            console.error('Failed to save file mappings:', error);
        }
    }

    getMappings(): FileMapping[] {
        return this.mappings;
    }

    getMappingForFile(filePath: string): FileMapping | undefined {
        return this.mappings.find(m => m.filePath === filePath);
    }

    addMapping(filePath: string, curriculumNodeId: string): void {
        const index = this.mappings.findIndex(m => m.filePath === filePath);
        if (index !== -1) {
            this.mappings[index].curriculumNodeId = curriculumNodeId;
        } else {
            this.mappings.push({ filePath, curriculumNodeId });
        }
        this.saveMappings();
    }

    removeMapping(filePath: string): void {
        this.mappings = this.mappings.filter(m => m.filePath !== filePath);
        this.saveMappings();
    }
}
