import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import { MappingService } from "./mapping-service";

describe("MappingService", () => {
    const testMappingPath = path.resolve(__dirname, "../../data/test_file_mappings.json");
    let service: MappingService;

    beforeEach(() => {
        // Create an empty test mapping file
        fs.writeFileSync(testMappingPath, JSON.stringify([]));
        service = new MappingService(testMappingPath);
    });

    afterEach(() => {
        // Clean up test file
        if (fs.existsSync(testMappingPath)) {
            fs.unlinkSync(testMappingPath);
        }
    });

    test("should save and retrieve a mapping", () => {
        const mapping = {
            filePath: "test/path/file.pdf",
            curriculumNodeId: "m_jhs1_s1"
        };

        service.addMapping(mapping.filePath, mapping.curriculumNodeId);
        const mappings = service.getMappings();

        assert.strictEqual(mappings.length, 1);
        assert.strictEqual(mappings[0].filePath, mapping.filePath);
        assert.strictEqual(mappings[0].curriculumNodeId, mapping.curriculumNodeId);
    });

    test("should retrieve mapping for a specific file", () => {
        service.addMapping("file1.pdf", "id1");
        service.addMapping("file2.pdf", "id2");

        const mapping = service.getMappingForFile("file1.pdf");
        assert.ok(mapping);
        assert.strictEqual(mapping?.curriculumNodeId, "id1");
    });

    test("should delete a mapping", () => {
        service.addMapping("file1.pdf", "id1");
        service.removeMapping("file1.pdf");

        const mappings = service.getMappings();
        assert.strictEqual(mappings.length, 0);
    });

    test("should not add duplicate mappings for the same file", () => {
        service.addMapping("file1.pdf", "id1");
        service.addMapping("file1.pdf", "id2"); // Update existing

        const mappings = service.getMappings();
        assert.strictEqual(mappings.length, 1);
        assert.strictEqual(mappings[0].curriculumNodeId, "id2");
    });
});
