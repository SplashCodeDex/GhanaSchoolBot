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
    referencedContent?: string[]; // New: Content snippets from local PDFs
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
    includeTheory: boolean;
    includeObjectives: boolean;
    strand?: string;
    subStrand?: string;
    referencedContent?: string[]; // New: Content snippets from local PDFs
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
        const contextPrefix = params.referencedContent && params.referencedContent.length > 0
            ? `
USE THE FOLLOWING LOCAL RESOURCE CONTENT AS PRIMARY CONTEXT:
---
${params.referencedContent.join('\n---\n')}
---
` : "";

        const prompt = `
${contextPrefix}
You are an expert educator in Ghana. Generate a detailed lesson note following the GES curriculum standards.
... [rest of prompt]

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
        const contextPrefix = params.referencedContent && params.referencedContent.length > 0
            ? `
USE THE FOLLOWING LOCAL RESOURCE CONTENT AS PRIMARY CONTEXT FOR QUESTIONS:
---
${params.referencedContent.join('\n---\n')}
---
` : "";

        const prompt = `
${contextPrefix}
You are an expert examiner in Ghana. Generate a highly professional ${params.type} examination paper following WAEC and GES Standards-Based Curriculum guidelines.

SUBJECT: ${params.subject}
GRADE: ${params.grade}
STRAND: ${params.strand || "General"}
SUB-STRAND: ${params.subStrand || "General"}
TOPICS: ${params.topics.join(", ")}
NUMBER OF QUESTIONS: ${params.numQuestions}

EXAM STRUCTURE:
${params.includeObjectives ? `### PAPER 1 (OBJECTIVES)
- Multiple choice questions with 4 options (A-D).
- Focusing on knowledge and understanding.` : ""}

${params.includeTheory ? `### PAPER 2 (ESSAY/THEORY)
- Structured or essay questions.
- Focusing on application and analysis.` : ""}

INSTRUCTIONS TO CANDIDATES:
${params.includeObjectives && params.includeTheory ? "1. This paper consists of two parts: Paper 1 and Paper 2.\n2. Answer all questions in Paper 1.\n3. Answer all questions in Paper 2." : "1. Answer all questions in this paper."}
${params.topics.length > 0 ? `4. Ensure all responses are related to ${params.strand || params.subject}.` : ""}

REQUIREMENTS:
1. Format the paper with clear headings for "SECTION A" and "SECTION B" where applicable.
2. Use professional language suitable for a ${params.grade} student.
3. **Marking Scheme**: Provide a separate, detailed marking scheme with point allocation (e.g., [2 marks]) for every question.

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
