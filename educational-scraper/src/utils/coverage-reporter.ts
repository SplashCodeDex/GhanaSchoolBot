import fs from 'fs';
import path from 'path';
import { CurriculumService, SubStrand, Strand, CurriculumNode } from './curriculum-service';
import { scanDirectory, FileItem } from './file-scanner';
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface CoverageIssue {
    gradeId: string;
    subject: string;
    strandId: string;
    subStrandId: string;
    subStrandName: string;
    reason: string;
}

export interface SubjectCoverage {
    subject: string;
    totalSubStrands: number;
    coveredSubStrands: number;
    percentage: number;
    gaps: CoverageIssue[];
}

export interface GradeCoverage {
    gradeId: string;
    subjects: SubjectCoverage[];
    overallPercentage: number;
}

export interface FullCoverageReport {
    overallPercentage: number;
    grades: GradeCoverage[];
    totalFiles: number;
    lastUpdated: string;
}

export class CoverageReporter {
    private curriculumService: CurriculumService;
    private genAI?: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey?: string) {
        this.curriculumService = new CurriculumService();
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                generationConfig: { responseMimeType: "application/json" }
            });
        }
    }

    /**
     * Scans the downloads directory and maps files to the curriculum.
     */
    async generateReport(downloadsPath: string): Promise<FullCoverageReport> {
        const files = scanDirectory(downloadsPath);
        const report: FullCoverageReport = {
            overallPercentage: 0,
            grades: [],
            totalFiles: this.countFiles(files),
            lastUpdated: new Date().toISOString()
        };

        const levels = this.curriculumService.getLevels();
        let totalSubStrands = 0;
        let coveredSubStrands = 0;

        for (const level of levels) {
            for (const grade of level.grades) {
                const gradeCoverage: GradeCoverage = {
                    gradeId: grade.id,
                    subjects: [],
                    overallPercentage: 0
                };

                const subjects = this.curriculumService.getSubjectsByGrade(grade.id);
                let gradeTotalSS = 0;
                let gradeCoveredSS = 0;

                for (const subject of subjects) {
                    const subjectCoverage: SubjectCoverage = {
                        subject,
                        totalSubStrands: 0,
                        coveredSubStrands: 0,
                        percentage: 0,
                        gaps: []
                    };

                    const strands = this.curriculumService.getStrands(grade.id, subject);
                    for (const strand of strands) {
                        for (const subStrand of strand.subStrands) {
                            subjectCoverage.totalSubStrands++;
                            gradeTotalSS++;
                            totalSubStrands++;

                            const hasResource = this.checkForResource(files, grade.id, subject, strand, subStrand);
                            if (hasResource) {
                                subjectCoverage.coveredSubStrands++;
                                gradeCoveredSS++;
                                coveredSubStrands++;
                            } else {
                                subjectCoverage.gaps.push({
                                    gradeId: grade.id,
                                    subject,
                                    strandId: strand.id,
                                    subStrandId: subStrand.id,
                                    subStrandName: subStrand.name,
                                    reason: "No matching files found in expected directories."
                                });
                            }
                        }
                    }

                    if (subjectCoverage.totalSubStrands > 0) {
                        subjectCoverage.percentage = (subjectCoverage.coveredSubStrands / subjectCoverage.totalSubStrands) * 100;
                    }
                    gradeCoverage.subjects.push(subjectCoverage);
                }

                if (gradeTotalSS > 0) {
                    gradeCoverage.overallPercentage = (gradeCoveredSS / gradeTotalSS) * 100;
                }
                report.grades.push(gradeCoverage);
            }
        }

        if (totalSubStrands > 0) {
            report.overallPercentage = (coveredSubStrands / totalSubStrands) * 100;
        }

        return report;
    }

    /**
     * Deep check for resources matching a sub-strand.
     * Uses path heuristics and keyword matching for now.
     */
    private checkForResource(files: FileItem[], gradeId: string, subject: string, strand: Strand, subStrand: SubStrand): boolean {
        // 1. Identify relevant directory
        // Grade folders are named like "Grade7_JHS1" or "SHS1"
        const gradeRegex = new RegExp(`${gradeId}`, 'i');
        const gradeDir = files.find(f => f.type === 'directory' && gradeRegex.test(f.name));

        if (!gradeDir || !gradeDir.children) return false;

        // 2. Find subject folder
        const subjectRegex = new RegExp(subject.replace(/\s+/g, '.*'), 'i');
        const subjectDir = gradeDir.children.find(f => f.type === 'directory' && subjectRegex.test(f.name));

        if (!subjectDir || !subjectDir.children) return false;

        // 3. Check for files matching sub-strand name or keywords
        const ssKeywords = [subStrand.name, ...(subStrand.indicators || [])];
        const flatFiles = this.flattenFiles(subjectDir.children);

        return flatFiles.some(file => {
            const fileName = file.name.toLowerCase();
            return ssKeywords.some(kw => fileName.includes(kw.toLowerCase()));
        });
    }

    private flattenFiles(items: FileItem[]): FileItem[] {
        let result: FileItem[] = [];
        for (const item of items) {
            if (item.type === 'file') {
                result.push(item);
            } else if (item.children) {
                result = result.concat(this.flattenFiles(item.children));
            }
        }
        return result;
    }

    private countFiles(items: FileItem[]): number {
        return this.flattenFiles(items).length;
    }

    /**
     * AI-Powered detailed indexing.
     * This will be called via POST /api/coverage/re-index
     */
    async aiReIndex(downloadsPath: string): Promise<any> {
        if (!this.model) throw new Error("Gemini API key not configured for AI indexing.");

        const report = await this.generateReport(downloadsPath);
        const gaps = report.grades.flatMap(g => g.subjects.flatMap(s => s.gaps));

        if (gaps.length === 0) return { message: "No gaps found, indexing up to date." };

        // For each gap, we can try to look into the "Review_Needed" folder or other places
        // using semantic matching. For brevity in this initial implementation,
        // we'll return the identified gaps with AI-suggested search queries.

        const prompt = `
            You are an educational content optimizer.
            Given these missing topics from a Ghanaian curriculum, generate exactly one optimized search query for each to find relevant PDFs/textbooks.

            MISSING TOPICS:
            ${JSON.stringify(gaps.slice(0, 10))}

            RETURN FORMAT:
            {
                "suggestions": [
                    { "subStrandId": "ID", "query": "Optimized Google Search Query" }
                ]
            }
        `;

        const result = await this.model.generateContent(prompt);
        return JSON.parse(result.response.text());
    }
}
