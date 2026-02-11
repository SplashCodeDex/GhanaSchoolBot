import fs from 'fs';
import path from 'path';

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
}
