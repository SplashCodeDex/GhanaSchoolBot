import { createPlaywrightRouter } from 'crawlee';
import { downloadFile } from './utils/file-downloader';
import path from 'path';
import fs from 'fs';

export const router = createPlaywrightRouter();

// Load config
const configPath = path.resolve('config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const KEYWORDS_REGEX = new RegExp(config.keywords.join('|'), 'i');
const EXTENSIONS_REGEX = new RegExp(`\\.(${config.fileExtensions.join('|')})$`, 'i');

router.addDefaultHandler(async ({ page, enqueueLinks, log, request }) => {
    log.info(`Processing: ${request.url}`);

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
        // log.info(`Found ${downloadLinks.length} potential downloads.`);
        const downloadDir = path.resolve('downloads');

        for (const link of downloadLinks) {
            // Optional: Check if link URL matches keywords to reduce noise?
            // For now, downloading all found files on relevant pages is safer to ensure we don't miss anything.
            // But we can prioritize.

            await downloadFile(link, downloadDir);
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
});
