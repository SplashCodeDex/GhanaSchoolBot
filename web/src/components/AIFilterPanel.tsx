import React from 'react';
import {
    Activity,
    CheckCircle2,
    Target,
    Zap,
    Info,
    TrendingDown,
    BrainCircuit
} from 'lucide-react';

interface AIFilterStats {
    totalAnalyzed: number;
    approved: number;
    rejected: number;
    averageConfidence: number;
}

interface AIFilterPanelProps {
    totalFiltered: number;
    filterRate: number;
    aiFilterStats?: AIFilterStats;
}

export const AIFilterPanel: React.FC<AIFilterPanelProps> = ({
    totalFiltered,
    filterRate,
    aiFilterStats
}) => {
    const isActive = aiFilterStats && aiFilterStats.totalAnalyzed > 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card">
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <BrainCircuit size={20} className="text-accent-secondary" />
                            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>AI Intelligence Metrics</h2>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
                            Real-time performance of the pre-filtering engine.
                        </p>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${isActive ? 'var(--success-muted)' : 'var(--border-subtle)'}`,
                        color: isActive ? 'var(--success)' : 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: 600
                    }}>
                        <div className={`status-dot ${isActive ? 'status-online' : ''}`} style={{ width: '8px', height: '8px' }} />
                        {isActive ? 'ANALYSIS ACTIVE' : 'ENGINE STANDBY'}
                    </div>
                </div>

                {isActive && aiFilterStats ? (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                            <div className="card" style={{ background: 'var(--bg-deep)', padding: '16px', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <Activity size={14} className="text-accent-primary" />
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scope Analyzed</span>
                                </div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{aiFilterStats.totalAnalyzed}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Total resource links scanned</div>
                            </div>

                            <div className="card" style={{ background: 'var(--bg-deep)', padding: '16px', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <CheckCircle2 size={14} className="text-success" />
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ingested</span>
                                </div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success)' }}>{aiFilterStats.approved}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {((aiFilterStats.approved / aiFilterStats.totalAnalyzed) * 100).toFixed(1)}% conversion rate
                                </div>
                            </div>

                            <div className="card" style={{ background: 'var(--bg-deep)', padding: '16px', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <TrendingDown size={14} className="text-danger" />
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bandwidth Saved</span>
                                </div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--danger)' }}>{filterRate.toFixed(1)}%</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{totalFiltered} redundant files blocked</div>
                            </div>

                            <div className="card" style={{ background: 'var(--bg-deep)', padding: '16px', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <Target size={14} className="text-accent-secondary" />
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confidence Index</span>
                                </div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-secondary)' }}>{(aiFilterStats.averageConfidence * 100).toFixed(0)}%</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Aggregated reasoning score</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Zap size={14} className="text-accent-primary" />
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Filtering Efficiency Matrix</span>
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{filterRate.toFixed(1)}% Redundancy Shield</span>
                            </div>
                            <div style={{ height: '10px', background: 'var(--bg-deep)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${filterRate}%`,
                                    background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                                    borderRadius: 'var(--radius-full)'
                                }} />
                            </div>
                        </div>

                        <div style={{
                            padding: '16px',
                            background: 'var(--bg-surface-muted)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start'
                        }}>
                            <Info size={18} className="text-accent-primary" style={{ marginTop: '2px' }} />
                            <div style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                                {filterRate > 40 ? (
                                    <span>AI Engine is maintaining a <strong>High Precision</strong> posture. Scraper is skipping {filterRate.toFixed(0)}% of discovered links to prioritize high-value educational content.</span>
                                ) : filterRate > 20 ? (
                                    <span>Engine balance is <strong>Optimal</strong>. System is efficiently identifying and excluding non-topical resources while maintaining high recall.</span>
                                ) : (
                                    <span>Scraper is in <strong>Discovery Mode</strong>. Most discovered links are meeting minimum confidence thresholds for ingestion.</span>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 40px', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-subtle)' }}>
                        <BrainCircuit size={48} className="text-muted" style={{ marginBottom: '20px', opacity: 0.3 }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No Analysis Data</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                            The AI Pre-Filter is currently inactive or hasn't processed any links yet. Enable filtering in the Settings tab to start seeing performance metrics.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
