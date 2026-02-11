import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { AIGeneratorService } from "./ai-generator-service";

// Mock the GoogleGenerativeAI dependency
const mockModel = {
    generateContent: async (prompt: string) => ({
        response: {
            text: () => `Generated content for: ${prompt}`
        }
    })
};

describe("AIGeneratorService", () => {
    let service: AIGeneratorService;

    beforeEach(() => {
        service = new AIGeneratorService("test-api-key");
        // Inject mock model
        (service as any).model = mockModel;
    });

    test("should be initialized", () => {
        assert.ok(service);
    });

    test("generateLessonNote should return a generated string", async () => {
        const params = {
            subject: "Mathematics",
            grade: "JHS1",
            strand: "Number",
            subStrand: "Integers"
        };
        const result = await service.generateLessonNote(params);
        assert.strictEqual(typeof result, "string");
        assert.ok(result.length > 0, "Result should not be empty");
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
