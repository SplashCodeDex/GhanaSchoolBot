import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import { CurriculumService } from "./curriculum-service";

describe("CurriculumService", () => {
    let service: CurriculumService;

    beforeEach(() => {
        service = new CurriculumService();
    });

    test("should load levels and grades", () => {
        const levels = service.getLevels();
        assert.ok(levels.length > 0);
        assert.ok(levels.find(l => l.id === 'jhs'));
    });

    test("should retrieve subjects for a grade", () => {
        const subjects = service.getSubjectsByGrade('jhs1');
        assert.ok(subjects.includes("Mathematics"));
    });

    test("should retrieve strands for a subject and grade", () => {
        const strands = service.getStrands('jhs1', 'Mathematics');
        assert.ok(strands.length > 0);
        assert.strictEqual(strands[0].name, "Number");
    });

    test("should retrieve sub-strands for a strand", () => {
        const subStrands = service.getSubStrands('jhs1', 'Mathematics', 'm_jhs1_s1');
        assert.ok(subStrands.length > 0);
        assert.ok(subStrands[0].name.includes("Numeration Systems"));
    });

    test("should perform basic keyword search", () => {
        const results = service.search("Number");
        assert.ok(results.length > 0);
        assert.ok(results.some(r => r.type === 'strand' && r.strand.name === 'Number'));
    });
});
