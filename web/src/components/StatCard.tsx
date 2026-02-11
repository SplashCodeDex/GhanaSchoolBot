import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: string;
    highlight?: 'success' | 'warning' | 'danger' | 'info';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, highlight }) => {
    const getHighlightClass = () => {
        if (!highlight) return '';
        return `text-${highlight}`;
    };

    return (
        <div className="card stat-card">
            <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="card-title">{title}</span>
                {Icon && <Icon size={18} className={getHighlightClass()} style={{ color: highlight ? `var(--${highlight})` : 'var(--text-muted)' }} />}
            </div>
            <div className="card-value" style={{ color: highlight ? `var(--${highlight})` : 'var(--text-primary)' }}>
                {value}
            </div>
            {trend && (
                <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--text-muted)' }}>
                    {trend}
                </div>
            )}
        </div>
    );
};
