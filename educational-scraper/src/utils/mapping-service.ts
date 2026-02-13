import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CurriculumService } from "./curriculum-service";

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

    async predictMapping(filePath: string, geminiApiKey: string, curriculumService: CurriculumService): Promise<string | null> {
        if (!geminiApiKey) return null;

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Get basic info for context
        const filename = path.basename(filePath);
        
        // Build curriculum context
        const levels = curriculumService.getLevels();
        const curriculumContext: any[] = [];
        
        // Simplify for prompt
        levels.forEach(level => {
            level.grades.forEach(grade => {
                const subjects = curriculumService.getSubjectsByGrade(grade.id);
                subjects.forEach(subject => {
                    const strands = curriculumService.getStrands(grade.id, subject);
                    strands.forEach(strand => {
                        curriculumContext.push({
                            id: strand.id,
                            path: `${level.name} > ${grade.name} > ${subject} > ${strand.name}`
                        });
                        strand.subStrands.forEach(ss => {
                            curriculumContext.push({
                                id: ss.id,
                                path: `${level.name} > ${grade.name} > ${subject} > ${strand.name} > ${ss.name}`,
                                description: ss.description
                            });
                        });
                    });
                });
            });
        });

        const prompt = `
You are an expert in the Ghanaian GES curriculum.
Your goal is to map a local file to the most relevant node in the curriculum knowledge base.

FILE NAME: "${filename}"
FILE PATH: "${filePath}"

CURRICULUM NODES (Sample):
${JSON.stringify(curriculumContext.slice(0, 100))}

INSTRUCTIONS:
1. Analyze the filename and path.
2. Identify the single most relevant curriculum node ID from the provided list.
3. If you are not confident, return null.
4. Return ONLY the ID (e.g. "m_jhs1_s1") or the string "null".
        `.trim();

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();
            
            return text === "null" ? null : text;
        } catch (error) {
            console.error('Mapping prediction error:', error);
            return null;
        }
    }
}
