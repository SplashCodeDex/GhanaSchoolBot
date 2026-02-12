import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface Grade {
    id: string;
    name: string;
}

export interface Level {
    id: string;
    name: string;
    grades: Grade[];
}

export interface SubStrand {
    id: string;
    name: string;
    indicators: string[];
    description?: string;
    tips?: string;
}

export interface Strand {
    id: string;
    name: string;
    subStrands: SubStrand[];
}

export interface CurriculumNode {
    gradeId: string;
    subject: string;
    strands: Strand[];
}

export interface CurriculumKB {
    levels: Level[];
    curriculum: CurriculumNode[];
}

export class CurriculumService {
    private kb: CurriculumKB;

    constructor() {
        const kbPath = path.resolve(__dirname, '../../data/curriculum_kb.json');
        try {
            const data = fs.readFileSync(kbPath, 'utf8');
            this.kb = JSON.parse(data);
        } catch (error) {
            console.error('Failed to load curriculum KB:', error);
            this.kb = { levels: [], curriculum: [] };
        }
    }

    getLevels(): Level[] {
        return this.kb.levels;
    }

    getGradesByLevel(levelId: string): Grade[] {
        const level = this.kb.levels.find(l => l.id === levelId);
        return level ? level.grades : [];
    }

    getSubjectsByGrade(gradeId: string): string[] {
        return this.kb.curriculum
            .filter(c => c.gradeId === gradeId)
            .map(c => c.subject);
    }

    getStrands(gradeId: string, subject: string): Strand[] {
        const node = this.kb.curriculum.find(c => c.gradeId === gradeId && c.subject === subject);
        return node ? node.strands : [];
    }

    getSubStrands(gradeId: string, subject: string, strandId: string): SubStrand[] {
        const strand = this.getStrands(gradeId, subject).find(s => s.id === strandId);
        return strand ? strand.subStrands : [];
    }

    search(query: string): any[] {
        // Simple keyword search for now, Phase 2 will implement AI semantic search
        const results: any[] = [];
        const q = query.toLowerCase();

        this.kb.curriculum.forEach(node => {
            node.strands.forEach(strand => {
                if (strand.name.toLowerCase().includes(q)) {
                    results.push({ type: 'strand', node, strand });
                }
                strand.subStrands.forEach(ss => {
                    if (ss.name.toLowerCase().includes(q) || (ss.description && ss.description.toLowerCase().includes(q))) {
                        results.push({ type: 'subStrand', node, strand, subStrand: ss });
                    }
                });
            });
        });

        return results;
    }

    async semanticSearch(query: string, geminiApiKey: string): Promise<any[]> {
        if (!geminiApiKey) {
            return this.search(query);
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Build a context of all strands and sub-strands
        const contextItems: any[] = [];
        this.kb.curriculum.forEach(node => {
            node.strands.forEach(strand => {
                contextItems.push({
                    type: 'strand',
                    gradeId: node.gradeId,
                    subject: node.subject,
                    name: strand.name,
                    id: strand.id
                });
                strand.subStrands.forEach(ss => {
                    contextItems.push({
                        type: 'subStrand',
                        gradeId: node.gradeId,
                        subject: node.subject,
                        strandName: strand.name,
                        name: ss.name,
                        id: ss.id,
                        description: ss.description
                    });
                });
            });
        });

        const prompt = `
You are an expert in the Ghanaian GES curriculum.
Given the following list of curriculum topics (Strands and Sub-strands) and a user query, identify the top 5 most relevant topics.

USER QUERY: "${query}"

CURRICULUM TOPICS (Sample):
${JSON.stringify(contextItems.slice(0, 50))}

INSTRUCTIONS:
1. Return a JSON array of the top 5 relevant topic IDs.
2. If nothing is relevant, return an empty array.
3. Only return the JSON array, no other text.
        `.trim();

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Clean up the response to extract JSON array
            const jsonMatch = text.match(/\[.*\]/s);
            if (!jsonMatch) return this.search(query);
            
            const relevantIds = JSON.parse(jsonMatch[0]);

            // Map IDs back to full objects
            return contextItems.filter(item => relevantIds.includes(item.id));
        } catch (error) {
            console.error('Semantic search error:', error);
            return this.search(query); // Fallback to keyword search
        }
    }
}
