import React, { useState, useEffect } from 'react';
import {
    X,
    Download,
    FileText,
    Image as ImageIcon,
    File as FileIcon,
    Brain,
    AlertCircle,
    Loader2,
    BookOpen,
    GraduationCap,
    Hash,
    Calendar,
    Table as TableIcon,
    RefreshCcw
} from 'lucide-react';
import type { AnalysisData } from '../hooks/useAnalysis';

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileUrl: string;
    fileName: string;
    filePath: string;
    onAnalyze: (path: string) => void;
    isAnalyzing: boolean;
    analysisData: AnalysisData | null;
    analysisProgress: string;
    analysisError: string | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
    isOpen,
    onClose,
    fileUrl,
    fileName,
    filePath,
    onAnalyze,
    isAnalyzing,
    analysisData,
    analysisProgress,
    analysisError
}) => {
    const [content, setContent] = useState<string | null>(null);
    const [loadingContent, setLoadingContent] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const getExtension = (name: string) => name.split('.').pop()?.toLowerCase() || '';
    const ext = getExtension(fileName);

    const isImage = (ext: string) => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
    const isPDF = (ext: string) => ext === 'pdf';
    const isText = (ext: string) => ['txt', 'md', 'json', 'log', 'js', 'ts', 'tsx', 'html', 'css', 'py'].includes(ext);

    useEffect(() => {
        if (isOpen && isText(ext)) {
            fetchContent();
        } else {
            setContent(null);
            setLoadError(null);
        }
    }, [isOpen, fileUrl, ext]);

    const fetchContent = async () => {
        setLoadingContent(true);
        setLoadError(null);
        try {
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error('Failed to load file content');
            const term = await response.text();
            setContent(term);
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoadingContent(false);
        }
    };

    if (!isOpen) return null;

    const renderPreview = () => {
        if (isImage(ext)) {
            return (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <img src={fileUrl} alt={fileName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
            );
        }

        if (isPDF(ext)) {
            return (
                <div style={{ flex: 1, background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <iframe
                        src={`${fileUrl}#toolbar=0`}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title={fileName}
                    />
                </div>
            );
        }

        if (isText(ext)) {
            if (loadingContent) return (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <Loader2 size={32} className="spin" style={{ marginBottom: '12px' }} />
                    <span style={{ fontSize: '13px' }}>Streaming file content...</span>
                </div>
            );
            if (loadError) return (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', gap: '12px' }}>
                    <AlertCircle size={32} />
                    <span style={{ fontSize: '13px' }}>{loadError}</span>
                </div>
            );
            return (
                <div className="terminal-simple area-scroll" style={{ flex: 1, margin: 0, padding: '20px', fontSize: '12px', border: '1px solid var(--border-subtle)' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{content}</pre>
                </div>
            );
        }

        return (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', textAlign: 'center', padding: '40px' }}>
                <FileIcon size={48} className="text-muted" style={{ marginBottom: '20px', opacity: 0.3 }} />
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Preview Unavailable</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                    Direct preview is not supported for .{ext} files.
                </p>
                <a href={fileUrl} download className="btn btn-primary" style={{ padding: '10px 24px' }}>
                    <Download size={16} />
                    Download File
                </a>
            </div>
        );
    };

    const renderAnalysis = () => {
        if (isAnalyzing) {
            return (
                <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                        <Loader2 size={60} className="spin text-accent-primary" style={{ position: 'absolute', top: 0, left: 0 }} />
                        <Brain size={30} className="text-accent-secondary" style={{ position: 'absolute', top: '15px', left: '15px' }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>AI Document Studio</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{analysisProgress || 'Extracting intelligence...'}</div>
                    </div>
                </div>
            );
        }

        if (analysisError) {
            return (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--danger)', marginBottom: '16px' }}>
                        <AlertCircle size={40} style={{ margin: '0 auto 12px' }} />
                        <p style={{ fontSize: '13px', fontWeight: 500 }}>{analysisError}</p>
                    </div>
                    <button onClick={() => onAnalyze(filePath)} className="btn btn-primary" style={{ width: '100%' }}>
                        <RefreshCcw size={14} />
                        Retry Analysis
                    </button>
                </div>
            );
        }

        if (analysisData) {
            return (
                <div className="area-scroll" style={{ padding: '24px', height: '100%' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(79, 70, 229, 0.1)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-full)', color: 'var(--accent-primary)', fontSize: '11px', fontWeight: 600 }}>
                            <GraduationCap size={12} /> {analysisData.gradeLevel}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: 'var(--radius-full)', color: 'var(--success)', fontSize: '11px', fontWeight: 600 }}>
                            <BookOpen size={12} /> {analysisData.subject}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'var(--bg-surface-muted)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600 }}>
                            <Hash size={12} /> {analysisData.pageCount} Pages
                        </div>
                    </div>

                    <section style={{ marginBottom: '24px' }}>
                        <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '12px' }}>Knowledge Summary</h4>
                        <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>{analysisData.summary}</p>
                    </section>

                    {analysisData.topics.length > 0 && (
                        <section style={{ marginBottom: '24px' }}>
                            <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '12px' }}>Topic Model</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {analysisData.topics.map((topic, i) => (
                                    <span key={i} style={{ padding: '4px 8px', background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '11px', color: 'var(--text-primary)' }}>{topic}</span>
                                ))}
                            </div>
                        </section>
                    )}

                    {analysisData.tables.length > 0 && (
                        <section>
                            <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '12px' }}>Structured Entities ({analysisData.tables.length})</h4>
                            {analysisData.tables.map((table, i) => (
                                <div key={i} style={{ marginBottom: '16px', border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
                                    <div style={{ padding: '8px 12px', background: 'var(--bg-surface-muted)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <TableIcon size={12} className="text-muted" />
                                        <span style={{ fontSize: '11px', fontWeight: 600 }}>{table.title}</span>
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                    {table.headers.map((h, j) => <th key={j} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {table.rows.map((row, j) => (
                                                    <tr key={j}>
                                                        {row.map((cell, k) => <td key={k} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-muted)', color: 'var(--text-secondary)' }}>{cell}</td>)}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </section>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                        <Calendar size={10} />
                        Analyzed on {new Date(analysisData.analyzedAt).toLocaleDateString()} at {new Date(analysisData.analyzedAt).toLocaleTimeString()}
                    </div>
                </div>
            );
        }

        return (
            <div style={{ padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Brain size={48} className="text-muted" style={{ marginBottom: '24px', opacity: 0.2 }} />
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>AI Document Analysis</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: '280px', margin: '0 auto 24px' }}>
                    Extract structured data, summaries, and key educational topics using advanced AI.
                </p>
                {isPDF(ext) ? (
                    <button onClick={() => onAnalyze(filePath)} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                        <Brain size={16} />
                        Initialize Studio
                    </button>
                ) : (
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start', textAlign: 'left' }}>
                        <AlertCircle size={14} className="text-danger" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', color: 'var(--danger)' }}>Analysis is currently optimized for PDF documents.</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
        }} onClick={onClose}>
            <div style={{
                width: '100%',
                height: '90vh',
                maxWidth: '1400px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 32px 64px rgba(0, 0, 0, 0.5)',
            }} onClick={e => e.stopPropagation()}>

                <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--bg-deep)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isImage(ext) ? <ImageIcon size={20} className="text-accent-secondary" /> : isPDF(ext) ? <FileText size={20} className="text-danger" /> : <FileIcon size={20} className="text-muted" />}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{fileName}</h3>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{ext} Resource</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <a href={fileUrl} download className="btn" style={{ padding: '8px 12px' }} title="Download">
                            <Download size={16} />
                            Download
                        </a>
                        <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 4px' }} />
                        <button className="btn" style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }} onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', background: 'var(--bg-deep)' }}>
                        {renderPreview()}
                    </div>

                    {(analysisData || isAnalyzing || analysisError || isPDF(ext)) && (
                        <div style={{ width: '400px', borderLeft: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Brain size={14} className="text-accent-primary" />
                                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Document Studio</span>
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                {renderAnalysis()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
