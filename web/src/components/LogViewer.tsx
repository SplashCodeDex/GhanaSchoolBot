import React, { useEffect, useRef } from 'react';

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
            return new Date(timestamp).toLocaleTimeString();
        } catch {
            return new Date().toLocaleTimeString();
        }
    };

    return (
        <div className="glass-panel" style={{ marginTop: '20px' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Live Terminal</h3>
                <span style={{ fontSize: '12px', color: 'var(--accent-primary)' }}>● Connected</span>
            </div>
            <div className="terminal" ref={terminalRef}>
                {logs.length === 0 && <div style={{ color: '#444', fontStyle: 'italic' }}>Waiting for logs...</div>}
                {logs.map((log, index) => {
                    const message = log.message || log;
                    const timestamp = log.timestamp || new Date().toISOString();
                    
                    let color = '#e0e0e0';
                    if (message.toLowerCase().includes('error')) color = 'var(--danger)';
                    if (message.toLowerCase().includes('success')) color = 'var(--success)';
                    if (message.toLowerCase().includes('warn')) color = '#ffcc00';

                    return (
                        <div key={index} className="log-entry" style={{ color }}>
                            <span style={{ opacity: 0.5, marginRight: '8px' }}>{formatTime(timestamp)}</span>
                            {message}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
