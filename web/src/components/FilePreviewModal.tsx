import React from 'react';

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileUrl: string;
    fileName: string;
    fileType: string;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ isOpen, onClose, fileUrl, fileName, fileType }) => {
    if (!isOpen) return null;

    const isPdf = fileName.toLowerCase().endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }} onClick={onClose}>
            <div
                className="glass-panel"
                style={{
                    width: '90%',
                    height: '90%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    padding: 0,
                    background: '#1a1a20'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{fileName}</h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <a href={fileUrl} download className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                            Download
                        </a>
                        <button onClick={onClose} className="btn" style={{ padding: '6px 12px', fontSize: '13px' }}>
                            Close
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
                    {isPdf ? (
                        <iframe
                            src={fileUrl}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title="PDF Preview"
                        />
                    ) : isImage ? (
                        <img
                            src={fileUrl}
                            alt={fileName}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                    ) : (
                        <div style={{ textAlign: 'center', color: '#888' }}>
                            <p>Preview not available for this file type.</p>
                            <a href={fileUrl} download className="btn btn-primary">
                                Download File
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
