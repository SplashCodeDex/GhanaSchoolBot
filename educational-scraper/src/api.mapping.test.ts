import { test, describe } from "node:test";
import assert from "node:assert";
import request from "supertest";
import { app } from "./server";

describe("Mapping API", () => {
    test("GET /api/mapping should return mappings", async () => {
        const response = await request(app).get("/api/mapping");
        assert.strictEqual(response.status, 200);
        assert.ok(Array.isArray(response.body));
    });

    test("POST /api/mapping/confirm should save a mapping", async () => {
        const response = await request(app)
            .post("/api/mapping/confirm")
            .send({ filePath: "test_api.pdf", curriculumNodeId: "test_node" });
        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.body.success, true);

        // Verify it was saved
        const getResponse = await request(app).get("/api/mapping");
        assert.ok(getResponse.body.some((m: any) => m.filePath === "test_api.pdf"));
    });

    test("POST /api/mapping/predict should return a prediction", async () => {
        // This will call real Gemini if API key is set, or fallback gracefully
        const response = await request(app)
            .post("/api/mapping/predict")
            .send({ filePath: "Mathematics_JHS1_Number.pdf" });
        
        assert.strictEqual(response.status, 200);
        // We don't strictly assert the prediction value as it depends on AI/Quota
        assert.ok(response.body.hasOwnProperty('prediction'));
    });
});
