import { createPlaywrightRouter } from 'crawlee';
import { downloadFile } from './utils/file-downloader';
import { StatsManager } from './utils/stats-manager';
import { AIPreFilter, LinkContext } from './utils/ai-pre-filter';
import path from 'path';
import fs from 'fs';

export const router = createPlaywrightRouter();

// Load config
const configPath = path.resolve('config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Initialize stats manager
const statsManager = new StatsManager();

// Initialize AI Pre-Filter if enabled
let aiPreFilter: AIPreFilter | null = null;
if (config.aiPreFilter?.enabled && config.geminiApiKey) {
    aiPreFilter = new AIPreFilter(config.geminiApiKey, {
        targetSubjects: config.aiPreFilter.targetSubjects || [],
        targetGrades: config.aiPreFilter.targetGrades || [],
        minConfidence: config.aiPreFilter.minConfidence || 0.65,
        enableCaching: config.aiPreFilter.enableCaching !== false
    });
    console.log('✅ AI Pre-Filter enabled with config:', config.aiPreFilter);
} else {
    console.log('⚠️ AI Pre-Filter disabled');
}

const KEYWORDS_REGEX = new RegExp(config.keywords.join('|'), 'i');
const EXTENSIONS_REGEX = new RegExp(`\\.(${config.fileExtensions.join('|')})$`, 'i');

router.addDefaultHandler(async ({ page, enqueueLinks, log, request }) => {
    log.info(`Processing: ${request.url}`);
    
    try {
        // Title extraction for context
        const title = await page.title();
        // log.info(`Title: ${title}`);

        // 1. Look for targeted download links with context
        const extensionRegexStr = `\\\\.(${config.fileExtensions.join('|')})$`;

        const downloadLinksWithContext = await page.evaluate((regexStr) => {
            const regex = new RegExp(regexStr, 'i');
            const anchors = Array.from(document.querySelectorAll('a'));
            return anchors
                .filter(a => regex.test(a.href))
                .map(a => {
                    // Extract context for AI analysis
                    const parent = a.parentElement;
                    const surroundingText = parent ? parent.innerText.slice(0, 300) : '';
                    
                    return {
                        url: a.href,
                        linkText: a.innerText.trim(),
                        surroundingText: surroundingText,
                        anchorAttributes: {
                            title: a.title || '',
                            className: a.className || ''
                        }
                    };
                });
        }, extensionRegexStr);

        if (downloadLinksWithContext.length > 0) {
            log.info(`Found ${downloadLinksWithContext.length} potential downloads.`);
            const downloadDir = path.resolve('downloads');

            for (const linkContext of downloadLinksWithContext) {
                try {
                    let shouldDownload = true;
                    let aiDecision = null;

                    // AI Pre-Filtering
                    if (aiPreFilter) {
                        const context: LinkContext = {
                            url: linkContext.url,
                            linkText: linkContext.linkText,
                            surroundingText: linkContext.surroundingText,
                            pageTitle: title,
                            anchorAttributes: linkContext.anchorAttributes
                        };

                        aiDecision = await aiPreFilter.shouldDownload(context);
                        shouldDownload = aiDecision.shouldDownload;

                        // Update AI filter statistics
                        statsManager.updateAIFilterStats(shouldDownload, aiDecision.confidence);

                        if (config.aiPreFilter?.logDecisions) {
                            const icon = shouldDownload ? '✅' : '❌';
                            log.info(
                                `${icon} AI Decision [${(aiDecision.confidence * 100).toFixed(0)}%]: ${linkContext.url}\n` +
                                `   Reason: ${aiDecision.reasoning}\n` +
                                `   Subject: ${aiDecision.detectedSubject || 'N/A'}, Grade: ${aiDecision.detectedGrade || 'N/A'}`
                            );
                        }

                        // Track filtered files
                        if (!shouldDownload) {
                            statsManager.incrementFiltered();
                        }
                    }

                    // Download only if AI approved (or AI disabled)
                    if (shouldDownload) {
                        const success = await downloadFile(linkContext.url, downloadDir);
                        if (success) {
                            console.log(`✅ Downloaded: ${linkContext.url}`);
                            statsManager.incrementDownloaded();
                        } else {
                            statsManager.incrementErrors();
                        }
                    }
                } catch (error) {
                    log.error(`Failed to process ${linkContext.url}:`, error);
                    statsManager.incrementErrors();
                }
            }
        }

        // 2. Enqueue more links to crawl
        await enqueueLinks({
            strategy: 'same-domain',
            transformRequestFunction: (req) => {
                // Priority boosting could happen here
                return req;
            }
        });

        // 3. (Optional) Log if this page strongly matches our keywords
        if (KEYWORDS_REGEX.test(request.url) || KEYWORDS_REGEX.test(title)) {
            log.info(`[RELEVANT PAGE] ${title}`);
        }
        
        // Track successful URL processing
        statsManager.incrementUrlsProcessed(true);
        
    } catch (error) {
        log.error(`Error processing ${request.url}:`, error);
        statsManager.incrementUrlsProcessed(false);
        statsManager.incrementErrors();
        throw error; // Re-throw to let Crawlee handle retries
    }
});
