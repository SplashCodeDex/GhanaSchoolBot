import React, { useState, useEffect } from 'react';
import {
    Settings,
    Globe,
    Book,
    GraduationCap,
    Sliders,
    Save,
    Plus,
    ChevronDown,
    ChevronRight,
    Info,
    CheckCircle2,
    XCircle,
    RefreshCcw,
    Cloud,
    HardDrive,
    Wrench
} from 'lucide-react';

interface AIConfigPanelProps {
    onConfigUpdate?: (config: AIFilterConfig) => void;
    isSyncing: boolean;
    isSorting: boolean;
}

interface AIFilterConfig {
    enabled: boolean;
    targetSubjects: string[];
    targetGrades: string[];
    minConfidence: number;
    targetSites: string[];
    logDecisions: boolean;
    enableCaching: boolean;
    googleDrive: {
        enabled: boolean;
        autoCleanup: boolean;
        folderId: string;
    };
}

const AVAILABLE_SUBJECTS = [
    // JHS Subjects
    'Mathematics', 'English Language', 'Science', 'Social Studies',
    'Computing', 'ICT', 'Creative Arts', 'Design', 'French',
    'Ghanaian Language', 'Physical Education', 'Health Education',
    'Religious Education', 'Moral Education', 'Career Technology',
    // SHS Subjects
    'Physics', 'Chemistry', 'Biology', 'Integrated Science',
    'Economics', 'Geography', 'History', 'Government', 'Literature',
    'Business Management', 'Financial Accounting', 'Cost Accounting',
    'Food and Nutrition', 'Clothing and Textiles', 'Management in Living',
    'Graphic Design', 'Picture Making', 'Sculpture', 'Ceramics',
    'Music', 'Applied Electricity', 'Electronics', 'Auto Mechanics',
    'Building Construction', 'Metalwork', 'Woodwork', 'Technical Drawing',
    'Leatherwork', 'Textiles', 'Robotics', 'Engineering'
];

const AVAILABLE_GRADES = [
    { value: 'JHS1', label: 'JHS 1 (Basic 7)' },
    { value: 'JHS2', label: 'JHS 2 (Basic 8)' },
    { value: 'JHS3', label: 'JHS 3 (Basic 9)' },
    { value: 'BECE', label: 'BECE (Exam)' },
    { value: 'SHS1', label: 'SHS 1 (Form 1)' },
    { value: 'SHS2', label: 'SHS 2 (Form 2)' },
    { value: 'SHS3', label: 'SHS 3 (Form 3)' },
    { value: 'WASSCE', label: 'WASSCE (Exam)' }
];

const DEFAULT_SITES = [
    'https://mingycomputersgh.wordpress.com',
    'https://syllabusgh.com/',
    'https://nacca.gov.gh',
    'https://curriculumresources.edu.gh',
    'https://passco.com.gh',
    'https://ghlearner.com'
];

export const AIConfigPanel: React.FC<AIConfigPanelProps> = ({ onConfigUpdate, isSyncing, isSorting }) => {
    const [config, setConfig] = useState<AIFilterConfig>({
        enabled: true,
        targetSubjects: [],
        targetGrades: [],
        minConfidence: 0.65,
        targetSites: DEFAULT_SITES,
        logDecisions: true,
        enableCaching: true,
        googleDrive: {
            enabled: false,
            autoCleanup: false,
            folderId: ''
        }
    });

    // We use props for global state tracking, but keep internal error handling

    const [customSite, setCustomSite] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });

    useEffect(() => {
        fetch('http://localhost:3001/api/config/ai-filter')
            .then(res => res.json())
            .then(data => {
                if (data.config) {
                    setConfig(prev => ({ ...prev, ...data.config }));
                }
            })
            .catch(err => console.error('Failed to load config:', err));
    }, []);

    const handleSaveConfig = async () => {
        setIsSaving(true);
        setSaveMessage({ text: '', type: null });

        try {
            const response = await fetch('http://localhost:3001/api/config/ai-filter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                setSaveMessage({ text: 'Configuration saved successfully', type: 'success' });
                onConfigUpdate?.(config);
            } else {
                setSaveMessage({ text: 'Failed to save configuration', type: 'error' });
            }
        } catch (error) {
            setSaveMessage({ text: 'Error: ' + (error as Error).message, type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage({ text: '', type: null }), 3000);
        }
    };

    const toggleSubject = (subject: string) => {
        setConfig(prev => ({
            ...prev,
            targetSubjects: prev.targetSubjects.includes(subject)
                ? prev.targetSubjects.filter(s => s !== subject)
                : [...prev.targetSubjects, subject]
        }));
    };

    const toggleGrade = (grade: string) => {
        setConfig(prev => ({
            ...prev,
            targetGrades: prev.targetGrades.includes(grade)
                ? prev.targetGrades.filter(g => g !== grade)
                : [...prev.targetGrades, grade]
        }));
    };

    const addCustomSite = () => {
        if (customSite.trim() && !config.targetSites.includes(customSite.trim())) {
            setConfig(prev => ({
                ...prev,
                targetSites: [...prev.targetSites, customSite.trim()]
            }));
            setCustomSite('');
        }
    };

    const removeSite = (site: string) => {
        setConfig(prev => ({
            ...prev,
            targetSites: prev.targetSites.filter(s => s !== site)
        }));
    };

    const selectAllSubjects = () => setConfig(prev => ({ ...prev, targetSubjects: [...AVAILABLE_SUBJECTS] }));
    const clearAllSubjects = () => setConfig(prev => ({ ...prev, targetSubjects: [] }));
    const selectAllGrades = () => setConfig(prev => ({ ...prev, targetGrades: AVAILABLE_GRADES.map(g => g.value) }));
    const clearAllGrades = () => setConfig(prev => ({ ...prev, targetGrades: [] }));

    const triggerSync = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/sync/drive', { method: 'POST' });
            const data = await res.json();
            setSaveMessage({ text: data.message, type: 'success' });
        } catch (err) {
            setSaveMessage({ text: 'Sync failed: ' + (err as Error).message, type: 'error' });
        } finally {
            setTimeout(() => setSaveMessage({ text: '', type: null }), 3000);
        }
    };

    const triggerSort = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/sync/sort', { method: 'POST' });
            const data = await res.json();
            setSaveMessage({ text: data.message, type: 'success' });
        } catch (err) {
            setSaveMessage({ text: 'Sorting failed: ' + (err as Error).message, type: 'error' });
        } finally {
            setTimeout(() => setSaveMessage({ text: '', type: null }), 3000);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card">
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <Settings size={20} className="text-accent-primary" />
                            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Filter Control Center</h2>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
                            Intelligent scanning policies for educational resources.
                        </p>
                    </div>
                    <button
                        onClick={handleSaveConfig}
                        disabled={isSaving}
                        className="btn btn-primary"
                        style={{ padding: '8px 16px' }}
                    >
                        {isSaving ? <RefreshCcw size={16} className="spin" /> : <Save size={16} />}
                        {isSaving ? 'Saving...' : 'Apply Changes'}
                    </button>
                </div>

                {saveMessage.type && (
                    <div style={{
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-sm)',
                        background: saveMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${saveMessage.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
                        color: saveMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '20px'
                    }}>
                        {saveMessage.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        {saveMessage.text}
                    </div>
                )}

                <div style={{ padding: '16px', background: 'var(--bg-surface-muted)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <div className={`status-dot ${config.enabled ? 'status-online' : ''}`} style={{ width: '12px', height: '12px' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>AI Pre-Filtering Analysis</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {config.enabled ? 'Active: Saving bandwidth by scanning links before download.' : 'Inactive: Downloading all discovered files.'}
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                    </label>
                </div>

                {config.enabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {/* Target Sites */}
                        <section>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <Globe size={16} className="text-muted" />
                                <h3 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Domain Scopes</h3>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <input
                                    type="url"
                                    placeholder="Enter scraping target (e.g. https://nacca.gov.gh)"
                                    value={customSite}
                                    onChange={(e) => setCustomSite(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addCustomSite()}
                                    style={{
                                        flex: 1,
                                        padding: '10px 14px',
                                        background: 'var(--bg-deep)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--text-primary)',
                                        fontSize: '13px'
                                    }}
                                />
                                <button
                                    onClick={addCustomSite}
                                    disabled={!customSite.trim()}
                                    className="btn btn-primary"
                                    style={{ padding: '0 16px' }}
                                >
                                    <Plus size={16} />
                                    Scope
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {config.targetSites.map((site, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '6px 12px',
                                            background: 'var(--bg-deep)',
                                            border: '1px solid var(--border-subtle)',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: '12px'
                                        }}
                                    >
                                        <span style={{ color: 'var(--text-secondary)' }}>{site}</span>
                                        <button
                                            onClick={() => removeSite(site)}
                                            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--danger)', cursor: 'pointer', display: 'flex' }}
                                        >
                                            <XCircle size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '32px' }}>
                            {/* Target Subjects */}
                            <section>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Book size={16} className="text-muted" />
                                        <h3 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subject Matrix</h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={selectAllSubjects} style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>All</button>
                                        <button onClick={clearAllSubjects} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>None</button>
                                    </div>
                                </div>
                                <div className="area-scroll" style={{
                                    maxHeight: '300px',
                                    padding: '12px',
                                    background: 'var(--bg-deep)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px'
                                }}>
                                    {AVAILABLE_SUBJECTS.sort().map(subject => (
                                        <label
                                            key={subject}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '8px 12px',
                                                borderRadius: 'var(--radius-sm)',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                transition: 'background 0.2s',
                                                background: config.targetSubjects.includes(subject) ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                                                color: config.targetSubjects.includes(subject) ? 'var(--accent-primary)' : 'var(--text-secondary)'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={config.targetSubjects.includes(subject)}
                                                onChange={() => toggleSubject(subject)}
                                                style={{ width: '16px', height: '16px' }}
                                            />
                                            {subject}
                                        </label>
                                    ))}
                                </div>
                            </section>

                            {/* Target Grades */}
                            <section>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <GraduationCap size={16} className="text-muted" />
                                        <h3 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grade Levels</h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={selectAllGrades} style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>All</button>
                                        <button onClick={clearAllGrades} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>None</button>
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    padding: '12px',
                                    background: 'var(--bg-deep)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-sm)'
                                }}>
                                    {AVAILABLE_GRADES.map(grade => (
                                        <label
                                            key={grade.value}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '10px 14px',
                                                borderRadius: 'var(--radius-sm)',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                transition: 'background 0.2s',
                                                background: config.targetGrades.includes(grade.value) ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                                                border: `1px solid ${config.targetGrades.includes(grade.value) ? 'var(--success-muted)' : 'transparent'}`,
                                                color: config.targetGrades.includes(grade.value) ? 'var(--success)' : 'var(--text-secondary)'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={config.targetGrades.includes(grade.value)}
                                                onChange={() => toggleGrade(grade.value)}
                                                style={{ width: '16px', height: '16px' }}
                                            />
                                            {grade.label}
                                        </label>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Google Drive Integration */}
                        <section style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <Cloud size={16} className="text-muted" />
                                <h3 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cloud Synchronization</h3>
                            </div>
                            <div className="card" style={{ background: 'var(--bg-deep)', borderStyle: 'dashed' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={config.googleDrive.enabled}
                                            onChange={(e) => setConfig(prev => ({
                                                ...prev,
                                                googleDrive: { ...prev.googleDrive, enabled: e.target.checked }
                                            }))}
                                            style={{ width: '18px', height: '18px' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '14px' }}>Enable Google Drive Sync</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Automatically upload processed files to your cloud storage.</div>
                                        </div>
                                    </label>

                                    {config.googleDrive.enabled && (
                                        <>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>ROOT FOLDER ID</label>
                                                <input
                                                    type="text"
                                                    value={config.googleDrive.folderId}
                                                    onChange={(e) => setConfig(prev => ({
                                                        ...prev,
                                                        googleDrive: { ...prev.googleDrive, folderId: e.target.value }
                                                    }))}
                                                    placeholder="Enter Drive Folder ID"
                                                    style={{
                                                        padding: '10px 14px',
                                                        background: 'var(--bg-surface)',
                                                        border: '1px solid var(--border-subtle)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '13px'
                                                    }}
                                                />
                                            </div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={config.googleDrive.autoCleanup}
                                                    onChange={(e) => setConfig(prev => ({
                                                        ...prev,
                                                        googleDrive: { ...prev.googleDrive, autoCleanup: e.target.checked }
                                                    }))}
                                                    style={{ width: '16px', height: '16px' }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '13px' }}>Auto-Cleanup Local Storage</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Delete local copies after successful sync.</div>
                                                </div>
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Maintenance Actions */}
                        <section style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <Wrench size={16} className="text-muted" />
                                <h3 style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Maintenance & Tasks</h3>
                            </div>
                            <div className="grid-cols-2" style={{ gap: '12px' }}>
                                <button
                                    onClick={triggerSync}
                                    disabled={isSyncing || !config.googleDrive.enabled}
                                    className="btn btn-secondary"
                                    style={{ height: 'auto', padding: '16px', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                        <RefreshCcw size={16} className={isSyncing ? 'spin' : ''} />
                                        <span style={{ fontWeight: 600 }}>Force Cloud Sync</span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'left' }}>
                                        Synchronize all local resources with Google Drive now.
                                    </span>
                                </button>
                                <button
                                    onClick={triggerSort}
                                    disabled={isSorting}
                                    className="btn btn-secondary"
                                    style={{ height: 'auto', padding: '16px', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                        <HardDrive size={16} className={isSorting ? 'blink' : ''} />
                                        <span style={{ fontWeight: 600 }}>Trigger AI Sorting</span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'left' }}>
                                        Run Intelligent Categorization on your downloads.
                                    </span>
                                </button>
                            </div>
                        </section>

                        {/* Advanced Settings */}
                        <section style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="btn"
                                style={{
                                    width: '100%',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    background: 'var(--bg-surface-muted)',
                                    borderColor: 'var(--border-subtle)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Sliders size={16} />
                                    <span style={{ fontWeight: 600 }}>Precision & Logs</span>
                                </div>
                                {showAdvanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>

                            {showAdvanced && (
                                <div style={{ marginTop: '16px', padding: '20px', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <label style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                Confidence Threshold
                                            </label>
                                            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                                {(config.minConfidence * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="0.95"
                                            step="0.05"
                                            value={config.minConfidence}
                                            onChange={(e) => setConfig(prev => ({ ...prev, minConfidence: parseFloat(e.target.value) }))}
                                            style={{ width: '100%', cursor: 'pointer', height: '6px', background: 'var(--bg-surface)' }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                            <span>Lenient (50%)</span>
                                            <span>Optimal (65%)</span>
                                            <span>Strict (95%)</span>
                                        </div>
                                        <div style={{ marginTop: '12px', padding: '10px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.05)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                            <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                                {config.minConfidence >= 0.8 ? 'Strict mode minimizes false positives but may bypass valid resources.' :
                                                    config.minConfidence >= 0.65 ? 'Optimal balance for the Ghanaian educational landscape.' :
                                                        'Lenient mode maximizes discovery but increases risk of irrelevant downloads.'}
                                            </span>
                                        </div>
                                    </div>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '16px' }}>
                                        <input
                                            type="checkbox"
                                            checked={config.enableCaching}
                                            onChange={(e) => setConfig(prev => ({ ...prev, enableCaching: e.target.checked }))}
                                            style={{ width: '16px', height: '16px' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '13px' }}>AI Confidence Caching</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                Reuse classification results to save tokens and speed up recurring links.
                                            </div>
                                        </div>
                                    </label>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={config.logDecisions}
                                            onChange={(e) => setConfig(prev => ({ ...prev, logDecisions: e.target.checked }))}
                                            style={{ width: '16px', height: '16px' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '13px' }}>Decision Transparency Logs</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                Detailed AI reasoning outputs in the system logs.
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};
