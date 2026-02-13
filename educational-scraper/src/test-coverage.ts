import path from 'path';
import { CoverageReporter } from './utils/coverage-reporter';
import fs from 'fs';

async function testCoverage() {
    const configPath = path.resolve(__dirname, '../config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const reporter = new CoverageReporter(config.geminiApiKey);
    const downloadsPath = path.resolve(__dirname, '../downloads');

    console.log('--- Generating Coverage Report ---');
    try {
        const report = await reporter.generateReport(downloadsPath);
        console.log('Overall Coverage:', report.overallPercentage.toFixed(2), '%');
        console.log('Total Files Indexed:', report.totalFiles);

        console.log('\n--- Grade Breakdown ---');
        report.grades.forEach(g => {
            if (g.overallPercentage > 0) {
                console.log(`${g.gradeId}: ${g.overallPercentage.toFixed(2)}%`);
            }
        });

        const cadIssue = report.grades
            .flatMap(g => g.subjects)
            .find(s => s.subject.includes('Creative Arts'));

        if (cadIssue) {
            console.log('\n--- CAD Coverage ---');
            console.log(`Covered: ${cadIssue.coveredSubStrands}/${cadIssue.totalSubStrands} (${cadIssue.percentage.toFixed(2)}%)`);
            if (cadIssue.gaps.length > 0) {
                console.log('First 3 Gaps:', cadIssue.gaps.slice(0, 3).map(gap => gap.subStrandName));
            }
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testCoverage();
