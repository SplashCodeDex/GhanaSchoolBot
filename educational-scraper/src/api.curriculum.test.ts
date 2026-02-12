import { test, describe } from "node:test";
import assert from "node:assert";
import request from "supertest";
import { app } from "./server";

describe("Curriculum API", () => {
    test("GET /api/curriculum/subjects should return subjects for a grade", async () => {
        const response = await request(app).get("/api/curriculum/subjects?gradeId=jhs1");
        assert.strictEqual(response.status, 200);
        assert.ok(Array.isArray(response.body));
        assert.ok(response.body.includes("Mathematics"));
    });

    test("GET /api/curriculum/structure should return full structure", async () => {
        const response = await request(app).get("/api/curriculum/structure?gradeId=jhs1&subject=Mathematics");
        assert.strictEqual(response.status, 200);
        assert.ok(response.body.strands);
        assert.ok(response.body.strands.length > 0);
    });

    test("POST /api/curriculum/search should return semantic results", async () => {
        const response = await request(app)
            .post("/api/curriculum/search")
            .send({ query: "How to count numbers in JHS1" });
        assert.strictEqual(response.status, 200);
        assert.ok(Array.isArray(response.body.results));
        assert.ok(response.body.results.length > 0);
    });
});
