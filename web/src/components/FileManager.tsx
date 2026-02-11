import React, { useEffect, useState } from 'react';
import { Folder, File as FileIcon, Search, RefreshCcw, Brain, ChevronRight, ChevronDown } from 'lucide-react';
import type { AnalysisData } from '../hooks/useAnalysis';

interface FileItem {
    name: string;
    path: string; // Relative path from downloads/
    size: number;
    date: string;
    type: 'file' | 'directory';
    children?: FileItem[];
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const isPdf = (name: string) => name.toLowerCase().endsWith('.pdf');

interface FileTreeItemProps {
    item: FileItem;
    onPreview: (file: FileItem) => void;
    onAnalyze: (path: string) => void;
    isAnalyzing: boolean;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ item, onPreview, onAnalyze, isAnalyzing }) => {
    const isReviewQueue = item.name === 'Review_Needed';
    const [isOpen, setIsOpen] = useState(isReviewQueue); // Auto-expand review queue

    if (item.type === 'directory') {
        return (
            <div>
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="btn"
                    style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        background: isReviewQueue ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                        border: 'none',
                        padding: '6px 8px',
                        borderBottom: '1px solid var(--border-muted)',
                        borderRadius: 0,
                        borderLeft: isReviewQueue ? '3px solid var(--warning)' : '3px solid transparent'
                    }}
                >
                    <span style={{ marginRight: '4px' }}>
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <Folder size={16} style={{ marginRight: '8px', color: isReviewQueue ? 'var(--warning)' : 'var(--accent-secondary)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: isReviewQueue ? 'var(--warning)' : 'inherit' }}>
                        {item.name} {isReviewQueue && '(Action Required)'}
                    </span>
                </div>
                {isOpen && item.children && (
                    <div style={{ marginLeft: '12px', borderLeft: '1px solid var(--border-muted)' }}>
                        {item.children.map((child) => (
                            <FileTreeItem key={child.path} item={child} onPreview={onPreview} onAnalyze={onAnalyze} isAnalyzing={isAnalyzing} />
                        ))}
                        {item.children.length === 0 && <div style={{ padding: '8px 24px', fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '12px' }}>Empty</div>}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className="btn"
            style={{
                width: '100%',
                justifyContent: 'space-between',
                background: 'transparent',
                border: 'none',
                padding: '8px 12px',
                borderBottom: '1px solid var(--border-muted)',
                borderRadius: 0
            }}
        >
            <div
                onClick={() => onPreview(item)}
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1, overflow: 'hidden' }}
            >
                <FileIcon size={16} style={{ marginRight: '8px', color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px', flexShrink: 0 }}>
                {isPdf(item.name) && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAnalyze(item.path); }}
                        disabled={isAnalyzing}
                        title="AI Analyze"
                        className="btn"
                        style={{
                            padding: '2px 8px',
                            fontSize: '11px',
                            background: isAnalyzing ? 'var(--bg-surface-muted)' : 'rgba(16, 185, 129, 0.1)',
                            color: 'var(--success)',
                            borderColor: 'rgba(16, 185, 129, 0.2)'
                        }}
                    >
                        {isAnalyzing ? '...' : <><Brain size={12} /> Analyze</>}
                    </button>
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '50px', textAlign: 'right' }}>
                    {formatBytes(item.size)}
                </span>
            </div>
        </div>
    );
};

interface FileManagerProps {
    onPreview: (file: FileItem) => void;
    onAnalyze: (path: string) => void;
    isAnalyzing: boolean;
    analysisData: AnalysisData | null;
    analysisProgress: string;
    analysisError: string | null;
}

export const FileManager: React.FC<FileManagerProps> = ({
    onPreview,
    onAnalyze,
    isAnalyzing,
    analysisProgress,
    analysisError
}) => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/files');
            const data = await res.json();
            setFiles(data);
        } catch (err) {
            console.error("Failed to load files", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
        const interval = setInterval(fetchFiles, 30000);
        return () => clearInterval(interval);
    }, []);

    const filterFiles = (fileList: FileItem[]): FileItem[] => {
        if (!searchQuery) return fileList;
        return fileList.map(file => {
            if (file.name.toLowerCase().includes(searchQuery.toLowerCase())) return file;
            if (file.children) {
                const matchedChildren = filterFiles(file.children);
                if (matchedChildren.length > 0) return { ...file, children: matchedChildren };
            }
            return null;
        }).filter(Boolean) as FileItem[];
    };

    const filteredFiles = filterFiles(files);

    return (
        <div className="card" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-muted)' }}>
                {/* AI Analysis Progress Overlay */}
                {(isAnalyzing || analysisError) && (
                    <div style={{
                        marginBottom: '16px',
                        padding: '12px',
                        background: analysisError ? '#451a1a' : 'var(--bg-deep)',
                        border: `1px solid ${analysisError ? 'var(--danger)' : 'var(--accent-primary-muted)'}`,
                        borderRadius: 'var(--radius-sm)',
                        animation: isAnalyzing ? 'pulse 2s infinite' : 'none'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Brain size={14} className={analysisError ? 'text-danger' : 'text-accent-primary'} />
                                <span style={{ fontSize: '12px', fontWeight: 600, color: analysisError ? 'var(--danger)' : 'var(--text-primary)' }}>
                                    {analysisError ? 'Analysis Failed' : 'AI Processing...'}
                                </span>
                            </div>
                            {isAnalyzing && <RefreshCcw size={12} className="spin text-accent-primary" />}
                        </div>
                        <p style={{
                            margin: 0,
                            fontSize: '11px',
                            color: analysisError ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-secondary)',
                            lineHeight: '1.4'
                        }}>
                            {analysisError || analysisProgress || 'Starting Gemini analysis engine...'}
                        </p>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Folder size={18} className="text-muted" />
                        <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Resource Manager</h3>
                    </div>
                    <button onClick={fetchFiles} className="btn" style={{ padding: '6px' }} title="Refresh">
                        <RefreshCcw size={14} className={loading ? 'spin' : ''} />
                    </button>
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search educational resources..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px 8px 32px',
                            background: 'var(--bg-deep)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>

            <div className="area-scroll" style={{ flex: 1, minHeight: '300px' }}>
                {loading && files.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        Scanning local directory...
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        {searchQuery ? 'No matching files found.' : 'Storage is currently empty.'}
                    </div>
                ) : (
                    filteredFiles.map((item) => (
                        <FileTreeItem
                            key={item.path}
                            item={item}
                            onPreview={onPreview}
                            onAnalyze={onAnalyze}
                            isAnalyzing={isAnalyzing}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
