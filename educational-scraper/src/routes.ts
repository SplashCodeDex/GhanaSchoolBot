import { createPlaywrightRouter } from 'crawlee';
import { downloadFile } from './utils/file-downloader';
import { StatsManager } from './utils/stats-manager';
import path from 'path';
import fs from 'fs';

export const router = createPlaywrightRouter();

// Load config
const configPath = path.resolve('config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Initialize stats manager
const statsManager = new StatsManager();

const KEYWORDS_REGEX = new RegExp(config.keywords.join('|'), 'i');
const EXTENSIONS_REGEX = new RegExp(`\\.(${config.fileExtensions.join('|')})$`, 'i');

router.addDefaultHandler(async ({ page, enqueueLinks, log, request }) => {
    log.info(`Processing: ${request.url}`);
    
    try {
        // Title extraction for context
        const title = await page.title();
        // log.info(`Title: ${title}`);

        // 1. Look for targeted download links
        const extensionRegexStr = `\\.(${config.fileExtensions.join('|')})$`;

        const downloadLinks = await page.evaluate((regexStr) => {
            const regex = new RegExp(regexStr, 'i');
            const anchors = Array.from(document.querySelectorAll('a'));
            return anchors
                .map(a => ({ href: a.href, text: a.innerText }))
                // Filter by extension
                .filter(link => regex.test(link.href))
                .map(link => link.href);
        }, extensionRegexStr);

        if (downloadLinks.length > 0) {
            log.info(`Found ${downloadLinks.length} potential downloads.`);
            const downloadDir = path.resolve('downloads');

            for (const link of downloadLinks) {
                try {
                    const success = await downloadFile(link, downloadDir);
                    if (success) {
                        console.log(`Downloaded: ${link}`);
                        statsManager.incrementDownloaded();
                    } else {
                        statsManager.incrementErrors();
                    }
                } catch (error) {
                    log.error(`Failed to download ${link}:`, error);
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
