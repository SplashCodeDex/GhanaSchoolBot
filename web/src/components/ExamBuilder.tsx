import React, { useState } from 'react';
import { ClipboardCheck, Sparkles, AlertCircle, Loader2, Save, FileText, CheckCircle2 } from 'lucide-react';
import { useAIGeneration } from '../hooks/useAIGeneration';
import type { ExamRequest } from '../hooks/useAIGeneration';

export const ExamBuilder: React.FC = () => {
    const { loading, error, generatedExam, generateExam, reset } = useAIGeneration();
    
    const [formData, setFormData] = useState<ExamRequest>({
        type: 'MOCK',
        subject: '',
        grade: '',
        topics: [],
        numQuestions: 10
    });

    const [topicsInput, setTopicsInput] = useState('');

    const examTypes = ['MOCK', 'BECE', 'WASSCE', 'TERM', 'CLASS_TEST', 'HOMEWORK'];
    
    const subjects = [
        "Mathematics", "English Language", "Science", "Social Studies", 
        "Computing", "ICT", "Career Technology", "Creative Arts", 
        "French", "Ghanaian Language", "Physics", "Chemistry", "Biology"
    ];

    const grades = ["JHS1", "JHS2", "JHS3", "SHS1", "SHS2", "SHS3"];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'numQuestions' ? parseInt(value) || 0 : value 
        }));
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
        try {
            await generateExam(formData);
        } catch (err) {
            console.error(err);
        }
    };

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

                    <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Topics (comma separated)</label>
                        <input 
                            name="topics" 
                            value={topicsInput} 
                            onChange={handleTopicsChange}
                            placeholder="e.g. Matter, Energy, Ecosystems"
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

                    <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                        <button type="button" onClick={reset} className="btn" disabled={loading}>Reset</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            {loading ? 'Generating Exam...' : 'Build Examination'}
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

            {generatedExam && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', flex: 1, minHeight: 0 }}>
                    <div className="card area-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 1, padding: '4px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
                                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Question Paper</h3>
                            </div>
                            <button className="btn btn-primary">
                                <Save size={14} />
                                Save Paper
                            </button>
                        </div>
                        <div style={{ 
                            whiteSpace: 'pre-wrap', 
                            fontFamily: 'var(--font-main)', 
                            fontSize: '14px', 
                            lineHeight: 1.6,
                            color: 'var(--text-primary)'
                        }}>
                            {generatedExam.paper}
                        </div>
                    </div>

                    <div className="card area-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 1, padding: '4px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Marking Scheme</h3>
                            </div>
                            <button className="btn" style={{ background: 'var(--bg-surface-elevated)' }}>
                                <Save size={14} />
                                Save Scheme
                            </button>
                        </div>
                        <div style={{ 
                            whiteSpace: 'pre-wrap', 
                            fontFamily: 'var(--font-main)', 
                            fontSize: '14px', 
                            lineHeight: 1.6,
                            color: 'var(--text-primary)'
                        }}>
                            {generatedExam.markingScheme}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
