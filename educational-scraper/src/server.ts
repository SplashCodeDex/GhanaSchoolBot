
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { StatsManager } from './utils/stats-manager';
import { scanDirectory } from './utils/file-scanner';

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

// Initialize stats manager
const statsManager = new StatsManager();

// Update file count periodically
setInterval(() => {
    const downloadsDir = path.resolve(__dirname, '../downloads');
    statsManager.updateFileCount(downloadsDir);
}, 10000); // Every 10 seconds

// --- Endpoints ---

app.get('/api/files', (req, res) => {
    const downloadsDir = path.resolve(__dirname, '../downloads');
    const files = scanDirectory(downloadsDir);
    res.json(files);
});

app.get('/api/stats', (req, res) => {
    res.json(statsManager.getStats());
});

app.post('/api/start', (req, res) => {
    if (scraperProcess) {
        return res.status(400).json({ message: 'Scraper is already running' });
    }

    console.log("Starting scraper process...");

    // Update stats: scraper is starting
    statsManager.setRunning(true, config.maxConcurrency || 5);

    const scriptPath = path.resolve(__dirname, 'main.ts');

    // Spawn ts-node execution
    scraperProcess = spawn('npx', ['ts-node', scriptPath], {
        cwd: path.resolve(__dirname, '..'),
        shell: true, // Required for npx on Windows
        stdio: ['ignore', 'pipe', 'pipe']
    });

    if (scraperProcess.stdout) {
        scraperProcess.stdout.on('data', (data) => {
            const log = data.toString();
            const timestamp = new Date().toISOString();
            console.log(`[Scraper]: ${log}`);

            // Emit log with timestamp
            io.emit('log', { message: log, timestamp });

            // Track stats based on log patterns
            if (log.includes('Downloaded:') || log.includes('Saved file:')) {
                statsManager.incrementDownloaded();
            }
            if (log.includes('Error') || log.includes('Failed')) {
                statsManager.incrementErrors();
            }
        });
    }

    if (scraperProcess.stderr) {
        scraperProcess.stderr.on('data', (data) => {
            const log = data.toString();
            const timestamp = new Date().toISOString();
            console.error(`[Scraper Error]: ${log}`);
            io.emit('log', { message: `ERROR: ${log}`, timestamp });
            statsManager.incrementErrors();
        });
    }

    scraperProcess.on('close', (code) => {
        const timestamp = new Date().toISOString();
        console.log(`Scraper process exited with code ${code}`);
        io.emit('log', { message: `[System]: Scraper process exited with code ${code}`, timestamp });

        // Update stats: scraper stopped
        statsManager.setRunning(false);
        statsManager.setActiveThreads(0);

        io.emit('status', statsManager.getStats());
        scraperProcess = null;
    });

    io.emit('status', statsManager.getStats());
    res.json({ message: 'Scraper started' });
});

app.post('/api/stop', (req, res) => {
    if (!scraperProcess) {
        return res.status(400).json({ message: 'Scraper is not running' });
    }

    console.log("Stopping scraper process...");
    const killed = scraperProcess.kill('SIGINT'); // Try graceful shutdown first
    if (!killed) {
        // Force kill if needed (implementation detail: child_process.kill might not kill tree on Windows without tree-kill, but simple kill is a start)
        scraperProcess.kill();
    }

    // We'll let the 'close' event handler clean up the variable
    res.json({ message: 'Stop signal sent' });
});

// --- Socket.IO ---
io.on('connection', (socket) => {
    console.log('Frontend connected');
    socket.emit('status', statsManager.getStats());

    socket.on('disconnect', () => {
        console.log('Frontend disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server API running on http://localhost:${PORT}`);
});
