import { PlaywrightCrawler } from 'crawlee';
import { router } from './routes';
import fs from 'fs';
import path from 'path';

// Load config
const configPath = path.resolve('config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Create an instance of the PlaywrightCrawler class.
const crawler = new PlaywrightCrawler({
    // Store data in memory for now (or use default storage)
    // requestHandler: router,
    requestHandler: router,

    // Concurrency settings
    maxConcurrency: 5,

    // Headless mode (set to false if you want to see the browser)
    headless: true,
});

async function main() {
    console.log('Starting crawler with URLs from config:', config.startUrls);
    await crawler.run(config.startUrls);
    console.log('Crawler finished.');
}

main().catch(console.error);
