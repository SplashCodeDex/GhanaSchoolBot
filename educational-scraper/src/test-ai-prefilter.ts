import { AIPreFilter, LinkContext } from './utils/ai-pre-filter';
import fs from 'fs';
import path from 'path';

/**
 * Test script for AI Pre-Filter
 * Tests various scenarios to validate AI decision-making
 */

// Load config
const configPath = path.resolve('config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

async function runTests() {
    console.log('🧪 AI Pre-Filter Test Suite\n');
    console.log('='.repeat(80));

    // Initialize AI Pre-Filter
    const aiPreFilter = new AIPreFilter(config.geminiApiKey, {
        targetSubjects: ['Mathematics', 'Physics'],
        targetGrades: ['SHS1', 'SHS2', 'SHS3'],
        minConfidence: 0.65,
        enableCaching: true
    });

    console.log('✅ AI Pre-Filter initialized with:');
    console.log('   Target Subjects: Mathematics, Physics');
    console.log('   Target Grades: SHS1, SHS2, SHS3');
    console.log('   Min Confidence: 0.65\n');
    console.log('='.repeat(80));

    // Test cases
    const testCases: Array<{ name: string; context: LinkContext; expectedResult: boolean }> = [
        {
            name: 'Test 1: Clear Mathematics PDF',
            context: {
                url: 'https://example.com/shs2-mathematics-textbook.pdf',
                linkText: 'Download SHS 2 Mathematics Textbook',
                surroundingText: 'This comprehensive mathematics textbook covers algebra, geometry, and trigonometry for SHS 2 students.',
                pageTitle: 'Mathematics Resources - SHS'
            },
            expectedResult: true
        },
        {
            name: 'Test 2: Physics Past Questions',
            context: {
                url: 'https://example.com/physics-past-questions-shs1.pdf',
                linkText: 'Physics Past Questions 2023',
                surroundingText: 'Download past examination questions for SHS 1 Physics with detailed solutions.',
                pageTitle: 'WASSCE Physics Resources'
            },
            expectedResult: true
        },
        {
            name: 'Test 3: Biology Resource (Should Reject - Wrong Subject)',
            context: {
                url: 'https://example.com/biology-notes-shs2.pdf',
                linkText: 'Biology Notes for SHS 2',
                surroundingText: 'Comprehensive biology notes covering cells, genetics, and ecology.',
                pageTitle: 'Science Resources'
            },
            expectedResult: false
        },
        {
            name: 'Test 4: Mathematics for JHS (Should Reject - Wrong Grade)',
            context: {
                url: 'https://example.com/jhs3-maths-workbook.pdf',
                linkText: 'JHS 3 Mathematics Workbook',
                surroundingText: 'BECE preparation mathematics workbook for Junior High School students.',
                pageTitle: 'JHS Resources'
            },
            expectedResult: false
        },
        {
            name: 'Test 5: General Website Navigation Link (Should Reject)',
            context: {
                url: 'https://example.com/contact-us.pdf',
                linkText: 'Contact Us',
                surroundingText: 'Get in touch with our team. Email us at info@example.com',
                pageTitle: 'Contact - Educational Portal'
            },
            expectedResult: false
        },
        {
            name: 'Test 6: Physics Curriculum Document',
            context: {
                url: 'https://nacca.gov.gh/shs-physics-curriculum-2024.pdf',
                linkText: 'SHS Physics Curriculum Framework',
                surroundingText: 'National curriculum document for Senior High School Physics covering mechanics, electricity, and modern physics.',
                pageTitle: 'Curriculum Documents - NACCA'
            },
            expectedResult: true
        },
        {
            name: 'Test 7: Ambiguous Link',
            context: {
                url: 'https://example.com/download.pdf',
                linkText: 'Download',
                surroundingText: 'Click here to download the file.',
                pageTitle: 'Resources'
            },
            expectedResult: false // Should reject due to low confidence
        },
        {
            name: 'Test 8: Mathematics with Alternative Spelling',
            context: {
                url: 'https://example.com/maths-revision-shs3.pdf',
                linkText: 'Maths Revision Guide - Senior High',
                surroundingText: 'Complete revision guide for SHS 3 maths students preparing for WASSCE examinations.',
                pageTitle: 'Exam Preparation Materials'
            },
            expectedResult: true
        }
    ];

    // Run tests
    let passed = 0;
    let failed = 0;

    for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];
        console.log(`\n${test.name}`);
        console.log('-'.repeat(80));
        console.log(`URL: ${test.context.url}`);
        console.log(`Link Text: ${test.context.linkText}`);
        
        try {
            const decision = await aiPreFilter.shouldDownload(test.context);
            
            console.log(`\n📊 AI Decision:`);
            console.log(`   Should Download: ${decision.shouldDownload ? '✅ YES' : '❌ NO'}`);
            console.log(`   Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
            console.log(`   Reasoning: ${decision.reasoning}`);
            console.log(`   Detected Subject: ${decision.detectedSubject || 'N/A'}`);
            console.log(`   Detected Grade: ${decision.detectedGrade || 'N/A'}`);

            // Validate result
            const isCorrect = decision.shouldDownload === test.expectedResult;
            if (isCorrect) {
                console.log(`\n✅ TEST PASSED (Expected: ${test.expectedResult ? 'Download' : 'Skip'})`);
                passed++;
            } else {
                console.log(`\n❌ TEST FAILED (Expected: ${test.expectedResult ? 'Download' : 'Skip'}, Got: ${decision.shouldDownload ? 'Download' : 'Skip'})`);
                failed++;
            }

            // Small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error: any) {
            console.log(`\n❌ ERROR: ${error.message}`);
            failed++;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📈 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${testCases.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

    // Cache stats
    const cacheStats = aiPreFilter.getCacheStats();
    console.log(`\n📦 Cache Statistics:`);
    console.log(`   Cache Size: ${cacheStats.cacheSize} entries`);
    console.log(`   Total Requests: ${cacheStats.requestCount}`);

    console.log('\n='.repeat(80));
    console.log('🎉 Test suite completed!\n');
}

// Run the tests
runTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
