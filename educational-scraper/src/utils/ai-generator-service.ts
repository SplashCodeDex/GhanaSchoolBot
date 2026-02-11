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
            model: "gemini-2.0-flash",
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
        const prompt = `
You are an expert examiner in Ghana. Generate a ${params.type} examination paper following WAEC and GES standards.

SUBJECT: ${params.subject}
GRADE: ${params.grade}
TOPICS: ${params.topics.join(", ")}
NUMBER OF QUESTIONS: ${params.numQuestions}

REQUIREMENTS:
1. **Section A**: Multiple choice questions with 4 options each.
2. **Section B**: Theory/Structured questions based on the topics.
3. **Marking Scheme**: Provide a detailed marking scheme for all questions at the end, clearly separated.

Please format the output as a JSON object with two fields: "paper" (the exam questions in Markdown) and "markingScheme" (the answers and marks allocation in Markdown).
        `.trim();

        try {
            // Update model to use JSON response if possible, otherwise parse manually
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text() || "{}";
            
            try {
                // Try to parse as JSON if the model followed instructions
                const data = JSON.parse(text);
                return {
                    paper: data.paper || text,
                    markingScheme: data.markingScheme || "Marking scheme not provided."
                };
            } catch {
                // Fallback for non-JSON response
                return {
                    paper: text,
                    markingScheme: "Marking scheme included in the paper text."
                };
            }
        } catch (error) {
            console.error("Error generating examination:", error);
            return { paper: "Failed to generate paper.", markingScheme: "" };
        }
    }
}
