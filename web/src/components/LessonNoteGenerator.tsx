import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, AlertCircle, Loader2, Save, FileText, Download as DownloadIcon, CheckCircle2, Info } from 'lucide-react';
import { useAIGeneration } from '../hooks/useAIGeneration';
import { useCurriculum } from '../hooks/useCurriculum';
import type { Level, Strand, SubStrand } from '../hooks/useCurriculum';
import { ContentPreview } from './ContentPreview';

export const LessonNoteGenerator: React.FC = () => {
    const [savedStatus, setSavedStatus] = useState<string | null>(null);
    const [levels, setLevels] = useState<Level[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [strands, setStrands] = useState<Strand[]>([]);
    const [availableSubStrands, setAvailableSubStrands] = useState<SubStrand[]>([]);
    
    const [formData, setFormData] = useState({
        subject: '',
        grade: '',
        strand: '',
        subStrand: '',
        additionalInstructions: ''
    });

    const [useLocalContext, setUseLocalContext] = useState(false);
    const [mappings, setMappings] = useState<any[]>([]);

    const { loading: aiLoading, error: aiError, generatedNote, generateLessonNote, saveContent, reset } = useAIGeneration();
    const { loading: curriculumLoading, getLevels, getSubjectsByGrade, getStructure, getMappings } = useCurriculum();

    // Initial load: Fetch levels and mappings
    useEffect(() => {
        const init = async () => {
            const [levelsData, mappingsData] = await Promise.all([
                getLevels(),
                getMappings()
            ]);
            setLevels(levelsData);
            setMappings(mappingsData);
        };
        init();
    }, [getLevels, getMappings]);

    // When grade changes: Fetch subjects
    useEffect(() => {
        if (formData.grade) {
            const loadSubjects = async () => {
                const data = await getSubjectsByGrade(formData.grade.toLowerCase());
                setSubjects(data);
                setFormData(prev => ({ ...prev, subject: '', strand: '', subStrand: '' }));
            };
            loadSubjects();
        } else {
            setSubjects([]);
        }
    }, [formData.grade, getSubjectsByGrade]);

    // When subject changes: Fetch structure
    useEffect(() => {
        if (formData.grade && formData.subject) {
            const loadStructure = async () => {
                const data = await getStructure(formData.grade.toLowerCase(), formData.subject);
                setStrands(data);
                setFormData(prev => ({ ...prev, strand: '', subStrand: '' }));
            };
            loadStructure();
        } else {
            setStrands([]);
        }
    }, [formData.grade, formData.subject, getStructure]);

    // When strand changes: Update sub-strands
    useEffect(() => {
        if (formData.strand) {
            const selectedStrand = strands.find(s => s.name === formData.strand);
            setAvailableSubStrands(selectedStrand?.subStrands || []);
            setFormData(prev => ({ ...prev, subStrand: '' }));
        } else {
            setAvailableSubStrands([]);
        }
    }, [formData.strand, strands]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavedStatus(null);
        try {
            let referencedContent: string[] = [];
            if (useLocalContext && formData.subStrand) {
                const selectedSubStrand = availableSubStrands.find(ss => ss.name === formData.subStrand);
                if (selectedSubStrand) {
                    const linkedFiles = mappings.filter(m => m.curriculumNodeId === selectedSubStrand.id);
                    // For now, we'll send the file paths and the AI will use knowledge of them
                    // Ideally we fetch snippets, but simple RAG Lite starts here
                    referencedContent = linkedFiles.map(f => `Source File: ${f.filePath}`);
                }
            }
            await generateLessonNote({ ...formData, referencedContent });
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

    const loading = aiLoading || curriculumLoading;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', height: '100%' }}>
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <BookOpen size={20} style={{ color: 'var(--accent-primary)' }} />
                        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>AI Lesson Note Generator</h2>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Info size={14} />
                        Use <strong>Curriculum Explorer</strong> to find topics.
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
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
                            {levels.map(level => (
                                <optgroup key={level.id} label={level.name}>
                                    {level.grades.map(g => (
                                        <option key={g.id} value={g.id.toUpperCase()}>{g.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Subject</label>
                        <select 
                            name="subject" 
                            value={formData.subject} 
                            onChange={handleInputChange}
                            required
                            disabled={!formData.grade}
                            style={{ 
                                padding: '8px', 
                                background: 'var(--bg-surface-elevated)', 
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                borderRadius: 'var(--radius-sm)',
                                opacity: formData.grade ? 1 : 0.5
                            }}
                        >
                            <option value="">Select Subject</option>
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Strand</label>
                        <select 
                            name="strand" 
                            value={formData.strand} 
                            onChange={handleInputChange}
                            required
                            disabled={!formData.subject}
                            style={{ 
                                padding: '8px', 
                                background: 'var(--bg-surface-elevated)', 
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                borderRadius: 'var(--radius-sm)',
                                opacity: formData.subject ? 1 : 0.5
                            }}
                        >
                            <option value="">Select Strand</option>
                            {strands.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sub-strand</label>
                        <select 
                            name="subStrand" 
                            value={formData.subStrand} 
                            onChange={handleInputChange}
                            required
                            disabled={!formData.strand}
                            style={{ 
                                padding: '8px', 
                                background: 'var(--bg-surface-elevated)', 
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                borderRadius: 'var(--radius-sm)',
                                opacity: formData.strand ? 1 : 0.5
                            }}
                        >
                            <option value="">Select Sub-strand</option>
                            {availableSubStrands.map(ss => <option key={ss.id} value={ss.name}>{ss.name}</option>)}
                        </select>
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

                    <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                        <input
                            type="checkbox"
                            id="useLocalContext"
                            checked={useLocalContext}
                            onChange={(e) => setUseLocalContext(e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label htmlFor="useLocalContext" style={{ fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Use Linked Resources (RAG Lite)</label>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ground AI in the content of mapped PDFs for higher accuracy.</span>
                        </div>
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                        <button type="button" onClick={() => { reset(); setSavedStatus(null); }} className="btn" disabled={loading}>Reset</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            {loading ? 'Processing...' : 'Generate Lesson Note'}
                        </button>
                    </div>
                </form>
            </div>

            {aiError && (
                <div className="card" style={{ borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                        <AlertCircle size={18} />
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{aiError}</span>
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
