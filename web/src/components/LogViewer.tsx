import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, History } from 'lucide-react';

interface LogEntry {
    message: string;
    timestamp: string;
}

interface LogViewerProps {
    logs: LogEntry[];
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
    const terminalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    const formatTime = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch {
            return '--:--:--';
        }
    };

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TerminalIcon size={16} className="text-muted" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Live Process Logs</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <History size={14} className="text-muted" />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{logs.length} entries</span>
                </div>
            </div>
            <div className="terminal-simple area-scroll" ref={terminalRef} style={{ flex: 1, border: 'none', borderRadius: 0 }}>
                {logs.length === 0 && (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px' }}>
                        Waiting for process cycles...
                    </div>
                )}
                {logs.map((log, index) => {
                    const message = typeof log === 'string' ? log : log.message;
                    const timestamp = typeof log === 'string' ? new Date().toISOString() : log.timestamp;

                    let color = 'var(--text-primary)';
                    const msgLower = (message || '').toLowerCase();
                    if (msgLower.includes('error') || msgLower.includes('fail')) color = 'var(--danger)';
                    if (msgLower.includes('success') || msgLower.includes('done')) color = 'var(--success)';
                    if (msgLower.includes('warn')) color = 'var(--warning)';

                    return (
                        <div key={index} style={{
                            padding: '2px 12px',
                            fontSize: '12px',
                            lineHeight: '1.6',
                            borderLeft: `2px solid ${color === 'var(--text-primary)' ? 'transparent' : color}`,
                            marginBottom: '1px'
                        }}>
                            <span style={{ opacity: 0.4, marginRight: '12px', fontSize: '11px', fontVariantNumeric: 'tabular-nums' }}>
                                {formatTime(timestamp)}
                            </span>
                            <span style={{ color }}>{message}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
