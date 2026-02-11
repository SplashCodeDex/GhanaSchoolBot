import React from 'react';
import { Play, Square, Activity } from 'lucide-react';

interface ControlPanelProps {
    isRunning: boolean;
    onStart: () => void;
    onStop: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ isRunning, onStart, onStop }) => {
    return (
        <div className="card" style={{ borderLeft: `4px solid ${isRunning ? 'var(--success)' : 'var(--border-subtle)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Activity size={18} className={isRunning ? 'text-success' : 'text-muted'} style={{ color: isRunning ? 'var(--success)' : 'var(--text-muted)' }} />
                        <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Scraper Engine</h2>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
                        {isRunning ? 'Actively collecting educational resources.' : 'Engine is currently on standby.'}
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`status-dot ${isRunning ? 'status-online' : ''}`} style={{ background: isRunning ? 'var(--success)' : 'var(--text-muted)' }}></span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: isRunning ? 'var(--success)' : 'var(--text-muted)' }}>
                            {isRunning ? 'RUNNING' : 'IDLE'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        {!isRunning ? (
                            <button className="btn btn-primary" onClick={onStart}>
                                <Play size={14} fill="currentColor" />
                                Start Engine
                            </button>
                        ) : (
                            <button className="btn btn-danger" onClick={onStop}>
                                <Square size={14} fill="currentColor" />
                                Stop Process
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
