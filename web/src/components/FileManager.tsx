import React, { useEffect, useState } from 'react';

// Icons as simple SVGs for zero-dep
const FolderIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', color: 'var(--accent-secondary)' }}>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
);

const FileIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', color: 'var(--text-secondary)' }}>
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
        <polyline points="13 2 13 9 20 9"></polyline>
    </svg>
);

interface FileItem {
    name: string;
    path: string; // Relative path from downloads/
    size: number;
    date: string;
    type: 'file' | 'directory';
    children?: FileItem[];
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

interface FileTreeItemProps {
    item: FileItem;
    onPreview: (file: FileItem) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ item, onPreview }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (item.type === 'directory') {
        return (
            <div style={{ marginLeft: '16px' }}>
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '4px',
                        transition: 'background 0.2s',
                        color: 'var(--text-primary)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <span style={{ marginRight: '4px', fontSize: '10px', color: '#666' }}>{isOpen ? '▼' : '▶'}</span>
                    <FolderIcon />
                    <span>{item.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>Folder</span>
                </div>
                {isOpen && item.children && (
                    <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', marginLeft: '7px' }}>
                        {item.children.map((child) => (
                            <FileTreeItem key={child.path} item={child} onPreview={onPreview} />
                        ))}
                        {item.children.length === 0 && <div style={{ padding: '8px 24px', fontStyle: 'italic', color: '#555' }}>Empty</div>}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            onClick={() => onPreview(item)}
            style={{
                marginLeft: '24px', // Indent for files
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.02)',
                cursor: 'pointer',
                transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
            <FileIcon />
            <span style={{ color: '#ddd' }}>{item.name}</span>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
                {formatBytes(item.size)}
            </span>
        </div>
    );
};

interface FileManagerProps {
    onPreview?: (file: FileItem) => void;
}

export const FileManager: React.FC<FileManagerProps> = ({ onPreview }) => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/files');
            const data = await res.json();
            setFiles(data);
        } catch (err) {
            console.error("Failed to load files", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
        const interval = setInterval(fetchFiles, 30000);
        return () => clearInterval(interval);
    }, []);

    const handlePreview = (file: FileItem) => {
        if (onPreview) {
            onPreview(file);
        }
    }

    return (
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{
                padding: '16px',
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.02)'
            }}>
                <h3 style={{ fontSize: '16px', margin: 0 }}>Storage Manager</h3>
                <button onClick={fetchFiles} className="btn" style={{ padding: '4px 12px', fontSize: '12px' }}>
                    Refresh
                </button>
            </div>

            <div style={{ padding: '16px', minHeight: '200px', maxHeight: '500px', overflowY: 'auto' }}>
                {loading && files.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Loading files...</div>
                ) : files.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No files found in downloads.</div>
                ) : (
                    files.map((item) => (
                        <FileTreeItem key={item.path} item={item} onPreview={handlePreview} />
                    ))
                )}
            </div>
        </div>
    );
};
