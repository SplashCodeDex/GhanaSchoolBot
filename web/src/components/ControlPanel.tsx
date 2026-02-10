import React from 'react';

interface ControlPanelProps {
    isRunning: boolean;
    onStart: () => void;
    onStop: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ isRunning, onStart, onStop }) => {
    return (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>Control Center</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Manage the educational resource scraper process.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            height: '10px',
                            width: '10px',
                            borderRadius: '50%',
                            background: isRunning ? 'var(--success)' : '#555',
                            boxShadow: isRunning ? '0 0 10px var(--success)' : 'none'
                        }}></span>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: isRunning ? 'var(--success)' : 'var(--text-secondary)' }}>
                            {isRunning ? 'RUNNING' : 'IDLE'}
                        </span>
                    </div>

                    {!isRunning ? (
                        <button className="btn btn-primary" onClick={onStart}>
                            Bot Start
                        </button>
                    ) : (
                        <button className="btn btn-danger" onClick={onStop}>
                            Stop Process
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
