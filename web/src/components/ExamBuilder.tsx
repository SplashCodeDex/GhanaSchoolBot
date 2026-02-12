import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Sparkles, AlertCircle, Loader2, Save, FileText, CheckCircle2, Download as DownloadIcon, Info } from 'lucide-react';
import { useAIGeneration } from '../hooks/useAIGeneration';
import type { ExamRequest } from '../hooks/useAIGeneration';
import { useCurriculum } from '../hooks/useCurriculum';
import type { Level, Strand, SubStrand } from '../hooks/useCurriculum';
import { ContentPreview } from './ContentPreview';

export const ExamBuilder: React.FC = () => {
    const { loading: aiLoading, error: aiError, generatedExam, generateExam, saveContent, reset } = useAIGeneration();
    const { loading: curriculumLoading, getLevels, getSubjectsByGrade, getStructure } = useCurriculum();
    
    const [savedStatus, setSavedStatus] = useState<string | null>(null);
    const [levels, setLevels] = useState<Level[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [strands, setStrands] = useState<Strand[]>([]);
    const [availableSubStrands, setAvailableSubStrands] = useState<SubStrand[]>([]);

    const [formData, setFormData] = useState<ExamRequest>({
        type: 'MOCK',
        subject: '',
        grade: '',
        strand: '',
        subStrand: '',
        topics: [],
        numQuestions: 10,
        includeTheory: true,
        includeObjectives: true
    });

    const [customInstructions, setCustomInstructions] = useState('');
    const [topicsInput, setTopicsInput] = useState('');

    const examTypes = ['MOCK', 'BECE', 'WASSCE', 'TERM', 'CLASS_TEST', 'HOMEWORK'];

    // Initial load: Fetch levels
    useEffect(() => {
        const loadLevels = async () => {
            const data = await getLevels();
            setLevels(data);
        };
        loadLevels();
    }, [getLevels]);

    // When grade changes: Fetch subjects
    useEffect(() => {
        if (formData.grade) {
            const loadSubjects = async () => {
                const data = await getSubjectsByGrade(formData.grade.toLowerCase());
                setSubjects(data);
                setFormData(prev => ({ ...prev, subject: '', strand: '', subStrand: '', topics: [] }));
                setTopicsInput('');
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
                setFormData(prev => ({ ...prev, strand: '', subStrand: '', topics: [] }));
                setTopicsInput('');
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
            setFormData(prev => ({ ...prev, subStrand: '', topics: [] }));
            setTopicsInput('');
        } else {
            setAvailableSubStrands([]);
        }
    }, [formData.strand, strands]);

    // When sub-strand changes: Update topics/indicators
    useEffect(() => {
        if (formData.subStrand) {
            const selectedSubStrand = availableSubStrands.find(ss => ss.name === formData.subStrand);
            if (selectedSubStrand) {
                const indicators = selectedSubStrand.indicators || [];
                setFormData(prev => ({ ...prev, topics: indicators }));
                setTopicsInput(indicators.join(', '));
            }
        }
    }, [formData.subStrand, availableSubStrands]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;

        setFormData(prev => {
            const newState = {
                ...prev,
                [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                    name === 'numQuestions' ? parseInt(value) || 0 : value
            };
            return newState;
        });
    };

    const handleTopicsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTopicsInput(val);
        setFormData(prev => ({
            ...prev,
            topics: val.split(',').map(t => t.trim()).filter(t => t !== '')
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavedStatus(null);
        try {
            await generateExam(formData);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async (content: string, subType: 'Paper' | 'Scheme') => {
        if (!generatedExam) return;
        try {
            const filename = `${formData.type}_${formData.subject}_${formData.grade}_${subType}`.replace(/\s+/g, '_');
            await saveContent(filename, content, 'exams');
            setSavedStatus(`${subType} saved successfully!`);
            setTimeout(() => setSavedStatus(null), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    const handleExport = (content: string, subType: 'Paper' | 'Scheme') => {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formData.type}_${formData.subject}_${formData.grade}_${subType}.md`.replace(/\s+/g, '_');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const loading = aiLoading || curriculumLoading;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', height: '100%' }}>
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                    <ClipboardCheck size={20} style={{ color: 'var(--accent-primary)' }} />
                    <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>AI Examination Builder</h2>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Exam Type</label>
                        <select
                            name="type"
                            value={formData.type}
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
                            {examTypes.map(t => <option key={t} value={t}>{t}</option>)}
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
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Strand (Curriculum)</label>
                        <select
                            name="strand"
                            value={formData.strand}
                            onChange={handleInputChange}
                            disabled={!formData.subject}
                            required
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
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sub-Strand</label>
                        <select
                            name="subStrand"
                            value={formData.subStrand}
                            onChange={handleInputChange}
                            disabled={!formData.strand}
                            required
                            style={{
                                padding: '8px',
                                background: 'var(--bg-surface-elevated)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                borderRadius: 'var(--radius-sm)',
                                opacity: formData.strand ? 1 : 0.5
                            }}
                        >
                            <option value="">Select Sub-Strand</option>
                            {availableSubStrands.map(ss => <option key={ss.id} value={ss.name}>{ss.name}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Number of Questions</label>
                        <input
                            type="number"
                            name="numQuestions"
                            value={formData.numQuestions}
                            onChange={handleInputChange}
                            min="1"
                            max="50"
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

                    <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Topics to Cover
                            <span title="Auto-populated from curriculum selection, but can be manually edited.">
                                <Info size={12} />
                            </span>
                        </label>
                        <input
                            name="topics"
                            value={topicsInput}
                            onChange={handleTopicsChange}
                            placeholder="e.g. Matter, Energy, Ecosystems"
                            required
                            style={{
                                padding: '10px',
                                background: 'var(--bg-surface-elevated)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                borderRadius: 'var(--radius-sm)',
                                width: '100%'
                            }}
                        />
                    </div>

                    <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Specific Instructions / Rubric (Optional)</label>
                        <textarea
                            name="customInstructions"
                            value={customInstructions}
                            onChange={(e) => setCustomInstructions(e.target.value)}
                            placeholder="e.g. Candidates should answer all questions in Section A and any two in Section B."
                            style={{
                                padding: '10px',
                                background: 'var(--bg-surface-elevated)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                borderRadius: 'var(--radius-sm)',
                                minHeight: '60px',
                                resize: 'vertical',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div style={{ gridColumn: 'span 3', display: 'flex', gap: 'var(--space-xl)', background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                id="includeObjectives"
                                name="includeObjectives"
                                checked={formData.includeObjectives}
                                onChange={handleInputChange}
                                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                            />
                            <label htmlFor="includeObjectives" style={{ fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Include Objective Questions (Section A)</label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                id="includeTheory"
                                name="includeTheory"
                                checked={formData.includeTheory}
                                onChange={handleInputChange}
                                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                            />
                            <label htmlFor="includeTheory" style={{ fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Include Theory Questions (Section B)</label>
                        </div>
                    </div>

                    <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                        <button type="button" onClick={() => { reset(); setSavedStatus(null); }} className="btn" disabled={loading}>Reset</button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || (!formData.includeTheory && !formData.includeObjectives)}
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            {loading ? 'Processing...' : 'Build Examination'}
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

            {generatedExam && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', flex: 1, minHeight: 0 }}>
                    <div className="card area-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 1, padding: '4px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
                                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Question Paper</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn" onClick={() => handleExport(generatedExam.paper, 'Paper')} style={{ background: 'var(--bg-surface-elevated)' }}>
                                    <DownloadIcon size={14} />
                                    Export
                                </button>
                                <button className="btn btn-primary" onClick={() => handleSave(generatedExam.paper, 'Paper')}>
                                    <Save size={14} />
                                    Save
                                </button>
                            </div>
                        </div>
                        <ContentPreview content={generatedExam.paper} />
                    </div>

                    <div className="card area-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 1, padding: '4px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Marking Scheme</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn" onClick={() => handleExport(generatedExam.markingScheme, 'Scheme')} style={{ background: 'var(--bg-surface-elevated)' }}>
                                    <DownloadIcon size={14} />
                                    Export
                                </button>
                                <button className="btn btn-primary" style={{ background: 'var(--success)' }} onClick={() => handleSave(generatedExam.markingScheme, 'Scheme')}>
                                    <Save size={14} />
                                    Save
                                </button>
                            </div>
                        </div>
                        <ContentPreview content={generatedExam.markingScheme} />
                    </div>
                </div>
            )}
        </div>
    );
};
