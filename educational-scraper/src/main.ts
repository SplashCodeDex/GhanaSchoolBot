import { PlaywrightCrawler, ProxyConfiguration } from 'crawlee';
import { router } from './routes';
import fs from 'fs';
import path from 'path';
import { StatsManager } from './utils/stats-manager';

// Load config
const configPath = path.resolve('config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Initialize stats manager
const statsManager = new StatsManager();
const maxConcurrency = config.maxConcurrency || 5;

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
    maxConcurrency: maxConcurrency,

    // Increased retries for stability on slow sites
    maxRequestRetries: 3,
    navigationTimeoutSecs: 90,

    // Headless mode from config
    headless: config.headless !== undefined ? config.headless : true,
});

async function main() {
    console.log('Starting crawler with URLs from config:', config.startUrls);
    
    // Update stats: crawler started
    statsManager.setRunning(true, maxConcurrency);
    
    // Monitor crawler statistics
    setInterval(() => {
        const crawlerStats = crawler.stats;
        if (crawlerStats && crawlerStats.state) {
            // Calculate active requests from available stats
            // Active = Total - (Finished + Failed)
            const state = crawlerStats.state;
            const activeRequests = Math.max(0, 
                (state.requestsTotal || 0) - 
                (state.requestsFinished || 0) - 
                (state.requestsFailed || 0)
            );
            statsManager.setActiveThreads(activeRequests);
        }
    }, 2000);
    
    await crawler.run(config.startUrls);
    
    // Update stats: crawler finished
    statsManager.setRunning(false);
    statsManager.setActiveThreads(0);
    
    console.log('Crawler finished.');
}

main().catch(console.error);
