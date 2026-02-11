import fs from 'fs';
import path from 'path';

/**
 * Real-time statistics manager for the educational scraper
 * Tracks actual metrics instead of using placeholders
 */
export interface ScraperStats {
    isRunning: boolean;
    fileCount: number;
    activeThreads: number;
    maxConcurrency: number;
    urlsProcessed: number;
    urlsFailed: number;
    totalDownloaded: number;
    totalErrors: number;
    totalFiltered: number; // NEW: Files filtered out by AI
    aiFilterStats?: { // NEW: Detailed AI filtering stats
        totalAnalyzed: number;
        approved: number;
        rejected: number;
        averageConfidence: number;
    };
    startTime: Date | null;
    lastActivity: Date | null;
    downloadSpeed: number; // files per minute
    successRate: number; // percentage
    filterRate: number; // NEW: percentage of files filtered out
}

export class StatsManager {
    private statsFilePath: string;
    private stats: ScraperStats;

    constructor(statsFilePath?: string) {
        this.statsFilePath = statsFilePath || path.resolve(__dirname, '../../stats.json');
        this.stats = this.loadStats();
    }

    /**
     * Load stats from file or initialize with defaults
     */
    private loadStats(): ScraperStats {
        try {
            if (fs.existsSync(this.statsFilePath)) {
                const data = fs.readFileSync(this.statsFilePath, 'utf-8');
                const parsed = JSON.parse(data);
                // Convert date strings back to Date objects
                if (parsed.startTime) parsed.startTime = new Date(parsed.startTime);
                if (parsed.lastActivity) parsed.lastActivity = new Date(parsed.lastActivity);
                return parsed;
            }
        } catch (error) {
            console.error('[StatsManager] Error loading stats:', error);
        }

        // Return default stats
        return {
            isRunning: false,
            fileCount: 0,
            activeThreads: 0,
            maxConcurrency: 5,
            urlsProcessed: 0,
            urlsFailed: 0,
            totalDownloaded: 0,
            totalErrors: 0,
            totalFiltered: 0,
            aiFilterStats: {
                totalAnalyzed: 0,
                approved: 0,
                rejected: 0,
                averageConfidence: 0
            },
            startTime: null,
            lastActivity: null,
            downloadSpeed: 0,
            successRate: 100,
            filterRate: 0
        };
    }

    /**
     * Save stats to file
     */
    private saveStats(): void {
        try {
            fs.writeFileSync(this.statsFilePath, JSON.stringify(this.stats, null, 2));
        } catch (error) {
            console.error('[StatsManager] Error saving stats:', error);
        }
    }

    /**
     * Get current stats
     */
    getStats(): ScraperStats {
        // Recalculate derived metrics
        if (this.stats.urlsProcessed > 0) {
            this.stats.successRate = ((this.stats.urlsProcessed - this.stats.urlsFailed) / this.stats.urlsProcessed) * 100;
        }

        // Calculate download speed (files per minute)
        if (this.stats.startTime && this.stats.totalDownloaded > 0) {
            const elapsedMinutes = (Date.now() - this.stats.startTime.getTime()) / 60000;
            this.stats.downloadSpeed = elapsedMinutes > 0 ? this.stats.totalDownloaded / elapsedMinutes : 0;
        }

        // Calculate filter rate
        const totalAnalyzed = this.stats.aiFilterStats?.totalAnalyzed || 0;
        if (totalAnalyzed > 0) {
            this.stats.filterRate = (this.stats.totalFiltered / totalAnalyzed) * 100;
        } else {
            this.stats.filterRate = 0;
        }

        return { ...this.stats };
    }

    /**
     * Update scraper running status
     */
    setRunning(isRunning: boolean, maxConcurrency?: number): void {
        this.stats.isRunning = isRunning;
        if (maxConcurrency !== undefined) {
            this.stats.maxConcurrency = maxConcurrency;
        }
        if (isRunning) {
            this.stats.startTime = new Date();
        }
        this.stats.lastActivity = new Date();
        this.saveStats();
    }

    /**
     * Update active threads count
     */
    setActiveThreads(count: number): void {
        this.stats.activeThreads = count;
        this.stats.lastActivity = new Date();
        this.saveStats();
    }

    /**
     * Increment URL processed counter
     */
    incrementUrlsProcessed(success: boolean = true): void {
        this.stats.urlsProcessed++;
        if (!success) {
            this.stats.urlsFailed++;
        }
        this.stats.lastActivity = new Date();
        this.saveStats();
    }

    /**
     * Increment downloaded files counter
     */
    incrementDownloaded(): void {
        this.stats.totalDownloaded++;
        this.stats.lastActivity = new Date();
        this.saveStats();
    }

    /**
     * Increment error counter
     */
    incrementErrors(): void {
        this.stats.totalErrors++;
        this.stats.lastActivity = new Date();
        this.saveStats();
    }

    /**
     * Update file count from filesystem
     */
    updateFileCount(downloadsDir: string): void {
        try {
            let count = 0;
            const countFiles = (dir: string) => {
                if (!fs.existsSync(dir)) return;
                const items = fs.readdirSync(dir, { withFileTypes: true });
                for (const item of items) {
                    if (item.isDirectory()) {
                        countFiles(path.join(dir, item.name));
                    } else {
                        count++;
                    }
                }
            };
            countFiles(downloadsDir);
            this.stats.fileCount = count;
            this.saveStats();
        } catch (error) {
            console.error('[StatsManager] Error counting files:', error);
        }
    }

    /**
     * Increment filtered files counter (AI rejected)
     */
    incrementFiltered(): void {
        this.stats.totalFiltered++;
        this.stats.lastActivity = new Date();
        this.saveStats();
    }

    /**
     * Update AI filter statistics
     */
    updateAIFilterStats(approved: boolean, confidence: number): void {
        if (!this.stats.aiFilterStats) {
            this.stats.aiFilterStats = {
                totalAnalyzed: 0,
                approved: 0,
                rejected: 0,
                averageConfidence: 0
            };
        }

        this.stats.aiFilterStats.totalAnalyzed++;
        if (approved) {
            this.stats.aiFilterStats.approved++;
        } else {
            this.stats.aiFilterStats.rejected++;
        }

        // Update running average confidence
        const prevTotal = this.stats.aiFilterStats.totalAnalyzed - 1;
        const prevAvg = this.stats.aiFilterStats.averageConfidence;
        this.stats.aiFilterStats.averageConfidence = 
            (prevAvg * prevTotal + confidence) / this.stats.aiFilterStats.totalAnalyzed;

        this.stats.lastActivity = new Date();
        this.saveStats();
    }

    /**
     * Reset stats (useful for fresh start)
     */
    reset(): void {
        this.stats = {
            isRunning: false,
            fileCount: 0,
            activeThreads: 0,
            maxConcurrency: 5,
            urlsProcessed: 0,
            urlsFailed: 0,
            totalDownloaded: 0,
            totalErrors: 0,
            totalFiltered: 0,
            aiFilterStats: {
                totalAnalyzed: 0,
                approved: 0,
                rejected: 0,
                averageConfidence: 0
            },
            startTime: null,
            lastActivity: null,
            downloadSpeed: 0,
            successRate: 100,
            filterRate: 0
        };
        this.saveStats();
    }
}
