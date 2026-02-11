import request from 'supertest';
import { test, describe } from 'node:test';
import assert from 'node:assert';
// @ts-ignore
import { app } from './server';

describe('AI Generation API', () => {
    test('POST /api/ai/generate-lesson-note should return 200 and generated note', async () => {
        const response = await request(app)
            .post('/api/ai/generate-lesson-note')
            .send({
                subject: 'Mathematics',
                grade: 'JHS1',
                strand: 'Number',
                subStrand: 'Integers'
            });
        
        assert.strictEqual(response.status, 200);
        assert.ok(response.body.hasOwnProperty('note'), "Response should have 'note' property");
        assert.strictEqual(typeof response.body.note, 'string');
    });

    test('POST /api/ai/generate-exam should return 200 and generated paper', async () => {
        const response = await request(app)
            .post('/api/ai/generate-exam')
            .send({
                type: 'BECE',
                subject: 'Science',
                grade: 'JHS3',
                topics: ['Matter'],
                numQuestions: 5
            });
        
        assert.strictEqual(response.status, 200);
        assert.ok(response.body.hasOwnProperty('paper'), "Response should have 'paper' property");
        assert.ok(response.body.hasOwnProperty('markingScheme'), "Response should have 'markingScheme' property");
    });
});
