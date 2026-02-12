import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Activity,
  Download,
  CheckCircle,
  AlertTriangle,
  Zap,
  Cpu,
  RefreshCcw,
  Target,
  Search
} from 'lucide-react';

import { StatCard } from './components/StatCard';
import { LogViewer } from './components/LogViewer';
import { ControlPanel } from './components/ControlPanel';
import { FileManager } from './components/FileManager';
import { FilePreviewModal } from './components/FilePreviewModal';
import { AIFilterPanel } from './components/AIFilterPanel';
import { AIConfigPanel } from './components/AIConfigPanel';
import { Sidebar } from './components/Sidebar';
import { LessonNoteGenerator } from './components/LessonNoteGenerator';
import { ExamBuilder } from './components/ExamBuilder';
import { ChatBot } from './components/ChatBot';
import { CurriculumExplorer } from './components/CurriculumExplorer';
import { useAnalysis } from './hooks/useAnalysis';

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
  totalFiltered: number;
  aiFilterStats?: {
    totalAnalyzed: number;
    approved: number;
    rejected: number;
    averageConfidence: number;
  };
  startTime: string | null;
  lastActivity: string | null;
  downloadSpeed: number;
  successRate: number;
  filterRate: number;
  isSyncing?: boolean;
  isSorting?: boolean;
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

type TabType = 'overview' | 'curriculum' | 'process' | 'resources' | 'settings' | 'lesson-notes' | 'exams' | 'chatbot';

function App() {
  const [, setSocket] = useState<Socket | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<BotStats>({
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
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);

  // Preview State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Analysis Hook
  const {
    data: analysisData,
    loading: isAnalyzing,
    progress: analysisProgress,
    error: analysisError,
    triggerAnalysis
  } = useAnalysis();

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stats`);
      const data = await res.json();
      setStats(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  useEffect(() => {
    // Connect to Socket.IO
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      fetchStats();
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('status', (data: BotStats) => {
      setStats(prev => ({ ...prev, ...data }));
    });

    newSocket.on('log', (logData: LogEntry | string) => {
      const logEntry: LogEntry = typeof logData === 'string'
        ? { message: logData, timestamp: new Date().toISOString() }
        : logData;
      setLogs(prev => [...prev.slice(-99), logEntry]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

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
    setSelectedFile(file);
    setPreviewOpen(true);
  };

  return (
    <div className={`dashboard-root ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        connected={connected}
        isRunning={stats.isRunning}
        onStart={handleStart}
        onStop={handleStop}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className="main-content">
        <header style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-surface)'
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
            {activeTab}
          </h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {(stats.isSyncing || stats.isSorting) && (
              <div style={{ display: 'flex', gap: '8px', padding: '4px 12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <RefreshCcw size={12} className="spin text-accent-primary" />
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  {stats.isSyncing && stats.isSorting ? 'INTELLIGENT SYNC...' : stats.isSyncing ? 'SYNCING...' : 'AI SORTING...'}
                </span>
              </div>
            )}
            <button className="btn" onClick={fetchStats} style={{ height: '32px', fontSize: '12px' }}>
              <RefreshCcw size={12} />
              SYNC STATS
            </button>
          </div>
        </header>

        <div className="content-area area-scroll">
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="grid-stats">
                <StatCard
                  title="Files Downloaded"
                  value={stats.totalDownloaded}
                  trend={`${stats.fileCount} total files`}
                  icon={Download}
                />
                <StatCard
                  title="Active Threads"
                  value={`${stats.activeThreads}/${stats.maxConcurrency}`}
                  highlight={stats.activeThreads > 0 ? 'success' : undefined}
                  icon={Cpu}
                />
                <StatCard
                  title="Success Rate"
                  value={`${Math.round(stats.successRate)}%`}
                  highlight={stats.successRate > 90 ? 'success' : 'warning'}
                  icon={CheckCircle}
                />
                <StatCard
                  title="Download Speed"
                  value={stats.downloadSpeed > 0 ? `${stats.downloadSpeed.toFixed(1)}/min` : "0/min"}
                  icon={Zap}
                />
              </div>

              <div className="grid-cols-2">
                <div className="card">
                  <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={16} />
                    AI Filtering Metrics
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                    <div>
                      <div className="card-title">Filter Rate</div>
                      <div className="card-value" style={{ fontSize: '20px' }}>{stats.filterRate.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="card-title">Avg Confidence</div>
                      <div className="card-value" style={{ fontSize: '20px' }}>
                        {stats.aiFilterStats?.averageConfidence ? `${(stats.aiFilterStats.averageConfidence * 100).toFixed(0)}%` : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="card-title">Total Analyzed</div>
                      <div className="card-value" style={{ fontSize: '20px' }}>{stats.aiFilterStats?.totalAnalyzed || 0}</div>
                    </div>
                    <div>
                      <div className="card-title">System Health</div>
                      <div className="card-value" style={{ fontSize: '20px', color: connected ? 'var(--success)' : 'var(--danger)' }}>
                        {connected ? "Optimal" : "Offline"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} />
                    Processing Health
                  </h3>
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>URLs Processed</span>
                      <span style={{ fontWeight: 600 }}>{stats.urlsProcessed}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>URLs Failed</span>
                      <span style={{ fontWeight: 600, color: stats.urlsFailed > 0 ? 'var(--danger)' : 'inherit' }}>{stats.urlsFailed}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Errors Logged</span>
                      <span style={{ fontWeight: 600, color: stats.totalErrors > 0 ? 'var(--danger)' : 'inherit' }}>{stats.totalErrors}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'curriculum' && (
            <CurriculumExplorer />
          )}

          {activeTab === 'process' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
              <div className="card">
                <ControlPanel
                  isRunning={stats.isRunning}
                  onStart={handleStart}
                  onStop={handleStop}
                />
              </div>
              <div style={{ flex: 1, minHeight: '400px' }}>
                <LogViewer logs={logs} />
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
              <FileManager
                onPreview={handlePreview}
                isAnalyzing={isAnalyzing}
                analysisData={analysisData}
                analysisProgress={analysisProgress}
                analysisError={analysisError}
                onAnalyze={triggerAnalysis}
              />
            </div>
          )}

          {activeTab === 'lesson-notes' && (
            <LessonNoteGenerator />
          )}

          {activeTab === 'exams' && (
            <ExamBuilder />
          )}

          {activeTab === 'chatbot' && (
            <ChatBot />
          )}

          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card">
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Search size={16} />
                  AI Pre-Filter Configuration
                </h3>
                <AIConfigPanel
                  isSyncing={!!stats.isSyncing}
                  isSorting={!!stats.isSorting}
                  onConfigUpdate={() => {
                    fetchStats();
                  }}
                />
              </div>

              <div className="card">
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <AlertTriangle size={16} />
                  Advanced Statistics
                </h3>
                <AIFilterPanel
                  totalFiltered={stats.totalFiltered}
                  filterRate={stats.filterRate}
                  aiFilterStats={stats.aiFilterStats}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {selectedFile && (
        <FilePreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          fileUrl={`${API_URL}/files/${selectedFile.path.replace(/\\/g, '/')}`}
          fileName={selectedFile.name}
          filePath={selectedFile.path}
          onAnalyze={triggerAnalysis}
          isAnalyzing={isAnalyzing}
          analysisData={analysisData}
          analysisProgress={analysisProgress}
          analysisError={analysisError}
        />
      )}
    </div>
  );
}

export default App;
