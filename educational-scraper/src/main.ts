import { PlaywrightCrawler, ProxyConfiguration } from 'crawlee';
import { router } from './routes';
import fs from 'fs';
import path from 'path';

// Load config
const configPath = path.resolve('config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Configure proxy if provided
let proxyConfiguration;
if (config.proxyUrls && config.proxyUrls.length > 0) {
    proxyConfiguration = new ProxyConfiguration({
        proxyUrls: config.proxyUrls,
    });
}

// Create an instance of the PlaywrightCrawler class.
const crawler = new PlaywrightCrawler({
    requestHandler: router,
    proxyConfiguration,

    // Concurrency settings
    maxConcurrency: 5,

    // Increased retries for stability on slow sites
    maxRequestRetries: 3,
    navigationTimeoutSecs: 90,

    // Headless mode from config
    headless: config.headless !== undefined ? config.headless : true,
});

async function main() {
    console.log('Starting crawler with URLs from config:', config.startUrls);
    await crawler.run(config.startUrls);
    console.log('Crawler finished.');
}

main().catch(console.error);
