import React, { useState, useEffect } from 'react';
import { 
    Search, 
    BookOpen, 
    ChevronRight, 
    ChevronDown, 
    Info, 
    Sparkles, 
    Layers, 
    Target,
    Loader2,
    ArrowRight,
    Files,
    FileText
} from 'lucide-react';
import { useCurriculum } from '../hooks/useCurriculum';
import type { Level, Strand, SubStrand } from '../hooks/useCurriculum';

export const CurriculumExplorer: React.FC = () => {
    const { loading, getLevels, getSubjectsByGrade, getStructure, searchCurriculum, getMappings } = useCurriculum();
    
    const [levels, setLevels] = useState<Level[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // UI State for Tree
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
    const [selectedItem, setSelectedItem] = useState<any>(null);
    
    // Dynamic data cache
    const [gradeSubjects, setGradeSubjects] = useState<Record<string, string[]>>({});
    const [subjectStructures, setSubjectStructures] = useState<Record<string, Strand[]>>({});
    const [mappings, setMappings] = useState<any[]>([]);

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

    const linkedResources = selectedItem ? mappings.filter(m => m.curriculumNodeId === (selectedItem.id || selectedItem.subStrand?.id)) : [];

    const toggleNode = (id: string) => {
        setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleGradeExpand = async (gradeId: string) => {
        if (!expandedNodes[gradeId] && !gradeSubjects[gradeId]) {
            const subjects = await getSubjectsByGrade(gradeId);
            setGradeSubjects(prev => ({ ...prev, [gradeId]: subjects }));
        }
        toggleNode(gradeId);
    };

    const handleSubjectExpand = async (gradeId: string, subject: string) => {
        const nodeId = `${gradeId}-${subject}`;
        if (!expandedNodes[nodeId] && !subjectStructures[nodeId]) {
            const strands = await getStructure(gradeId, subject);
            setSubjectStructures(prev => ({ ...prev, [nodeId]: strands }));
        }
        toggleNode(nodeId);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        const results = await searchCurriculum(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 'var(--space-lg)', height: '100%' }}>
            {/* Left Panel: Tree & Search */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <Search size={18} style={{ color: 'var(--accent-primary)' }} />
                    <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Curriculum Explorer</h2>
                </div>

                <form onSubmit={handleSearch} style={{ position: 'relative' }}>
                    <input 
                        type="text" 
                        placeholder="Search topics (e.g. 'Photosynthesis')..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 35px 10px 12px',
                            background: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            fontSize: '13px'
                        }}
                    />
                    <button 
                        type="submit" 
                        style={{ 
                            position: 'absolute', 
                            right: '8px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer'
                        }}
                    >
                        {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    </button>
                </form>

                <div className="area-scroll" style={{ flex: 1 }}>
                    {searchQuery && searchResults.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                AI Search Results
                            </div>
                            {searchResults.map((res, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setSelectedItem(res)}
                                    className={`nav-item ${selectedItem?.id === (res.id || res.subStrand?.id) ? 'active' : ''}`}
                                    style={{ textAlign: 'left', padding: '10px', height: 'auto', flexDirection: 'column', alignItems: 'flex-start' }}
                                >
                                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{res.name || res.subStrand?.name || res.strand?.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                        {res.subject} • {res.gradeId?.toUpperCase()}
                                    </div>
                                </button>
                            ))}
                            <button 
                                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                                className="btn" 
                                style={{ marginTop: '8px', fontSize: '12px' }}
                            >
                                Clear Results
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {levels.map(level => (
                                <div key={level.id}>
                                    <div 
                                        onClick={() => toggleNode(level.id)}
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '8px', 
                                            padding: '8px 4px', 
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)'
                                        }}
                                    >
                                        {expandedNodes[level.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        <Layers size={14} style={{ color: 'var(--accent-primary)' }} />
                                        {level.name}
                                    </div>
                                    
                                    {expandedNodes[level.id] && (
                                        <div style={{ marginLeft: '20px' }}>
                                            {level.grades.map(grade => (
                                                <div key={grade.id}>
                                                    <div 
                                                        onClick={() => handleGradeExpand(grade.id)}
                                                        style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '8px', 
                                                            padding: '6px 4px', 
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            color: 'var(--text-secondary)'
                                                        }}
                                                    >
                                                        {expandedNodes[grade.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                        {grade.name}
                                                    </div>

                                                    {expandedNodes[grade.id] && gradeSubjects[grade.id] && (
                                                        <div style={{ marginLeft: '20px' }}>
                                                            {gradeSubjects[grade.id].map(subject => {
                                                                const nodeId = `${grade.id}-${subject}`;
                                                                return (
                                                                    <div key={nodeId}>
                                                                        <div 
                                                                            onClick={() => handleSubjectExpand(grade.id, subject)}
                                                                            style={{ 
                                                                                display: 'flex', 
                                                                                alignItems: 'center', 
                                                                                gap: '8px', 
                                                                                padding: '4px 4px', 
                                                                                cursor: 'pointer',
                                                                                fontSize: '13px',
                                                                                color: 'var(--text-muted)'
                                                                            }}
                                                                        >
                                                                            {expandedNodes[nodeId] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                                            <BookOpen size={12} />
                                                                            {subject}
                                                                        </div>

                                                                        {expandedNodes[nodeId] && subjectStructures[nodeId] && (
                                                                            <div style={{ marginLeft: '20px' }}>
                                                                                {subjectStructures[nodeId].map(strand => (
                                                                                    <div key={strand.id}>
                                                                                        <div 
                                                                                            onClick={() => toggleNode(strand.id)}
                                                                                            style={{ padding: '4px 4px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                                                        >
                                                                                            {expandedNodes[strand.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                                                            {strand.name}
                                                                                        </div>
                                                                                        {expandedNodes[strand.id] && (
                                                                                            <div style={{ marginLeft: '16px' }}>
                                                                                                {strand.subStrands.map(ss => (
                                                                                                    <div 
                                                                                                        key={ss.id}
                                                                                                        onClick={() => setSelectedItem({ ...ss, type: 'subStrand', subject, gradeId: grade.id, strandName: strand.name })}
                                                                                                        style={{ 
                                                                                                            padding: '4px 8px', 
                                                                                                            cursor: 'pointer', 
                                                                                                            fontSize: '12px', 
                                                                                                            color: selectedItem?.id === ss.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                                                                                                            borderLeft: '1px solid var(--border-subtle)',
                                                                                                            marginLeft: '4px'
                                                                                                        }}
                                                                                                    >
                                                                                                        {ss.name}
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Details */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {selectedItem ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                                    <Target size={14} />
                                    {selectedItem.type === 'subStrand' ? 'Sub-Strand Details' : 'Topic Details'}
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{selectedItem.name || selectedItem.subStrand?.name}</h3>
                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    {selectedItem.subject} • {selectedItem.gradeId?.toUpperCase()} • {selectedItem.strandName || selectedItem.strand?.name}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-lg)', marginTop: 'var(--space-md)' }}>
                            <div className="card" style={{ background: 'var(--bg-surface-elevated)', border: 'none' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0' }}>
                                    <Info size={16} className="text-accent-primary" />
                                    Description & Context
                                </h4>
                                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                                    {selectedItem.description || selectedItem.subStrand?.description || "No description available for this curriculum node."}
                                </p>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0' }}>
                                    <Sparkles size={16} className="text-success" />
                                    Learning Indicators
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {(selectedItem.indicators || selectedItem.subStrand?.indicators || []).map((indicator: string, i: number) => (
                                        <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                            <div style={{ color: 'var(--success)', fontWeight: 700 }}>{i + 1}.</div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{indicator}</div>
                                        </div>
                                    ))}
                                    {!(selectedItem.indicators || selectedItem.subStrand?.indicators)?.length && (
                                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                                            No specific indicators defined.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0' }}>
                                    <Files size={16} className="text-accent-primary" />
                                    Linked Local Resources
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {linkedResources.map((res, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                                            <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
                                            <div style={{ flex: 1, fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {res.filePath.split(/[/\\]/).pop()}
                                            </div>
                                            <button className="btn" style={{ padding: '4px 8px', fontSize: '11px' }}>Preview</button>
                                        </div>
                                    ))}
                                    {linkedResources.length === 0 && (
                                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', padding: '12px', background: 'var(--bg-surface-muted)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-subtle)' }}>
                                            No local resources linked to this topic yet.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginTop: 'var(--space-md)', padding: '16px', background: 'var(--bg-surface-muted)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Ready to generate content?</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Use this topic context in our AI tools.</div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button className="btn" style={{ fontSize: '12px' }}>
                                        Create Lesson Note
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', gap: '16px' }}>
                        <BookOpen size={48} opacity={0.2} />
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-secondary)' }}>No Topic Selected</div>
                            <div style={{ fontSize: '14px', maxWidth: '300px', marginTop: '4px' }}>
                                Browse the curriculum tree on the left or use AI search to explore specific topics and indicators.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
