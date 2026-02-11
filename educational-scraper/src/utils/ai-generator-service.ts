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
        const prompt = `
You are an expert educator in Ghana. Generate a detailed lesson note following the GES curriculum standards.

SUBJECT: ${params.subject}
GRADE: ${params.grade}
STRAND: ${params.strand}
SUB-STRAND: ${params.subStrand}
${params.additionalInstructions ? `ADDITIONAL INSTRUCTIONS: ${params.additionalInstructions}` : ""}

STRUCTURE:
1. **Objective**: What the students should achieve by the end of the lesson.
2. **Introduction**: A brief engaging start to the lesson.
3. **Main Body**: Detailed delivery of the topic with clear points.
4. **Conclusion**: Summary of the key takeaways.
5. **Evaluation**: 3-5 assessment questions to test understanding.

Please format the output in Markdown.
        `.trim();

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
