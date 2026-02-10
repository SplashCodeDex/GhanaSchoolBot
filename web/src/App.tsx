import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { StatCard } from './components/StatCard';
import { LogViewer } from './components/LogViewer';
import { ControlPanel } from './components/ControlPanel';
import { FileManager } from './components/FileManager';
import { FilePreviewModal } from './components/FilePreviewModal';

// Define the shape of our stats
interface BotStats {
  isRunning: boolean;
  fileCount: number;
  activeThreads: number;
  maxConcurrency: number;
  urlsProcessed: number;
  urlsFailed: number;
  totalDownloaded: number;
  totalErrors: number;
  startTime: string | null;
  lastActivity: string | null;
  downloadSpeed: number;
  successRate: number;
}

interface LogEntry {
  message: string;
  timestamp: string;
}

interface FileItem {
  name: string;
  path: string; // Relative path from downloads/
  size: number;
  date: string;
  type: 'file' | 'directory';
}

const API_URL = 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stats, setStats] = useState<BotStats>({ 
    isRunning: false, 
    fileCount: 0,
    activeThreads: 0,
    maxConcurrency: 5,
    urlsProcessed: 0,
    urlsFailed: 0,
    totalDownloaded: 0,
    totalErrors: 0,
    startTime: null,
    lastActivity: null,
    downloadSpeed: 0,
    successRate: 100
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);

  // Preview State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ url: string; name: string; type: string } | null>(null);

  useEffect(() => {
    // Connect to Socket.IO
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to backend');
      setConnected(true);
      fetchStats();
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from backend');
      setConnected(false);
    });

    newSocket.on('status', (data: BotStats) => {
      setStats(prev => ({ ...prev, ...data }));
    });

    newSocket.on('log', (logData: LogEntry | string) => {
      // Handle both old string format and new object format for backward compatibility
      const logEntry: LogEntry = typeof logData === 'string' 
        ? { message: logData, timestamp: new Date().toISOString() }
        : logData;
      setLogs(prev => [...prev.slice(-99), logEntry]); // Keep last 100 logs
    });

    // Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stats`);
      const data = await res.json();
      setStats(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const handleStart = async () => {
    try {
      await fetch(`${API_URL}/api/start`, { method: 'POST' });
    } catch (err) {
      console.error("Failed to start scraper", err);
    }
  };

  const handleStop = async () => {
    try {
      await fetch(`${API_URL}/api/stop`, { method: 'POST' });
    } catch (err) {
      console.error("Failed to stop scraper", err);
    }
  };

  const handlePreview = (file: FileItem) => {
    // Construct URL based on relative path
    // IMPORTANT: The backend serves static files at /files
    // We need to ensure the path is correctly encoded
    // Note: backend 'path' property is relative to downloads/ folder.

    // Fix backslashes if on windows (though URL usually handles forward slash)
    const cleanPath = file.path.replace(/\\/g, '/');
    const fileUrl = `${API_URL}/files/${cleanPath}`;

    setSelectedFile({
      url: fileUrl,
      name: file.name,
      type: 'unknown' // Modal handles type detection by extension for now
    });
    setPreviewOpen(true);
  };

  return (
    <div className="container">
      <header style={{ padding: '40px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '40px' }}>
        <h1 className="text-gradient" style={{ fontSize: '32px' }}>Ghana School Bot</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Educational Resource Scraper Dashboard <span style={{ fontSize: '12px', marginLeft: '10px', color: connected ? 'var(--success)' : 'var(--danger)' }}>{connected ? '● Online' : '● Offline'}</span>
        </p>
      </header>

      <div className="grid-dashboard">
        {/* Sidebar / Stats Column */}
        <aside>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <StatCard
              title="Files Downloaded"
              value={stats.totalDownloaded}
              trend={stats.fileCount > 0 ? `${stats.fileCount} files in storage` : undefined}
            />
            <StatCard
              title="Active Threads"
              value={`${stats.activeThreads}/${stats.maxConcurrency}`}
            />
            <StatCard
              title="URLs Processed"
              value={stats.urlsProcessed}
              trend={stats.urlsFailed > 0 ? `${stats.urlsFailed} failed` : undefined}
            />
            <StatCard
              title="Success Rate"
              value={`${Math.round(stats.successRate)}%`}
            />
            <StatCard
              title="Download Speed"
              value={stats.downloadSpeed > 0 ? `${stats.downloadSpeed.toFixed(1)}/min` : "0/min"}
            />
            <StatCard
              title="System Status"
              value={connected ? "Ready" : "Offline"}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main>
          <ControlPanel
            isRunning={stats.isRunning}
            onStart={handleStart}
            onStop={handleStop}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            <FileManager onPreview={handlePreview} />
            <LogViewer logs={logs} />
          </div>
        </main>
      </div>

      {/* Modals */}
      {selectedFile && (
        <FilePreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          fileUrl={selectedFile.url}
          fileName={selectedFile.name}
          fileType={selectedFile.type}
        />
      )}
    </div>
  );
}

export default App;
