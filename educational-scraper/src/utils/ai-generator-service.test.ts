import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { AIGeneratorService } from "./ai-generator-service";

// Mock the GoogleGenerativeAI dependency
let lastPrompt = "";
const mockModel = {
    generateContent: async (prompt: string) => {
        lastPrompt = prompt;
        return {
            response: {
                text: () => "Generated content"
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
            type: 'MOCK' as const,
            subject: "Science",
            grade: "SHS1",
            topics: ["Cells", "Ecosystems"],
            numQuestions: 10
        };
        const result = await service.generateExamination(params);
        assert.strictEqual(typeof result.paper, "string");
        assert.strictEqual(typeof result.markingScheme, "string");
        assert.ok(result.paper.length > 0, "Paper should not be empty");
    });
});
