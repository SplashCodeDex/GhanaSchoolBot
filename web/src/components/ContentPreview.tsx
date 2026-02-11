import React from 'react';
import ReactMarkdown from 'react-markdown';

interface ContentPreviewProps {
    content: string;
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({ content }) => {
    return (
        <div className="markdown-preview" style={{ 
            color: 'var(--text-primary)',
            fontSize: '14px',
            lineHeight: 1.6,
            fontFamily: 'var(--font-main)'
        }}>
            <ReactMarkdown
                components={{
                    h1: ({node, ...props}) => <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }} {...props} />,
                    h2: ({node, ...props}) => <h2 style={{ fontSize: '20px', fontWeight: 600, marginTop: '24px', marginBottom: '12px' }} {...props} />,
                    h3: ({node, ...props}) => <h3 style={{ fontSize: '18px', fontWeight: 600, marginTop: '20px', marginBottom: '8px' }} {...props} />,
                    p: ({node, ...props}) => <p style={{ marginBottom: '16px' }} {...props} />,
                    ul: ({node, ...props}) => <ul style={{ marginBottom: '16px', paddingLeft: '24px' }} {...props} />,
                    ol: ({node, ...props}) => <ol style={{ marginBottom: '16px', paddingLeft: '24px' }} {...props} />,
                    li: ({node, ...props}) => <li style={{ marginBottom: '4px' }} {...props} />,
                    strong: ({node, ...props}) => <strong style={{ fontWeight: 600, color: 'var(--accent-primary)' }} {...props} />,
                    code: ({node, ...props}) => <code style={{ background: 'var(--bg-surface-elevated)', padding: '2px 4px', borderRadius: '4px', fontFamily: 'monospace' }} {...props} />,
                    blockquote: ({node, ...props}) => <blockquote style={{ borderLeft: '4px solid var(--accent-primary)', paddingLeft: '16px', margin: '16px 0', color: 'var(--text-secondary)', fontStyle: 'italic' }} {...props} />
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
