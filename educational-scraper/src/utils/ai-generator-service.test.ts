import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { AIGeneratorService } from "./ai-generator-service";

// Mock the GoogleGenerativeAI dependency
let lastPrompt = "";
const mockModel = {
    generateContent: async (prompt: string) => {
        lastPrompt = prompt;
        // Return JSON if it looks like an exam request
        const responseText = prompt.includes("JSON") 
            ? JSON.stringify({ paper: "Generated paper content", markingScheme: "Generated marking scheme" })
            : "Generated content";
            
        return {
            response: {
                text: () => responseText
            }
        };
    }
};

describe("AIGeneratorService", () => {
    let service: AIGeneratorService;

    beforeEach(() => {
        service = new AIGeneratorService("test-api-key");
        // Inject mock model
        (service as any).model = mockModel;
        lastPrompt = "";
    });

    test("should be initialized", () => {
        assert.ok(service);
    });

    test("generateLessonNote should construct a correct prompt", async () => {
        const params = {
            subject: "Mathematics",
            grade: "JHS1",
            strand: "Number",
            subStrand: "Integers"
        };
        await service.generateLessonNote(params);
        assert.ok(lastPrompt.includes("Mathematics"), "Prompt should include subject");
        assert.ok(lastPrompt.includes("JHS1"), "Prompt should include grade");
        assert.ok(lastPrompt.includes("Integers"), "Prompt should include sub-strand");
        assert.ok(lastPrompt.includes("Objective"), "Prompt should ask for Objective");
    });

    test("generateExamination should return paper and marking scheme", async () => {
        const params = {
            type: 'BECE' as const,
            subject: "Science",
            grade: "JHS3",
            topics: ["Matter", "Energy"],
            numQuestions: 10
        };
        await service.generateExamination(params);
        assert.ok(lastPrompt.includes("BECE"), "Prompt should include exam type");
        assert.ok(lastPrompt.includes("Science"), "Prompt should include subject");
        assert.ok(lastPrompt.includes("Matter"), "Prompt should include topics");
        assert.ok(lastPrompt.includes("Marking Scheme"), "Prompt should ask for Marking Scheme");
    });
});
