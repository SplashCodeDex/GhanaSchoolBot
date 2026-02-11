import React, { useState } from 'react';
import { BookOpen, Sparkles, AlertCircle, Loader2, Save, FileText, Download as DownloadIcon, CheckCircle2 } from 'lucide-react';
import { useAIGeneration } from '../hooks/useAIGeneration';
import { ContentPreview } from './ContentPreview';

export const LessonNoteGenerator: React.FC = () => {
    const { loading, error, generatedNote, generateLessonNote, saveContent, reset } = useAIGeneration();
    const [savedStatus, setSavedStatus] = useState<string | null>(null);
    
    const [formData, setFormData] = useState({
        subject: '',
        grade: '',
        strand: '',
        subStrand: '',
        additionalInstructions: ''
    });

    const subjects = [
        "Mathematics", "English Language", "Science", "Social Studies", 
        "Computing", "ICT", "Career Technology", "Creative Arts", 
        "French", "Ghanaian Language", "Physics", "Chemistry", "Biology"
    ];

    const grades = ["JHS1", "JHS2", "JHS3", "SHS1", "SHS2", "SHS3"];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavedStatus(null);
        try {
            await generateLessonNote(formData);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        if (!generatedNote) return;
        try {
            const filename = `${formData.subject}_${formData.grade}_${formData.strand}`.replace(/\s+/g, '_');
            await saveContent(filename, generatedNote, 'lesson-notes');
            setSavedStatus('Lesson note saved successfully!');
            setTimeout(() => setSavedStatus(null), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    const handleExport = () => {
        if (!generatedNote) return;
        const blob = new Blob([generatedNote], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LessonNote_${formData.subject}_${formData.grade}.md`.replace(/\s+/g, '_');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', height: '100%' }}>
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                    <BookOpen size={20} style={{ color: 'var(--accent-primary)' }} />
                    <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>AI Lesson Note Generator</h2>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Subject</label>
                        <select 
                            name="subject" 
                            value={formData.subject} 
                            onChange={handleInputChange}
                            required
                            style={{ 
                                padding: '8px', 
                                background: 'var(--bg-surface-elevated)', 
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                borderRadius: 'var(--radius-sm)'
                            }}
                        >
                            <option value="">Select Subject</option>
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Grade Level</label>
                        <select 
                            name="grade" 
                            value={formData.grade} 
                            onChange={handleInputChange}
                            required
                            style={{ 
                                padding: '8px', 
                                background: 'var(--bg-surface-elevated)', 
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                borderRadius: 'var(--radius-sm)'
                            }}
                        >
                            <option value="">Select Grade</option>
                            {grades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Strand</label>
                        <input 
                            name="strand" 
                            value={formData.strand} 
                            onChange={handleInputChange}
                            placeholder="e.g. Number"
                            required
                            style={{ 
                                padding: '8px', 
                                background: 'var(--bg-surface-elevated)', 
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                borderRadius: 'var(--radius-sm)'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sub-strand</label>
                        <input 
                            name="subStrand" 
                            value={formData.subStrand} 
                            onChange={handleInputChange}
                            placeholder="e.g. Integers"
                            required
                            style={{ 
                                padding: '8px', 
                                background: 'var(--bg-surface-elevated)', 
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                borderRadius: 'var(--radius-sm)'
                            }}
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Additional Instructions (Optional)</label>
                        <textarea 
                            name="additionalInstructions" 
                            value={formData.additionalInstructions} 
                            onChange={handleInputChange}
                            placeholder="Add specific focus or requirements..."
                            style={{ 
                                padding: '8px', 
                                background: 'var(--bg-surface-elevated)', 
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                borderRadius: 'var(--radius-sm)',
                                minHeight: '80px',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                        <button type="button" onClick={() => { reset(); setSavedStatus(null); }} className="btn" disabled={loading}>Reset</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            {loading ? 'Generating...' : 'Generate Lesson Note'}
                        </button>
                    </div>
                </form>
            </div>

            {error && (
                <div className="card" style={{ borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                        <AlertCircle size={18} />
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{error}</span>
                    </div>
                </div>
            )}

            {savedStatus && (
                <div className="card" style={{ borderColor: 'var(--success)', background: 'rgba(16, 185, 129, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                        <CheckCircle2 size={18} />
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{savedStatus}</span>
                    </div>
                </div>
            )}

            {generatedNote && (
                <div className="card area-scroll" style={{ flex: 1, position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 1, padding: '4px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={18} style={{ color: 'var(--success)' }} />
                            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Generated Preview</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn" onClick={handleExport} style={{ background: 'var(--bg-surface-elevated)' }}>
                                <DownloadIcon size={14} />
                                Export MD
                            </button>
                            <button className="btn btn-primary" onClick={handleSave} style={{ background: 'var(--success)' }}>
                                <Save size={14} />
                                Save Note
                            </button>
                        </div>
                    </div>
                    <ContentPreview content={generatedNote} />
                </div>
            )}
        </div>
    );
};
