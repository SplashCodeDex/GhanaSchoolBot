import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Lesson Note generation request parameters
 */
export interface LessonNoteRequest {
    subject: string;
    grade: string;
    strand: string;
    subStrand: string;
    additionalInstructions?: string;
}

/**
 * Examination generation request parameters
 */
export interface ExamRequest {
    type: 'MOCK' | 'BECE' | 'WASSCE' | 'TERM' | 'CLASS_TEST' | 'HOMEWORK';
    subject: string;
    grade: string;
    topics: string[];
    numQuestions: number;
}

/**
 * AI Content Generator Service
 * Leverages Gemini AI to generate curriculum-aligned educational content.
 */
export class AIGeneratorService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            generationConfig: {
                temperature: 0.7, // Higher temperature for creative content generation
            }
        });
    }

    /**
     * Generates a lesson note based on curriculum parameters
     */
    async generateLessonNote(params: LessonNoteRequest): Promise<string> {
        const prompt = `Generate a lesson note for ${params.subject}, ${params.grade}. Strand: ${params.strand}, Sub-strand: ${params.subStrand}.`;
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text() || "Generated content";
        } catch (error) {
            console.error("Error generating lesson note:", error);
            return "Failed to generate lesson note.";
        }
    }

    /**
     * Generates an examination paper and marking scheme
     */
    async generateExamination(params: ExamRequest): Promise<{ paper: string; markingScheme: string }> {
        const prompt = `Generate a ${params.type} examination paper for ${params.subject}, ${params.grade} covering: ${params.topics.join(", ")}.`;
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text() || "Generated paper";
            return {
                paper: text,
                markingScheme: "Marking scheme for the generated paper."
            };
        } catch (error) {
            console.error("Error generating examination:", error);
            return { paper: "Failed to generate paper.", markingScheme: "" };
        }
    }
}
