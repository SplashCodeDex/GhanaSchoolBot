import {
    LayoutDashboard,
    Terminal,
    Files,
    Settings,
    Power,
    Activity,
    BookOpen,
    ClipboardCheck,
    FileEdit,
    MessageSquare,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: any) => void;
    connected: boolean;
    isRunning: boolean;
    onStart: () => void;
    onStop: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    onTabChange,
    connected,
    isRunning,
    onStart,
    onStop,
    isCollapsed,
    onToggleCollapse
}) => {
    const navItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'process', label: 'Process', icon: Terminal },
        { id: 'resources', label: 'Resources', icon: Files },
        { id: 'lesson-notes', label: 'Lesson Notes', icon: FileEdit },
        { id: 'exams', label: 'Exam Builder', icon: ClipboardCheck },
        { id: 'chatbot', label: 'AI Assistant', icon: MessageSquare },
        { id: 'settings', label: 'Settings', icon: Settings }
    ];

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div style={{ padding: isCollapsed ? '24px 12px' : '24px', borderBottom: '1px solid var(--border-subtle)', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                    <BookOpen size={20} className="text-accent-primary" />
                    {!isCollapsed && <h1 style={{ fontSize: '16px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>GhanaSchoolBot</h1>}
                </div>
                {!isCollapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`status-dot ${connected ? 'status-online' : 'status-offline'}`} />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                            {connected ? 'CONNECTED' : 'DISCONNECTED'}
                        </span>
                    </div>
                )}

                <button
                    onClick={onToggleCollapse}
                    style={{
                        position: 'absolute',
                        right: '-12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 10
                    }}
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            <nav style={{ flex: 1, padding: '16px 0' }}>
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => onTabChange(item.id)}
                        title={isCollapsed ? item.label : ''}
                        style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px 16px' }}
                    >
                        <item.icon size={18} />
                        {!isCollapsed && <span>{item.label}</span>}
                    </button>
                ))}
            </nav>

            <div style={{ padding: isCollapsed ? '16px 8px' : '16px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface-muted)' }}>
                {!isCollapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={14} className={isRunning ? 'text-success' : 'text-muted'} />
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>Bot Engine</span>
                        </div>
                        <span style={{ fontSize: '10px', padding: '2px 6px', background: isRunning ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-elevated)', color: isRunning ? 'var(--success)' : 'var(--text-muted)', borderRadius: '4px', border: '1px solid transparent' }}>
                            {isRunning ? 'RUNNING' : 'IDLE'}
                        </span>
                    </div>
                )}

                <button
                    onClick={isRunning ? onStop : onStart}
                    className={`btn ${isRunning ? 'btn-danger' : 'btn-primary'}`}
                    style={{ width: '100%', justifyContent: 'center', height: '36px', padding: isCollapsed ? '0' : 'var(--space-sm) var(--space-md)' }}
                    title={isCollapsed ? (isRunning ? 'Stop Scraper' : 'Start Scraper') : ''}
                >
                    <Power size={14} />
                    {!isCollapsed && <span>{isRunning ? 'Stop Scraper' : 'Start Scraper'}</span>}
                </button>
            </div>
        </aside>
    );
};
