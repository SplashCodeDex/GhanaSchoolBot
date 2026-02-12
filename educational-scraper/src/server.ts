
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { StatsManager } from './utils/stats-manager';
import { scanDirectory } from './utils/file-scanner';
import { AIPdfAnalyzer } from './utils/ai-pdf-analyzer';
import { AIGeneratorService } from './utils/ai-generator-service';

const app = express();
const PORT = 3001;

// Load config to get allowed origins
const configPath = path.resolve(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Configure CORS based on environment
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? (config.allowedOrigins || ['http://localhost:5173'])
    : '*';

app.use(cors({
    origin: allowedOrigins
}));
app.use(express.json());

const server = http.createServer(app);
// Serve downloads folder as static files
const downloadsPath = path.resolve(__dirname, '../downloads');
console.log('Serving static files from:', downloadsPath);

// Use app.use to avoid route regex parsing issues completely
app.use('/files', (req, res, next) => {
    // Only handle GET/HEAD
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
    }

    try {
        // req.path in app.use is relative to the mount point (/files)
        const relativePath = decodeURIComponent(req.path);

        // Security check: ensure path is safe
        if (relativePath.includes('..')) {
            res.status(403).send('Forbidden');
            return;
        }

        const fullPath = path.join(downloadsPath, relativePath);
        console.log(`[DEBUG] Attempting to serve: ${fullPath}`);

        if (fs.existsSync(fullPath)) {
            const stat = fs.statSync(fullPath);
            if (stat.isFile()) {
                return res.sendFile(fullPath);
            }
        }

        console.log(`[ERROR] File not found: ${fullPath}`);
        res.status(404).send('File not found');
    } catch (error) {
        console.error('Error serving file:', error);
        res.status(500).send('Internal Server Error');
    }
});

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

let scraperProcess: ChildProcess | null = null;
let syncProcess: ChildProcess | null = null;
let sortProcess: ChildProcess | null = null;

// Helper to spawn background tasks
const spawnBackgroundTask = (scriptName: string, name: string, onDone: (code: number | null) => void) => {
    console.log(`Starting ${name} process...`);
    const scriptPath = path.resolve(__dirname, scriptName);

    const process = spawn('npx', ['ts-node', scriptPath], {
        cwd: path.resolve(__dirname, '..'),
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    if (process.stdout) {
        process.stdout.on('data', (data) => {
            const log = data.toString();
            const timestamp = new Date().toISOString();
            console.log(`[${name}]: ${log}`);
            io.emit('log', { message: `[${name}] ${log}`, timestamp });
        });
    }

    if (process.stderr) {
        process.stderr.on('data', (data) => {
            const log = data.toString();
            const timestamp = new Date().toISOString();
            console.error(`[${name} Error]: ${log}`);
            io.emit('log', { message: `[${name} ERROR] ${log}`, timestamp });
        });
    }

    process.on('close', (code) => {
        console.log(`${name} process exited with code ${code}`);
        io.emit('log', {
            message: `[System]: ${name} process exited with code ${code}`,
            timestamp: new Date().toISOString()
        });
        onDone(code);
    });

    return process;
};

// Initialize stats manager
const statsManager = new StatsManager();

// --- Endpoints ---

app.get('/api/files', (req, res) => {
    const downloadsDir = path.resolve(__dirname, '../downloads');
    const files = scanDirectory(downloadsDir);
    res.json(files);
});

app.get('/api/stats', (req, res) => {
    const stats = statsManager.getStats();
    res.json({
        ...stats,
        isSyncing: !!syncProcess,
        isSorting: !!sortProcess
    });
});

// Initialize AI PDF Analyzer
const pdfAnalyzer = new AIPdfAnalyzer(config.geminiApiKey, downloadsPath);

// Initialize AI Generator Service
const aiGenerator = new AIGeneratorService(config.geminiApiKey);

app.post('/api/ai/generate-lesson-note', async (req, res) => {
    try {
        const { subject, grade, strand, subStrand, additionalInstructions } = req.body;
        if (!subject || !grade || !strand || !subStrand) {
            return res.status(400).json({ error: 'Missing required curriculum parameters' });
        }

        const note = await aiGenerator.generateLessonNote({
            subject, grade, strand, subStrand, additionalInstructions
        });
        res.json({ note });
    } catch (error: any) {
        console.error('[API] Lesson note generation error:', error.message);
        res.status(500).json({ error: 'Failed to generate lesson note' });
    }
});

app.post('/api/ai/generate-exam', async (req, res) => {
    try {
        const { type, subject, grade, topics, numQuestions, includeTheory, includeObjectives, strand, subStrand } = req.body;
        if (!type || !subject || !grade || !topics || !numQuestions) {
            return res.status(400).json({ error: 'Missing required examination parameters' });
        }

        if (includeTheory === undefined && includeObjectives === undefined) {
            return res.status(400).json({ error: 'At least one question type (Theory or Objectives) must be specified' });
        }

        const result = await aiGenerator.generateExamination({
            type, subject, grade, topics, numQuestions,
            includeTheory: !!includeTheory,
            includeObjectives: !!includeObjectives,
            strand,
            subStrand
        });
        res.json(result);
    } catch (error: any) {
        console.error('[API] Examination generation error:', error.message);
        res.status(500).json({ error: 'Failed to generate examination' });
    }
});

app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // We'll use a direct call to the model for now, could be moved to AIGeneratorService
        const prompt = `You are an expert AI educational assistant for the Ghana School Bot platform.
        Your goal is to help teachers and students with curriculum questions, lesson planning, and understanding educational concepts.

        User Question: ${message}

        Provide a helpful, accurate, and concise response.`;

        const result = await aiGenerator['model'].generateContent(prompt);
        const response = await result.response;
        const text = response.text() || "I couldn't generate a response.";

        res.json({ response: text });
    } catch (error: any) {
        console.error('[API] Chat error:', error.message);
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});

app.post('/api/ai/save', async (req, res) => {
    try {
        const { filename, content, type } = req.body;
        if (!filename || !content || !type) {
            return res.status(400).json({ error: 'Missing save parameters' });
        }

        const saveDir = path.resolve(__dirname, `../generated/${type}`);
        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }

        const safeFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.md';
        const fullPath = path.join(saveDir, safeFilename);

        fs.writeFileSync(fullPath, content, 'utf8');
        res.json({ success: true, path: fullPath });
    } catch (error: any) {
        console.error('[API] Save error:', error.message);
        res.status(500).json({ error: 'Failed to save content' });
    }
});

app.post('/api/analyze', async (req, res) => {
    const { filePath } = req.body;

    if (!filePath) {
        return res.status(400).json({ error: 'filePath is required' });
    }

    // Resolve the full path relative to downloads folder
    const fullPath = path.join(downloadsPath, filePath);

    // Security: prevent directory traversal
    if (!fullPath.startsWith(downloadsPath)) {
        return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    try {
        const result = await pdfAnalyzer.analyze(fullPath, (msg) => {
            // Stream progress to all connected frontends
            io.emit('analysis-progress', { filePath, message: msg });
        });
        res.json(result);
    } catch (error: any) {
        console.error('[API] Analysis error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/start', (req, res) => {
    if (scraperProcess) {
        return res.status(400).json({ message: 'Scraper is already running' });
    }

    statsManager.setRunning(true, config.maxConcurrency || 5);

    scraperProcess = spawnBackgroundTask('main.ts', 'Scraper', (code) => {
        scraperProcess = null;
        statsManager.setRunning(false);
        statsManager.setActiveThreads(0);
        io.emit('status', statsManager.getStats());
    });

    // Scraper-specific log monitoring for stats
    scraperProcess.stdout?.on('data', (data) => {
        const log = data.toString();

        // Basic Download Stats
        if (log.includes('Downloaded:') || log.includes('Saved file:')) {
            statsManager.incrementDownloaded();
            io.emit('status', statsManager.getStats());
        }
        if (log.includes('Error') || log.includes('Failed')) {
            statsManager.incrementErrors();
            io.emit('status', statsManager.getStats());
        }

        // AI PRE-FILTER TELEMETRY BRIDGING
        // Pattern: ✅ AI Decision [85%]: http://...
        const aiMatch = log.match(/([✅❌]) AI Decision \[(\d+)%\]/);
        if (aiMatch) {
            const approved = aiMatch[1] === '✅';
            const confidence = parseInt(aiMatch[2]) / 100;
            statsManager.updateAIFilterStats(approved, confidence);

            if (!approved) {
                statsManager.incrementFiltered();
            }

            io.emit('status', statsManager.getStats());
        }
    });

    scraperProcess.stderr?.on('data', (data) => {
        statsManager.incrementErrors();
        io.emit('status', statsManager.getStats());
    });

    res.json({ message: 'Scraper started' });
});

app.post('/api/stop', (req, res) => {
    if (!scraperProcess) {
        return res.status(400).json({ message: 'Scraper is not running' });
    }

    console.log("Stopping scraper process tree...");

    // On Windows, a simple .kill() often leaves orphaned processes when using shell: true.
    // We use taskkill to ensuring the entire tree is terminated.
    if (process.platform === 'win32') {
        spawn('taskkill', ['/F', '/T', '/PID', scraperProcess.pid!.toString()]);
    } else {
        scraperProcess.kill('SIGINT');
    }

    scraperProcess = null;
    statsManager.setRunning(false);
    io.emit('status', statsManager.getStats());

    res.json({ message: 'Stop signal sent' });
});

// --- Phase 5: Sync & Sort Endpoints ---

app.post('/api/sync/drive', (req, res) => {
    if (syncProcess) return res.status(400).json({ message: 'Sync already in progress' });
    syncProcess = spawnBackgroundTask('sync-existing.ts', 'DriveSync', () => {
        syncProcess = null;
        io.emit('status', statsManager.getStats());
    });
    res.json({ message: 'Google Drive Sync started' });
});

app.post('/api/sync/sort', (req, res) => {
    if (sortProcess) return res.status(400).json({ message: 'Sorting already in progress' });
    sortProcess = spawnBackgroundTask('sync-intelligent.ts', 'AISorter', () => {
        sortProcess = null;
        io.emit('status', statsManager.getStats());
    });
    res.json({ message: 'AI Sorting started' });
});

// --- AI Config Endpoints ---

app.get('/api/config/ai-filter', (req, res) => {
    try {
        const configPath = path.resolve(__dirname, '../config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

        res.json({
            config: {
                enabled: config.aiPreFilter?.enabled || false,
                targetSubjects: config.aiPreFilter?.targetSubjects || [],
                targetGrades: config.aiPreFilter?.targetGrades || [],
                minConfidence: config.aiPreFilter?.minConfidence || 0.65,
                targetSites: config.startUrls || [],
                logDecisions: config.aiPreFilter?.logDecisions || false,
                enableCaching: config.aiPreFilter?.enableCaching !== false,
                googleDrive: config.googleDrive || { enabled: false, autoCleanup: false, folderId: '' }
            }
        });
    } catch (error: any) {
        console.error('[API] Error reading config:', error.message);
        res.status(500).json({ error: 'Failed to read configuration' });
    }
});

app.post('/api/config/ai-filter', (req, res) => {
    try {
        const {
            enabled, targetSubjects, targetGrades,
            minConfidence, targetSites, logDecisions,
            enableCaching, googleDrive
        } = req.body;

        // Read existing config
        const configPath = path.resolve(__dirname, '../config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

        // Update AI filter settings
        config.aiPreFilter = {
            enabled: enabled !== undefined ? enabled : (config.aiPreFilter?.enabled || false),
            targetSubjects: targetSubjects !== undefined ? targetSubjects : (config.aiPreFilter?.targetSubjects || []),
            targetGrades: targetGrades !== undefined ? targetGrades : (config.aiPreFilter?.targetGrades || []),
            minConfidence: minConfidence !== undefined ? minConfidence : (config.aiPreFilter?.minConfidence || 0.65),
            enableCaching: enableCaching !== undefined ? enableCaching : (config.aiPreFilter?.enableCaching !== false),
            logDecisions: logDecisions !== undefined ? logDecisions : (config.aiPreFilter?.logDecisions || false)
        };

        // Update Google Drive settings
        if (googleDrive !== undefined) {
            config.googleDrive = {
                ...config.googleDrive,
                ...googleDrive
            };
        }

        // Update start URLs if provided
        if (targetSites !== undefined) {
            config.startUrls = targetSites;
        }

        // Write back to config.json
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf-8');

        console.log('[API] Configuration updated successfully');

        // Notify all connected clients about config change
        io.emit('config-updated', { aiPreFilter: config.aiPreFilter, googleDrive: config.googleDrive });

        res.json({
            success: true,
            message: 'Configuration saved successfully',
            config: {
                aiPreFilter: config.aiPreFilter,
                googleDrive: config.googleDrive
            }
        });
    } catch (error: any) {
        console.error('[API] Error saving config:', error.message);
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

// --- Socket.IO ---
io.on('connection', (socket) => {
    console.log('Frontend connected');
    socket.emit('status', statsManager.getStats());

    socket.on('disconnect', () => {
        console.log('Frontend disconnected');
    });
});

export { app };

if (require.main === module) {
    // Update file count periodically
    setInterval(() => {
        const downloadsDir = path.resolve(__dirname, '../downloads');
        statsManager.updateFileCount(downloadsDir);
    }, 10000); // Every 10 seconds

    server.listen(PORT, () => {
        console.log(`Server API running on http://localhost:${PORT}`);
    });
}
