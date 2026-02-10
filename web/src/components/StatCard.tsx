import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend }) => {
    return (
        <div className="glass-card stat-card">
            <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</h3>
                {icon && <span className="stat-icon" style={{ color: 'var(--accent-primary)' }}>{icon}</span>}
            </div>
            <div className="stat-value" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {value}
            </div>
            {trend && (
                <div className="stat-trend" style={{ fontSize: '12px', marginTop: '8px', color: 'var(--success)' }}>
                    {trend}
                </div>
            )}
        </div>
    );
};
